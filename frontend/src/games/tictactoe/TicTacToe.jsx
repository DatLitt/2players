import React from 'react';
import GameActionButton from '../../components/GameActionButton';

const TicTacToe = ({
  gameState,
  makeMove,
  restartGame,
  backToRoom,
  playerIndex,
}) => {
  if (!gameState) return null;

  const mySymbol = playerIndex === 0 ? 'X' : 'O';

  return (
    <div className="flex flex-col items-center gap-4 pb-10">
      <h2 className="text-3xl font-bold text-white">
        {gameState.winner
          ? gameState.winner === 'draw'
            ? 'Draw!'
            : gameState.winner === mySymbol
              ? 'You Win!'
              : 'You Lose!'
          : gameState.currentPlayer === playerIndex
            ? 'Your Turn'
            : "Opponent's Turn"}
      </h2>

      <div className="grid max-w-full grid-cols-3 gap-2">
        {gameState.board.map((cell, i) => (
          <div
            key={i}
            onClick={() => {
              if (!cell && !gameState.winner) makeMove({ index: i });
            }}
            className="flex h-24 w-24 cursor-pointer items-center justify-center border border-white text-5xl font-bold text-white"
          >
            {cell}
          </div>
        ))}
      </div>
      {gameState.winner && (
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <GameActionButton label="Play Again" onClick={restartGame} />
          <GameActionButton
            label="Leave Room"
            onClick={backToRoom}
            tone="bg-gray-600 hover:bg-gray-700"
          />
        </div>
      )}
    </div>
  );
};

export default TicTacToe;
