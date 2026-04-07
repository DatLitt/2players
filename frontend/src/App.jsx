import { useEffect, useState, useRef } from "react";

function App() {
  const wsRef = useRef(null);
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [game, setGame] = useState("");
  const [players, setPlayers] = useState([]);
  const [host, setHost] = useState(false);
  const [ready, setReady] = useState([false, false]);

  useEffect(() => {
    wsRef.current = new WebSocket("ws://localhost:8080");

    wsRef.current.onopen = () => {
      console.log("Connected to server");
    };

    wsRef.current.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      if (data.type === "roomCreated") {
        setRoomCode(data.payload.roomCode);
        setPlayers(data.payload.players);
        setHost(data.payload.isHost);
      }

      if (data.type === "roomJoined") {
        setRoomCode(data.payload.roomCode);
        setPlayers(data.payload.players);
        setHost(data.payload.isHost);
      }
      if (data.type === "gameSelected") {
        setGame(data.payload.game);
      }
      if (data.type === "playerReady") {
        setReady(data.payload.ready);
      }

      if (data.type === "gameStarted") {
        alert(`Game started: ${data.payload.game}`);
      }
      if (data.type === "error") {
        alert(data.message);
      }
    };

    return () => wsRef.current?.close();
  }, []);

  const createRoom = () => {
    wsRef.current?.send(JSON.stringify({ type: "createRoom" }));
  };

  const joinRoom = () => {
    if (!inputCode) return;
    wsRef.current?.send(
      JSON.stringify({
        type: "joinRoom",
        payload: { roomCode: inputCode.toUpperCase() },
      }),
    );
  };
  const selectGame = (selectedGame) => {
    wsRef.current?.send(
      JSON.stringify({
        type: "selectGame",
        payload: { game: selectedGame },
      }),
    );
  };

  const sendReady = () => {
    wsRef.current?.send(JSON.stringify({ type: "playerReady" }));
  };

  const startGame = () => {
    wsRef.current?.send(JSON.stringify({ type: "startGame" }));
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Game Hub</h1>
      <span> {host ? "(Host)" : ""}</span>
      <h2>Selected Game: {game}</h2>

      {!roomCode && <button onClick={createRoom}>Create Room</button>}
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

      {!roomCode && (
        <div style={{ marginTop: 20 }}>
          <input
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Enter room code"
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      )}

      {roomCode && (
        <div style={{ marginTop: 20 }}>
          <h2>Room: {roomCode}</h2>
          <p>Players: {players.length}</p>
        </div>
      )}

      {roomCode && (
        <div style={{ marginTop: 20 }}>
          {!host && (
            <button onClick={sendReady} disabled={ready[1]}>
              {ready[1] ? "Ready ✅" : "Ready"}
            </button>
          )}

          {host && (
            <div>
              {!ready[1] && <p>Waiting for guest...</p>}
              {ready[1] && <button onClick={startGame}>Start Game</button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
