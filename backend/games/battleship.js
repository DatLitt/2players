export const battleship = {
  initGame: () => ({
    phase: "setup",
    currentPlayer: 0,
    winner: null,
    players: [
      { ships: [], hits: [], misses: [] },
      { ships: [], hits: [], misses: [] },
    ],
  }),

  handleMove: (gameState, playerIndex, payload) => {
    const newState = JSON.parse(JSON.stringify(gameState));

    if (newState.winner) return gameState;

    // SETUP PHASE
    if (newState.phase === "setup") {
      if (payload.action !== "placeShips") return gameState;

      if (!Array.isArray(payload.ships) || payload.ships.length === 0)
        return gameState;
      if (payload.ships.length > 9) return gameState;

      newState.players[playerIndex].ships = payload.ships;

      // switch to battle if both players placed ships
      if (
        newState.players[0].ships.length > 0 &&
        newState.players[1].ships.length > 0
      ) {
        newState.phase = "battle";
      }

      return newState;
    }

    // BATTLE PHASE
    if (newState.phase === "battle") {
      if (playerIndex !== newState.currentPlayer) return gameState;
      if (payload.action !== "attack") return gameState;

      const opponent = 1 - playerIndex;
      const { row, col } = payload;

      // check if already attacked
      if (
        newState.players[playerIndex].hits.some(
          (h) => h.row === row && h.col === col,
        ) ||
        newState.players[playerIndex].misses.some(
          (m) => m.row === row && m.col === col,
        )
      )
        return gameState;

      // check hit
      const hit = newState.players[opponent].ships.some(
        (s) => s.row === row && s.col === col,
      );

      if (hit) {
        newState.players[playerIndex].hits.push({ row, col });
      } else {
        newState.players[playerIndex].misses.push({ row, col });
        newState.currentPlayer = opponent;
      }

      // check win
      const totalShipCells = newState.players[opponent].ships.length;
      const totalHits = newState.players[playerIndex].hits.length;
      if (totalHits >= totalShipCells) {
        newState.winner = playerIndex;
      }

      return newState;
    }

    return gameState;
  },

  getPublicState: (gameState, playerIndex) => {
    const opponent = 1 - playerIndex;

    if (!gameState.players[playerIndex] || !gameState.players[opponent])
      return gameState;

    // setup phase: show own ships only
    if (gameState.phase === "setup") {
      return {
        ...gameState,
        players: [{ ...gameState.players[playerIndex] }, { ships: [] }],
      };
    }

    // battle phase: show one board at a time for mobile
    return {
      ...gameState,
      players: [
        {
          ...gameState.players[playerIndex], // self sees own ships and hits/misses
        },
        {
          hits:
            playerIndex === gameState.currentPlayer
              ? gameState.players[playerIndex].hits
              : [],
          misses:
            playerIndex === gameState.currentPlayer
              ? gameState.players[playerIndex].misses
              : [],
          ships:
            playerIndex === gameState.currentPlayer
              ? []
              : gameState.players[opponent].ships,
        },
      ],
    };
  },
};
