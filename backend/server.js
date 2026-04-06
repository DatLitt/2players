import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

const rooms = {};

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (msg) => {
    const data = JSON.parse(msg.toString());
    const { type, payload } = data;

    switch (type) {
      case "createRoom": {
        const roomCode = Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();

        rooms[roomCode] = {
          players: [ws],
        };

        ws.roomCode = roomCode;

        ws.send(
          JSON.stringify({
            type: "roomCreated",
            payload: { roomCode },
          }),
        );

        break;
      }

      case "joinRoom": {
        const { roomCode } = payload;
        const room = rooms[roomCode];

        if (!room || room.players.length >= 2) return;

        room.players.push(ws);
        ws.roomCode = roomCode;

        room.players.forEach((player) => {
          player.send(
            JSON.stringify({
              type: "roomJoined",
              payload: { roomCode, players: room.players.length },
            }),
          );
        });

        break;
      }

      default:
        console.log("Unknown message type:", type);
    }
  });

  ws.send(JSON.stringify({ type: "connected" }));
});

console.log("Server running on ws://localhost:8080");
