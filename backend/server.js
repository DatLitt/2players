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
          host: ws,
          players: [ws],
          game: null,
        };

        ws.roomCode = roomCode;

        ws.send(
          JSON.stringify({
            type: "roomCreated",
            payload: { roomCode, players: ["host"], isHost: true },
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
              payload: {
                roomCode,
                players: room.players.map((p) =>
                  p === room.host ? "host" : "guest",
                ),
                isHost: player === room.host,
              },
            }),
          );
        });
        console.log(payload);

        break;
      }
      case "selectGame": {
        const { game } = payload;
        const roomCode = ws.roomCode;
        const room = rooms[roomCode];

        if (!room) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Room not found",
            }),
          );
          return;
        }

        // Only host can select game
        if (ws !== room.host) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Only host can select the game",
            }),
          );
          return;
        }

        // Save selected game in room state
        room.game = game;

        // Broadcast to all players
        room.players.forEach((player) => {
          player.send(
            JSON.stringify({
              type: "gameSelected",
              payload: { game },
            }),
          );
        });

        break;
      }

      case "playerReady": {
        const room = rooms[ws.roomCode];
        if (!room) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Room not found",
            }),
          );
          return;
        }
        // Track ready state: host = 0, guest = 1
        if (!room.ready) {
          room.ready = [false, false];
        }
        const playerIndex = ws === room.host ? 0 : 1;
        room.ready[playerIndex] = true;
        // Notify both players of ready state
        room.players.forEach((player) => {
          player.send(
            JSON.stringify({
              type: "playerReady",
              payload: {
                ready: room.ready,
              },
            }),
          );
        });
        break;
      }

      case "startGame": {
        const room = rooms[ws.roomCode];

        if (!room) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Room not found",
            }),
          );
          return;
        }

        // Only host can start the game
        if (ws !== room.host) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Only host can start the game",
            }),
          );
          return;
        }

        // Guest must be ready
        if (!room.ready || !room.ready[1]) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Guest is not ready",
            }),
          );
          return;
        }

        // Initialize game state
        if (room.game === "tictactoe") {
          room.gameState = {
            board: Array(9).fill(null),
            currentPlayer: 0,
            winner: null,
          };
        }

        // Start game
        room.players.forEach((player) => {
          player.send(
            JSON.stringify({
              type: "gameStarted",
              payload: { game: room.game, gameState: room.gameState },
            }),
          );
        });

        break;
      }

      case "makeMove": {
        const room = rooms[ws.roomCode];

        if (!room || !room.gameState) return;
        if (room.gameState.winner) return;

        const playerIndex = room.players.indexOf(ws);
        const { index } = payload;

        // Check turn
        if (playerIndex !== room.gameState.currentPlayer) return;

        // Check if cell is empty
        if (room.gameState.board[index]) return;

        // Assign symbol
        const symbol = playerIndex === 0 ? "X" : "O";
        room.gameState.board[index] = symbol;

        // Check winner
        const b = room.gameState.board;
        const lines = [
          [0, 1, 2],
          [3, 4, 5],
          [6, 7, 8],
          [0, 3, 6],
          [1, 4, 7],
          [2, 5, 8],
          [0, 4, 8],
          [2, 4, 6],
        ];

        for (const [a, bIdx, c] of lines) {
          if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) {
            room.gameState.winner = b[a];
            break;
          }
        }

        // Check draw
        if (!room.gameState.winner && b.every((cell) => cell)) {
          room.gameState.winner = "draw";
        }

        // Switch turn only if no winner
        if (!room.gameState.winner) {
          room.gameState.currentPlayer = 1 - room.gameState.currentPlayer;
        }

        // Broadcast updated state
        room.players.forEach((player) => {
          player.send(
            JSON.stringify({
              type: "gameUpdate",
              payload: room.gameState,
            }),
          );
        });

        break;
      }

      case "backToRoom": {
        const room = rooms[ws.roomCode];
        if (!room) return;

        // Only host can trigger return
        if (ws !== room.host) return;

        // Reset game-related state
        room.gameState = null;
        room.ready = [false, false];

        room.players.forEach((player) => {
          player.send(
            JSON.stringify({
              type: "backToRoom",
              payload: {
                game: null,
                ready: room.ready,
              },
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
