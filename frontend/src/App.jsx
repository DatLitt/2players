import { useEffect, useState, useRef } from 'react';
import GameContainer from './components/GameContainer';

function App() {
  const wsRef = useRef(null);
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [game, setGame] = useState('');
  const [players, setPlayers] = useState([]);
  const [host, setHost] = useState(false);
  const [ready, setReady] = useState([false, false]);
  const [gameState, setGameState] = useState(null);
  const [inGame, setInGame] = useState(false);
  const [playerIndex, setPlayerIndex] = useState(null);
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);
  const [score, setScore] = useState({ host: 0, guest: 0 });
  const games = [
    { name: 'tictactoe', UI: 'Tic Tac Toe', available: true },
    { name: 'battleship', UI: 'Battleship', available: true },
    { name: '', UI: null, available: false },
  ];

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
    wsRef.current = new WebSocket(WS_URL);

    wsRef.current.onopen = () => {
      console.log('Connected to server');
    };

    wsRef.current.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      if (data.type === 'roomCreated') {
        setRoomCode(data.payload.roomCode);
        setPlayers(data.payload.players);
        setHost(data.payload.isHost);
        setScore(data.payload.score || { host: 0, guest: 0 });
      }

      if (data.type === 'roomJoined') {
        setRoomCode(data.payload.roomCode);
        setPlayers(data.payload.players);
        setHost(data.payload.isHost);
        setGame(data.payload.game); // set current game selection when joining
        setScore(data.payload.score || { host: 0, guest: 0 });
      }
      if (data.type === 'roomUpdated') {
        setRoomCode(data.payload.roomCode);
        setPlayers(data.payload.players);
        setHost(data.payload.isHost);
        setGame(data.payload.game);
        setReady(data.payload.ready);
        setScore(data.payload.score || { host: 0, guest: 0 });
        setGameState(null);
        setInGame(false);
        setPlayerIndex(null);
      }
      if (data.type === 'roomClosed') {
        alert(data.payload.message);
        setRoomCode('');
        setPlayers([]);
        setHost(false);
        setGame('');
        setReady([false, false]);
        setScore({ host: 0, guest: 0 });
        setGameState(null);
        setInGame(false);
        setPlayerIndex(null);
      }
      if (data.type === 'gameSelected') {
        setGame(data.payload.game);
      }
      if (data.type === 'playerReady') {
        setReady(data.payload.ready);
      }
      if (data.type === 'gameStarted') {
        setGame(data.payload.game);
        setGameState(data.payload.gameState);
        setPlayerIndex(data.payload.playerIndex); // <-- add this
        setInGame(true);
      }
      if (data.type === 'gameUpdate') {
        setGameState(data.payload);
      }
      if (data.type === 'backToRoom') {
        setGame(null);
        setGameState(null);
        setReady(data.payload.ready);
        setScore(data.payload.score || { host: 0, guest: 0 });
        setInGame(false);
      }

      if (data.type === 'error') {
        alert(data.message);
      }
    };

    return () => wsRef.current?.close();
  }, []);

  const createRoom = () => {
    wsRef.current?.send(JSON.stringify({ type: 'createRoom' }));
  };

  const joinRoom = () => {
    if (!inputCode) return;
    wsRef.current?.send(
      JSON.stringify({
        type: 'joinRoom',
        payload: { roomCode: inputCode.toUpperCase() },
      }),
    );
  };
  const selectGame = (selectedGame) => {
    wsRef.current?.send(
      JSON.stringify({
        type: 'selectGame',
        payload: { game: selectedGame },
      }),
    );
  };

  const sendReady = () => {
    wsRef.current?.send(JSON.stringify({ type: 'playerReady' }));
  };

  const startGame = () => {
    wsRef.current?.send(JSON.stringify({ type: 'startGame' }));
  };

  const makeMove = (payload) => {
    wsRef.current?.send(
      JSON.stringify({
        type: 'makeMove',
        payload, // send the full payload object
      }),
    );
  };

  const restartGame = () => {
    wsRef.current?.send(JSON.stringify({ type: 'restartGame' }));
  };
  const backToRoom = () => {
    wsRef.current?.send(JSON.stringify({ type: 'backToRoom' }));
  };
  const copyRoomCode = async () => {
    if (!roomCode) return;

    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedRoomCode(true);
      window.setTimeout(() => setCopiedRoomCode(false), 1200);
    } catch {
      alert(`Copy this room code: ${roomCode}`);
    }
  };
  const roomPlayers = host
    ? [
        {
          label: 'You',
          status: 'Host',
          active: true,
          score: score.host ?? 0,
          tone: 'bg-blue-500 text-white',
        },
        {
          label: players.length > 1 ? 'Guest' : 'Waiting for guest',
          status:
            players.length > 1
              ? ready[1]
                ? 'Ready'
                : 'Not ready'
              : 'Not here yet',
          active: players.length > 1,
          score: score.guest ?? 0,
          tone:
            players.length > 1
              ? ready[1]
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700'
              : 'bg-gray-200 text-gray-500',
        },
      ]
    : [
        {
          label: 'Host',
          status: 'Host',
          active: true,
          score: score.host ?? 0,
          tone: 'bg-blue-500 text-white',
        },
        {
          label: 'You',
          status: ready[1] ? 'Ready' : 'Not ready',
          active: true,
          score: score.guest ?? 0,
          tone: ready[1]
            ? 'bg-green-500 text-white'
            : 'bg-gray-200 text-gray-700',
        },
      ];

  if (inGame) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <GameContainer
          game={game}
          gameState={gameState}
          makeMove={makeMove}
          restartGame={restartGame}
          backToRoom={backToRoom}
          playerIndex={playerIndex} // <-- pass playerIndex
        />
      </div>
    );
  }
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-between bg-gray-800 p-10 text-center">
      {!roomCode && (
        <>
          <h1 className="text-4xl font-bold text-yellow-200">Game Hub</h1>
          <button
            className="h-20 w-full rounded-xl bg-blue-500 text-2xl font-bold text-white"
            onClick={createRoom}
          >
            Create Room
          </button>
          <div className="flex h-20 w-full items-center justify-center rounded-xl bg-blue-200">
            <input
              className="h-full w-full rounded-l-xl border-none bg-blue-100 p-3 text-center text-2xl outline-none"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Enter room code"
            />
            <button
              className="h-full w-[40%] rounded-r-xl bg-blue-500 text-2xl font-bold text-white"
              onClick={joinRoom}
            >
              Join
            </button>
          </div>
        </>
      )}
      {roomCode && (
        <>
          <button
            type="button"
            onClick={copyRoomCode}
            className="rounded-2xl border border-yellow-200/30 bg-black/10 px-4 py-2 text-4xl font-bold text-yellow-200 transition hover:bg-black/20 active:scale-[0.99]"
          >
            Room: {roomCode}
            <span className="ml-3 text-sm font-semibold text-yellow-100/80">
              {copiedRoomCode ? 'Copied' : 'Tap to copy'}
            </span>
          </button>

          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-left text-sm font-semibold tracking-[0.2em] text-yellow-100/80 uppercase">
                Players
              </p>
              <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold text-yellow-100">
                {players.length}/2
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {roomPlayers.map((player) => (
                <div
                  key={player.label}
                  className={`flex min-h-28 flex-col items-center justify-center rounded-2xl border border-white/10 px-3 py-4 text-center ${player.tone}`}
                >
                  <div
                    className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-lg font-bold ${player.active ? 'bg-white/15' : 'bg-white/10'}`}
                  >
                    {player.label === 'Host'
                      ? 'H'
                      : player.label === 'Guest'
                        ? 'G'
                        : 'Y'}
                  </div>
                  <p className="text-sm font-semibold">{player.label}</p>
                  <p className="text-xs opacity-80">{player.status}</p>
                  <p className="mt-1 text-xs font-semibold opacity-90">
                    Score: {player.score}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* {host && ( */}
          <div className="grid h-full w-full grid-cols-1 gap-4 md:grid-cols-3">
            {games.map((g) => (
              <button
                key={g.name}
                onClick={() => g.available && selectGame(g.name)}
                disabled={!g.available}
                className={`h-24 w-full rounded-xl border text-lg font-semibold capitalize transition ${
                  !g.available
                    ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                    : game === g.name
                      ? 'bg-blue-500 text-white ring-4 ring-blue-300'
                      : 'cursor-pointer bg-blue-100 hover:bg-gray-100'
                }`}
              >
                {!g.available
                  ? `${g.name} (Coming Soon)`
                  : game === g.name
                    ? `${g.UI} ✓`
                    : g.UI}
              </button>
            ))}
          </div>
          {/* )} */}
          <div className="w-full">
            {!host && (
              <button
                className={`h-20 w-full rounded-xl text-2xl font-semibold text-white transition ${ready[1] ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'}`}
                onClick={sendReady}
              >
                {ready[1] ? 'Unready' : 'Ready'}
              </button>
            )}

            {host && (
              <div className="w-full">
                {!game && (
                  <p className="flex h-20 w-full items-center justify-center rounded-xl bg-gray-400 text-2xl font-semibold text-white">
                    Select a game first
                  </p>
                )}
                {game && !ready[1] && (
                  <p className="flex h-20 w-full items-center justify-center rounded-xl bg-gray-400 text-2xl font-semibold">
                    Waiting for guest...
                  </p>
                )}
                {game && ready[1] && (
                  <button
                    className="h-20 w-full rounded-xl bg-green-500 text-2xl font-semibold text-white"
                    onClick={startGame}
                  >
                    Start Game
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
