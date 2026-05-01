import { useState } from 'react';
import GameActionButton from '../../components/GameActionButton';

export default function Battleship({
  gameState,
  makeMove,
  playerIndex,
  restartGame,
  backToRoom,
}) {
  const [ships, setShips] = useState([]);
  const [direction, setDirection] = useState('horizontal');
  const shipSizes = [2, 3, 4];
  const selfShips = gameState?.players?.[playerIndex]?.ships || [];
  const hasSubmittedShips = selfShips.length > 0;

  const placeShip = (row, col) => {
    const size = shipSizes[ships.length];
    if (!size) return;

    const newShip = [];

    for (let i = 0; i < size; i++) {
      const r = direction === 'vertical' ? row + i : row;
      const c = direction === 'horizontal' ? col + i : col;

      if (r >= 5 || c >= 5) return;

      // prevent overlap
      const overlap = ships
        .flat()
        .some((cell) => cell.row === r && cell.col === c);
      if (overlap) return;

      newShip.push({ row: r, col: c });
    }

    setShips((prevShips) => [...prevShips, newShip]);
  };

  const handleSubmit = () => {
    if (ships.length !== 3) return;
    makeMove({ action: 'placeShips', ships });
  };

  const isYourTurn = gameState.currentPlayer === playerIndex;

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
              ships.flat().some((c) => c.row === row && c.col === col)
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
                if (type === 'enemy') {
                  if (!isYourTurn) return;
                  if (alreadyAttacked) return;
                  onClick(row, col);
                } else {
                  if (hasSubmittedShips) return;
                  onClick(row, col);
                }
              }}
              className={`flex h-14 w-14 cursor-pointer items-center justify-center border ${bg}`}
            />
          );
        })}
      </div>
    );
  };

  if (!gameState) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-4xl font-bold text-yellow-200">Battleship</h1>
      {gameState.winner !== null && (
        <div
          className={`text-xl font-bold ${gameState.winner === playerIndex ? 'text-green-500' : 'text-red-500'}`}
        >
          {gameState.winner === playerIndex ? 'You won!' : 'You lost!'}
        </div>
      )}

      {gameState.phase === 'setup' && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-white">
            Place ship size: {shipSizes[ships.length]}
          </p>
          <button
            onClick={() =>
              setDirection(
                direction === 'horizontal' ? 'vertical' : 'horizontal',
              )
            }
            className="rounded bg-gray-600 px-4 py-2 text-white"
          >
            Direction: {direction}
          </button>

          {renderGrid(placeShip, 'self')}

          <button
            onClick={handleSubmit}
            className={`rounded px-4 py-2 text-white ${hasSubmittedShips ? 'bg-green-600' : 'bg-blue-600'}`}
            disabled={ships.length !== 3 || hasSubmittedShips}
          >
            {hasSubmittedShips
              ? 'Ships Confirmed ✓'
              : ships.length === 3
                ? 'Start Game'
                : 'Place 3 Ships'}
          </button>

          {hasSubmittedShips && (
            <p className="text-yellow-300">Waiting for opponent...</p>
          )}

          <p>{ships.length} / 3 ships placed</p>
        </div>
      )}

      {gameState.phase === 'battle' && (
        <div className="flex flex-col items-center gap-4">
          {gameState.winner == null && (
            <p className="text-white">
              {isYourTurn
                ? 'Your turn! Attack enemy board'
                : 'Waiting for opponent...'}
            </p>
          )}

          <div className="flex flex-col gap-4 md:flex-row md:gap-6">
            <div className="flex flex-col items-center">
              <p className="text-2xl font-semibold text-white">You</p>
              {renderGrid(() => {}, 'self')}
            </div>

            <div className="flex flex-col items-center">
              <p className="text-2xl font-semibold text-white">Enemy</p>
              {renderGrid(
                (row, col) => makeMove({ action: 'attack', row, col }),
                'enemy',
              )}
            </div>
          </div>
        </div>
      )}

      {gameState.winner !== null && (
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
}
