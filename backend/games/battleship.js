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

      if (!Array.isArray(payload.ships) || payload.ships.length !== 3) {
        return gameState;
      }

      const expectedSizes = [2, 3, 4];
      // validate each ship
      const allCells = [];

      for (let i = 0; i < payload.ships.length; i++) {
        const ship = payload.ships[i];

        if (!Array.isArray(ship) || ship.length !== expectedSizes[i]) {
          return gameState;
        }

        // check straight line (horizontal or vertical)
        const isSameRow = ship.every((c) => c.row === ship[0].row);
        const isSameCol = ship.every((c) => c.col === ship[0].col);

        if (!isSameRow && !isSameCol) return gameState;

        // check continuous
        const sorted = [...ship].sort((a, b) =>
          isSameRow ? a.col - b.col : a.row - b.row,
        );

        for (let j = 1; j < sorted.length; j++) {
          const prev = sorted[j - 1];
          const curr = sorted[j];

          if (isSameRow && curr.col !== prev.col + 1) return gameState;
          if (isSameCol && curr.row !== prev.row + 1) return gameState;
        }

        // check bounds + collect cells
        for (const cell of ship) {
          if (cell.row < 0 || cell.row >= 5 || cell.col < 0 || cell.col >= 5) {
            return gameState;
          }

          const key = `${cell.row}-${cell.col}`;
          if (allCells.includes(key)) return gameState; // overlap
          allCells.push(key);
        }
      }

      // flatten ships for easier battle logic
      newState.players[playerIndex].ships = payload.ships.flat();

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
