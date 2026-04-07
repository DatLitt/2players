import React from 'react';

const TicTacToe = ({ gameState, makeMove, backToRoom }) => {
  if (!gameState) return null;

  return (
    <div className="flex flex-col items-center gap-4 pb-10">
      <h2 className="text-xl font-bold">
        {gameState.winner
          ? gameState.winner === 'draw'
            ? 'Draw!'
            : `${gameState.winner} Wins!`
          : `Turn: ${gameState.currentPlayer === 0 ? 'X' : 'O'}`}
      </h2>

      <div className="grid max-w-full grid-cols-3 gap-2">
        {gameState.board.map((cell, i) => (
          <div
            key={i}
            onClick={() => {
              if (!cell && !gameState.winner) makeMove(i);
            }}
            className="flex h-24 w-24 cursor-pointer items-center justify-center border text-2xl"
          >
            {cell}
          </div>
        ))}
      </div>
      {/* {gameState.winner && ( */}
      <button
        className="z-10 mt-4 rounded bg-green-500 px-4 py-2 text-white"
        onClick={backToRoom}
      >
        Back to Room
      </button>
      {/* )} */}
    </div>
  );
};

export default TicTacToe;
