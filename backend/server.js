import http from "http";
import "dotenv/config";
import { WebSocketServer } from "ws";
import { games } from "./games/index.js";

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Server running");
});

const wss = new WebSocketServer({ server });

const rooms = {};

const createRoomScore = () => ({
  host: 0,
  guest: 0,
});

const sendRoomUpdate = (roomCode, room) => {
  room.players.forEach((player, idx) => {
    player.send(
      JSON.stringify({
        type: "roomUpdated",
        payload: {
          roomCode,
          players: room.players.map((p) => (p === room.host ? "host" : "guest")),
          isHost: player === room.host,
          game: room.game,
          ready: room.ready || [false, false],
          score: room.score || createRoomScore(),
          playerCount: room.players.length,
          playerIndex: idx,
        },
      }),
    );
  });
};

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("close", () => {
    const roomCode = ws.roomCode;
    if (!roomCode) return;

    const room = rooms[roomCode];
    if (!room) return;

    if (ws === room.host) {
      if (room.players[1]) {
        room.players[1].send(
          JSON.stringify({
            type: "roomClosed",
            payload: {
              message: "Host left the room",
            },
          }),
        );
      }
      delete rooms[roomCode];
      return;
    }

    room.players = room.players.filter((player) => player !== ws);
    room.ready = [false, false];
    room.gameState = null;

    if (room.players.length === 1 && room.players[0] === room.host) {
      sendRoomUpdate(roomCode, room);
    } else if (room.players.length === 0) {
      delete rooms[roomCode];
    }
  });

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
          score: createRoomScore(),
          lastScoredOutcome: null,
          nextStartingPlayer: 0,
        };

        ws.roomCode = roomCode;

        ws.send(
          JSON.stringify({
            type: "roomCreated",
            payload: {
              roomCode,
              players: ["host"],
              isHost: true,
              score: rooms[roomCode].score,
            },
          }),
        );

        break;
      }

      case "joinRoom": {
        const { roomCode } = payload;
        const room = rooms[roomCode];

        if (!room || room.players.length >= 2) return;

        if (room.players.length === 1) {
          room.score = createRoomScore();
          room.lastScoredOutcome = null;
          room.nextStartingPlayer = 0;
          room.ready = [false, false];
          room.gameState = null;
        }

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
                game: room.game, // send current game selection to new player
                score: room.score || createRoomScore(),
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
        if (playerIndex !== 1) {
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

        room.ready[playerIndex] = !room.ready[playerIndex];
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

        if (!room.game) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Please select a game first",
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

        const gameHandler = games[room.game];
        if (gameHandler) {
          room.gameState = gameHandler.initGame(room.nextStartingPlayer || 0);
          room.nextStartingPlayer = 1 - (room.nextStartingPlayer || 0);
        }
        room.lastScoredOutcome = null;

        // Start game
        room.players.forEach((player, idx) => {
          player.send(
            JSON.stringify({
              type: "gameStarted",
              payload: {
                game: room.game,
                gameState: room.gameState,
                playerIndex: idx, // send player's own index
              },
            }),
          );
        });

        break;
      }

      case "makeMove": {
        const room = rooms[ws.roomCode];

        if (!room || !room.gameState) return;
        if (
          room.gameState.winner !== null &&
          room.gameState.winner !== undefined
        )
          return;

        const playerIndex = room.players.indexOf(ws);

        const gameHandler = games[room.game];
        if (!gameHandler) return;

        room.gameState = gameHandler.handleMove(
          room.gameState,
          playerIndex,
          payload,
        );

        if (
          room.gameState?.winner !== null &&
          room.gameState?.winner !== undefined &&
          room.lastScoredOutcome !== room.gameState.winner
        ) {
          room.score = room.score || createRoomScore();

          if (room.gameState.winner === "draw") {
            room.score.host += 1;
            room.score.guest += 1;
          } else if (
            typeof room.gameState.winner === "number" &&
            room.gameState.winner >= 0 &&
            room.gameState.winner < room.players.length
          ) {
            const winnerKey = room.gameState.winner === 0 ? "host" : "guest";
            room.score[winnerKey] += 1;
          } else if (
            room.game === "tictactoe" &&
            (room.gameState.winner === "X" || room.gameState.winner === "O")
          ) {
            const winnerKey = playerIndex === 0 ? "host" : "guest";
            room.score[winnerKey] += 1;
          }

          room.lastScoredOutcome = room.gameState.winner;
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

      case "restartGame": {
        const room = rooms[ws.roomCode];
        if (!room) return;
        if (!room.game) return;
        if (
          !room.gameState ||
          (room.gameState.winner === null || room.gameState.winner === undefined)
        )
          return;

        const gameHandler = games[room.game];
        if (!gameHandler) return;

        room.gameState = gameHandler.initGame(room.nextStartingPlayer || 0);
        room.nextStartingPlayer = 1 - (room.nextStartingPlayer || 0);
        room.lastScoredOutcome = null;

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

        // Reset game-related state
        room.gameState = null;
        room.ready = [false, false];
        room.game = null;
        room.lastScoredOutcome = null;
        room.nextStartingPlayer = 0;

        room.players.forEach((player) => {
          player.send(
            JSON.stringify({
              type: "backToRoom",
              payload: {
                game: null,
                ready: room.ready,
                score: room.score || createRoomScore(),
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

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
