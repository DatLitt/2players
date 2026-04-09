import { useState } from 'react';

export default function Battleship({
  gameState,
  makeMove,
  playerIndex,
  backToRoom,
}) {
  const [selectedCells, setSelectedCells] = useState([]);

  const toggleCell = (row, col) => {
    const exists = selectedCells.some((c) => c.row === row && c.col === col);
    if (exists) {
      setSelectedCells(
        selectedCells.filter((c) => !(c.row === row && c.col === col)),
      );
    } else {
      if (selectedCells.length >= 9) return;
      setSelectedCells([...selectedCells, { row, col }]);
    }
  };

  const handleSubmit = () => {
    makeMove({ action: 'placeShips', ships: selectedCells });
  };

  const renderGrid = (onClick, type = 'self') => {
    const self = gameState.players?.[playerIndex];
    const opponent = gameState.players?.[1 - playerIndex];

    return (
      <div className="grid grid-cols-5">
        {Array.from({ length: 25 }).map((_, i) => {
          const row = Math.floor(i / 5);
          const col = i % 5;

          let bg = 'bg-white';

          if (type === 'self') {
            if (
              self?.ships?.some((s) => s.row === row && s.col === col) ||
              selectedCells.some((c) => c.row === row && c.col === col)
            ) {
              bg = 'bg-green-400';
            }
            if (opponent?.hits?.some((h) => h.row === row && h.col === col))
              bg = 'bg-red-500';
            if (opponent?.misses?.some((m) => m.row === row && m.col === col))
              bg = 'bg-gray-400';
          }

          if (type === 'enemy') {
            if (self?.hits?.some((h) => h.row === row && h.col === col))
              bg = 'bg-red-500';
            else if (self?.misses?.some((m) => m.row === row && m.col === col))
              bg = 'bg-gray-400';
          }

          const alreadyAttacked =
            type === 'enemy' &&
            (self?.hits?.some((h) => h.row === row && h.col === col) ||
              self?.misses?.some((m) => m.row === row && m.col === col));

          return (
            <div
              key={i}
              onClick={() => {
                if (!alreadyAttacked) onClick(row, col);
              }}
              className={`flex h-14 w-14 cursor-pointer items-center justify-center border ${bg}`}
            />
          );
        })}
      </div>
    );
  };

  if (!gameState) return <div>Loading...</div>;

  const isYourTurn = gameState.currentPlayer === playerIndex;

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-xl font-bold">Battleship</h1>

      {gameState.phase === 'setup' && (
        <div className="flex flex-col items-center gap-4">
          <p>Place your ships (max 9 cells)</p>
          {renderGrid(toggleCell, 'self')}
          <button
            onClick={handleSubmit}
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Confirm Ships
          </button>
          <p>{selectedCells.length} / 9 selected</p>
        </div>
      )}

      {gameState.phase === 'battle' && (
        <div className="flex flex-col items-center gap-4">
          <p>
            {isYourTurn
              ? 'Your turn! Attack enemy board'
              : 'Waiting for opponent...'}
          </p>
          {isYourTurn
            ? renderGrid(
                (row, col) => makeMove({ action: 'attack', row, col }),
                'enemy',
              )
            : renderGrid(() => {}, 'self')}
        </div>
      )}

      {gameState.winner !== null && (
        <div className="text-xl font-bold">
          {gameState.winner === playerIndex ? 'You won!' : 'You lost!'}
        </div>
      )}
      <button
        className="z-10 mt-4 rounded bg-green-500 px-4 py-2 text-white"
        onClick={backToRoom}
      >
        Back to Room
      </button>
    </div>
  );
}
