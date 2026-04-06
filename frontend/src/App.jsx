import { useEffect, useState, useRef } from "react";

function App() {
  const wsRef = useRef(null);
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [players, setPlayers] = useState(0);

  useEffect(() => {
    wsRef.current = new WebSocket("ws://localhost:8080");

    wsRef.current.onopen = () => {
      console.log("Connected to server");
    };

    wsRef.current.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      if (data.type === "roomCreated") {
        setRoomCode(data.payload.roomCode);
        setPlayers(1);
      }

      if (data.type === "roomJoined") {
        setRoomCode(data.payload.roomCode);
        setPlayers(data.payload.players);
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

  return (
    <div style={{ padding: 20 }}>
      <h1>Game Hub</h1>

      <button onClick={createRoom}>Create Room</button>

      <div style={{ marginTop: 20 }}>
        <input
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          placeholder="Enter room code"
        />
        <button onClick={joinRoom}>Join Room</button>
      </div>

      {roomCode && (
        <div style={{ marginTop: 20 }}>
          <h2>Room: {roomCode}</h2>
          <p>Players: {players}</p>
        </div>
      )}
    </div>
  );
}

export default App;
