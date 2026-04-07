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

  const makeMove = (index) => {
    wsRef.current?.send(
      JSON.stringify({
        type: 'makeMove',
        payload: { index },
      }),
    );
  };

  const backToRoom = () => {
    wsRef.current?.send(JSON.stringify({ type: 'backToRoom' }));
  };
  if (inGame) {
    return (
      <div className="flex h-screen w-screen items-center justify-center p-3">
        <GameContainer
          game={game}
          gameState={gameState}
          makeMove={makeMove}
          backToRoom={backToRoom}
        />
      </div>
    );
  }
  return (
    <div className="flex min-h-dvh w-full flex-col justify-between bg-gray-100 p-10 text-center">
      {!roomCode && (
        <>
          <h1 className="text-4xl font-bold">Game Hub</h1>
          <button
            className="h-20 w-full rounded-xl bg-blue-200"
            onClick={createRoom}
          >
            Create Room
          </button>
          <div className="flex h-20 w-full items-center justify-center rounded-xl bg-blue-200">
            <input
              className="h-full w-full rounded-l-xl border-none bg-blue-100 p-3 text-center outline-none"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Enter room code"
            />
            <button
              className="h-full w-[40%] rounded-r-xl bg-blue-300"
              onClick={joinRoom}
            >
              Join Room
            </button>
          </div>
        </>
      )}
      {roomCode && (
        <>
          <div>
            <h2>Room: {roomCode}</h2>
            <p>Players: {players.length}</p>
            <h2>Selected Game: {game}</h2>
          </div>

          {/* <span>{host ? '(Host)' : ''}</span> */}

          {host && (
            <select
              disabled={!host}
              onChange={(e) => {
                selectGame(e.target.value);
              }}
            >
              <option value="tictactoe">Tic Tac Toe</option>
              <option value="hehe">hehe</option>
              <option value="hihi">hihi</option>
            </select>
          )}
          <div style={{ marginTop: 20 }}>
            {!host && (
              <button
                className="h-20 w-full rounded-xl bg-green-400 text-2xl font-semibold"
                onClick={sendReady}
                disabled={ready[1]}
              >
                {ready[1] ? 'Ready ✅' : 'Ready'}
              </button>
            )}

            {host && (
              <div>
                {!ready[1] && (
                  <p className="flex h-20 w-full items-center justify-center rounded-xl bg-gray-400 text-2xl font-semibold">
                    Waiting for guest...
                  </p>
                )}
                {ready[1] && (
                  <button
                    className="h-20 w-full rounded-xl bg-blue-400"
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
