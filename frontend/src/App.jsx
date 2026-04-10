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
  const games = [
    { name: 'tictactoe', available: true },
    { name: 'battleship', available: true },
    { name: 'connect4', available: false },
  ];

  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8080');

    wsRef.current.onopen = () => {
      console.log('Connected to server');
    };

    wsRef.current.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      if (data.type === 'roomCreated') {
        setRoomCode(data.payload.roomCode);
        setPlayers(data.payload.players);
        setHost(data.payload.isHost);
      }

      if (data.type === 'roomJoined') {
        setRoomCode(data.payload.roomCode);
        setPlayers(data.payload.players);
        setHost(data.payload.isHost);
        setGame(data.payload.game); // set current game selection when joining
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

  const backToRoom = () => {
    wsRef.current?.send(JSON.stringify({ type: 'backToRoom' }));
  };
  if (inGame) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <GameContainer
          game={game}
          gameState={gameState}
          makeMove={makeMove}
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
          <div>
            <h2 className="text-4xl font-bold text-yellow-200">
              Room: {roomCode}
            </h2>
            <p className="text-2xl font-semibold text-yellow-100">
              Players: {players.length}
            </p>
            {/* <h2>Selected Game: {game}</h2> */}
          </div>

          {/* <span>{host ? '(Host)' : ''}</span> */}

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
                    ? `${g.name} ✓`
                    : g.name}
              </button>
            ))}
          </div>
          {/* )} */}
          <div className="w-full">
            {!host && (
              <button
                className={`h-20 w-full rounded-xl text-2xl font-semibold text-white ${ready[1] ? 'bg-blue-500' : 'bg-green-500'}`}
                onClick={sendReady}
                disabled={ready[1]}
              >
                {ready[1] ? 'Ready ✅' : 'Ready'}
              </button>
            )}

            {host && (
              <div className="w-full">
                {!ready[1] && (
                  <p className="flex h-20 w-full items-center justify-center rounded-xl bg-gray-400 text-2xl font-semibold">
                    Waiting for guest...
                  </p>
                )}
                {ready[1] && (
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
