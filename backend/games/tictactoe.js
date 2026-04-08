export const tictactoe = {
  initGame: () => ({
    board: Array(9).fill(null),
    currentPlayer: 0,
    winner: null,
  }),

  handleMove: (gameState, playerIndex, payload) => {
    // Prevent moves if game ended
    if (gameState.winner) return gameState;

    // Prevent playing out of turn
    if (playerIndex !== gameState.currentPlayer) return gameState;

    const { index } = payload || {};

    // Validate index
    if (typeof index !== "number" || index < 0 || index > 8) return gameState;

    const board = [...gameState.board];

    // Prevent overwriting
    if (board[index]) return gameState;

    const symbol = playerIndex === 0 ? "X" : "O";
    board[index] = symbol;

    let winner = null;

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

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        winner = board[a];
        break;
      }
    }

    // Check draw
    if (!winner && board.every((cell) => cell)) {
      winner = "draw";
    }

    const currentPlayer = winner
      ? gameState.currentPlayer
      : 1 - gameState.currentPlayer;

    return {
      board,
      currentPlayer,
      winner,
    };
  },
};
