import { useEffect, useRef, useState } from 'react';
import GameActionButton from '../../components/GameActionButton';

const BOARD_SIZE = 5;
const SHIP_SIZES = [2, 3, 4];

const createInitialShips = () =>
  SHIP_SIZES.map((size) => ({
    id: `ship-${size}`,
    size,
    orientation: 'horizontal',
    placed: false,
    row: null,
    col: null,
  }));

const getShipCells = (ship, row = ship.row, col = ship.col) => {
  if (row === null || col === null) return [];

  return Array.from({ length: ship.size }, (_, index) => ({
    row: ship.orientation === 'vertical' ? row + index : row,
    col: ship.orientation === 'horizontal' ? col + index : col,
  }));
};

const getShipKey = (row, col) => `${row}-${col}`;

const getBoardCellFromPoint = (boardRef, clientX, clientY) => {
  const boardEl = boardRef.current;
  if (!boardEl) return null;

  const rect = boardEl.getBoundingClientRect();
  if (
    clientX < rect.left ||
    clientX >= rect.right ||
    clientY < rect.top ||
    clientY >= rect.bottom
  ) {
    return null;
  }

  const cellSize = rect.width / BOARD_SIZE;
  const row = Math.floor((clientY - rect.top) / cellSize);
  const col = Math.floor((clientX - rect.left) / cellSize);

  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return null;
  }

  return { row, col };
};

const canPlaceShip = (candidateShip, ships) => {
  if (candidateShip.row === null || candidateShip.col === null) return false;

  const cells = getShipCells(
    candidateShip,
    candidateShip.row,
    candidateShip.col,
  );
  if (cells.length !== candidateShip.size) return false;

  const isOutOfBounds = cells.some(
    (cell) =>
      cell.row < 0 ||
      cell.row >= BOARD_SIZE ||
      cell.col < 0 ||
      cell.col >= BOARD_SIZE,
  );
  if (isOutOfBounds) return false;

  const occupied = new Set(
    ships
      .filter((ship) => ship.placed && ship.id !== candidateShip.id)
      .flatMap((ship) =>
        getShipCells(ship, ship.row, ship.col).map((cell) =>
          getShipKey(cell.row, cell.col),
        ),
      ),
  );

  return !cells.some((cell) => occupied.has(getShipKey(cell.row, cell.col)));
};

function ShipPiece({ ship, scale = 'tray', className = '', onPointerDown }) {
  const isTray = scale === 'tray';
  const isGhost = scale === 'ghost';
  const vertical = ship.orientation === 'vertical';

  const wrapperClasses = isTray
    ? 'inline-flex rounded-2xl bg-slate-800/85 p-1 shadow-lg ring-1 ring-white/15'
    : isGhost
      ? 'rounded-2xl border-2 border-dashed border-white/80 bg-white/10 p-0.5 shadow-2xl backdrop-blur-sm'
      : 'rounded-2xl border border-white/10 bg-gradient-to-b from-slate-100 via-slate-300 to-slate-700 p-0.5 shadow-[0_14px_28px_rgba(15,23,42,0.45)]';

  const segmentClasses = isTray
    ? 'h-8 w-8 rounded-lg border border-white/20 bg-gradient-to-b from-slate-100 via-slate-300 to-slate-500 shadow-inner sm:h-10 sm:w-10'
    : isGhost
      ? 'min-h-0 min-w-0 flex-1 rounded-lg border border-white/25 bg-sky-300/40'
      : 'h-8 min-w-0 flex-1 rounded-lg border border-white/20 bg-blue-500 from-slate-200 via-slate-400 to-slate-600';

  return (
    <div
      onPointerDown={onPointerDown}
      className={`${wrapperClasses} touch-none select-none ${vertical ? 'flex flex-col' : 'flex flex-row'} ${isTray ? 'gap-1' : 'gap-0.5'} ${className}`}
    >
      {Array.from({ length: ship.size }).map((_, index) => (
        <div key={index} className={segmentClasses} />
      ))}
    </div>
  );
}

export default function Battleship({
  gameState,
  makeMove,
  playerIndex,
  restartGame,
  backToRoom,
}) {
  const [ships, setShips] = useState(() => createInitialShips());
  const [submitted, setSubmitted] = useState(false);
  const [dragState, setDragState] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);
  const boardRef = useRef(null);
  const shipsRef = useRef(ships);
  const dragStateRef = useRef(dragState);

  const selfShips = gameState?.players?.[playerIndex]?.ships || [];
  const hasSubmittedShips = submitted || selfShips.length > 0;
  const visibleShips = hasSubmittedShips ? selfShips : ships;
  const activeShips = hasSubmittedShips ? selfShips : ships;
  const activeDragShip = dragState
    ? ships.find((ship) => ship.id === dragState.shipId)
    : null;
  const isYourTurn = gameState?.currentPlayer === playerIndex;

  useEffect(() => {
    shipsRef.current = ships;
  }, [ships]);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (event) => {
      const currentDrag = dragStateRef.current;
      if (!currentDrag || event.pointerId !== currentDrag.pointerId) return;

      const movedEnough =
        Math.abs(event.clientX - currentDrag.startX) > 6 ||
        Math.abs(event.clientY - currentDrag.startY) > 6;

      setDragState((prev) =>
        prev
          ? {
              ...prev,
              moved: prev.moved || movedEnough,
            }
          : prev,
      );

      setHoverCell(
        getBoardCellFromPoint(boardRef, event.clientX, event.clientY),
      );
    };

    const clearDrag = () => {
      setDragState(null);
      setHoverCell(null);
    };

    const handleUp = (event) => {
      const currentDrag = dragStateRef.current;
      if (!currentDrag || event.pointerId !== currentDrag.pointerId) return;

      const ship = shipsRef.current.find(
        (item) => item.id === currentDrag.shipId,
      );
      if (!ship) {
        clearDrag();
        return;
      }

      const moved =
        currentDrag.moved ||
        Math.abs(event.clientX - currentDrag.startX) > 6 ||
        Math.abs(event.clientY - currentDrag.startY) > 6;
      const targetCell = getBoardCellFromPoint(
        boardRef,
        event.clientX,
        event.clientY,
      );

      if (!moved) {
        if (!ship.placed) {
          setShips((prevShips) =>
            prevShips.map((item) =>
              item.id === ship.id
                ? {
                    ...item,
                    orientation:
                      item.orientation === 'horizontal'
                        ? 'vertical'
                        : 'horizontal',
                  }
                : item,
            ),
          );
        }

        clearDrag();
        return;
      }

      if (targetCell) {
        const candidateShip = {
          ...ship,
          placed: true,
          row: targetCell.row,
          col: targetCell.col,
        };

        if (canPlaceShip(candidateShip, shipsRef.current)) {
          setShips((prevShips) =>
            prevShips.map((item) =>
              item.id === ship.id ? candidateShip : item,
            ),
          );
        }
      } else if (ship.placed) {
        setShips((prevShips) =>
          prevShips.map((item) =>
            item.id === ship.id
              ? {
                  ...item,
                  placed: false,
                  row: null,
                  col: null,
                }
              : item,
          ),
        );
      }

      clearDrag();
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragState]);

  const handleSubmit = () => {
    const placedShips = activeShips.filter((ship) => ship.placed);
    if (placedShips.length !== 3) return;

    makeMove({
      action: 'placeShips',
      ships: placedShips.map((ship) => getShipCells(ship)),
    });
    setSubmitted(true);
  };

  const handleShipPointerDown = (shipId) => (event) => {
    if (gameState?.phase !== 'setup' || hasSubmittedShips) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const ship = shipsRef.current.find((item) => item.id === shipId);
    if (!ship) return;

    setDragState({
      shipId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      wasPlaced: ship.placed,
    });

    setHoverCell(getBoardCellFromPoint(boardRef, event.clientX, event.clientY));
  };

  const renderBoardShip = (ship) => {
    const isDraggingThisShip = dragState?.shipId === ship.id;
    if (isDraggingThisShip && ship.placed && dragState?.wasPlaced) return null;

    const style =
      ship.orientation === 'horizontal'
        ? {
            gridColumnStart: ship.col + 1,
            gridColumnEnd: `span ${ship.size}`,
            gridRowStart: ship.row + 1,
          }
        : {
            gridRowStart: ship.row + 1,
            gridRowEnd: `span ${ship.size}`,
            gridColumnStart: ship.col + 1,
          };

    return (
      <button
        key={ship.id}
        type="button"
        onPointerDown={handleShipPointerDown(ship.id)}
        className={`pointer-events-auto relative z-20 h-full w-full cursor-grab touch-none rounded-lg border border-white/20 bg-blue-500 select-none active:cursor-grabbing ${isDraggingThisShip ? 'opacity-70' : ''}`}
        style={style}
      >
        {/* <ShipPiece ship={ship} scale="board" /> */}
      </button>
    );
  };

  const renderPreviewShip = () => {
    if (!dragState || !hoverCell || !activeDragShip) return null;

    const previewShip = {
      ...activeDragShip,
      placed: true,
      row: hoverCell.row,
      col: hoverCell.col,
    };
    const isValid = canPlaceShip(previewShip, shipsRef.current);
    const style =
      previewShip.orientation === 'horizontal'
        ? {
            gridColumnStart: previewShip.col + 1,
            gridColumnEnd: `span ${previewShip.size}`,
            gridRowStart: previewShip.row + 1,
          }
        : {
            gridRowStart: previewShip.row + 1,
            gridRowEnd: `span ${previewShip.size}`,
            gridColumnStart: previewShip.col + 1,
          };

    return (
      <div className="pointer-events-none relative z-30" style={style}>
        {/* <ShipPiece
          ship={previewShip}
          scale="ghost"
          className={isValid ? 'opacity-80' : 'opacity-90'}
        /> */}
      </div>
    );
  };

  const renderBoard = () => {
    const previewShip =
      dragState && hoverCell && activeDragShip
        ? {
            ...activeDragShip,
            placed: true,
            row: hoverCell.row,
            col: hoverCell.col,
          }
        : null;
    const previewCells = previewShip ? getShipCells(previewShip) : [];
    const previewCellSet = new Set(
      previewCells.map((cell) => getShipKey(cell.row, cell.col)),
    );
    const previewValid = previewShip
      ? canPlaceShip(previewShip, shipsRef.current)
      : false;

    return (
      <div
        ref={boardRef}
        className="relative aspect-square w-full max-w-md overflow-hidden rounded-4xl border border-white/10 bg-linear-to-br from-slate-950 via-slate-900 to-cyan-950 shadow-2xl"
      >
        <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => {
            const row = Math.floor(index / BOARD_SIZE);
            const col = index % BOARD_SIZE;
            const key = getShipKey(row, col);
            const isPreviewCell = previewCellSet.has(key);

            let cellClass =
              'border border-white/10 bg-slate-950/30 transition-colors';

            if (isPreviewCell) {
              cellClass = previewValid
                ? 'border border-emerald-300/90 bg-emerald-400/45 transition-colors'
                : 'border border-rose-300/90 bg-rose-500/45 transition-colors';
            }

            return <div key={key} className={cellClass} />;
          })}
        </div>

        <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
          {visibleShips
            .filter((ship) => ship.placed)
            .map((ship) => renderBoardShip(ship))}
          {renderPreviewShip()}
        </div>
      </div>
    );
  };

  const renderBattleBoard = ({ variant }) => {
    const self = gameState?.players?.[playerIndex];
    const opponent = gameState?.players?.[1 - playerIndex];
    const attackSource = variant === 'self' ? opponent : self;
    const showShips = variant === 'self';
    const attackedCells = attackSource
      ? [...(attackSource.hits || []), ...(attackSource.misses || [])]
      : [];
    const attackedSet = new Set(
      attackedCells.map((cell) => getShipKey(cell.row, cell.col)),
    );
    const shipCells = new Set(
      (self?.ships || []).map((cell) => getShipKey(cell.row, cell.col)),
    );

    return (
      <div className="relative aspect-square w-full max-w-2xl overflow-hidden rounded-4xl border border-white/10 bg-linear-to-br from-slate-950 via-slate-900 to-cyan-950 shadow-2xl">
        <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => {
            const row = Math.floor(index / BOARD_SIZE);
            const col = index % BOARD_SIZE;
            const key = getShipKey(row, col);
            const isAttacked = attackedSet.has(key);
            const isHit = attackSource?.hits?.some(
              (cell) => cell.row === row && cell.col === col,
            );
            const hasShip = shipCells.has(key);

            let cellClass = 'border border-white/10 bg-slate-950/30';
            if (showShips && hasShip) {
              cellClass = 'border border-sky-300/70 bg-sky-400/40';
            }
            if (isAttacked) {
              cellClass = isHit
                ? 'border border-rose-300/90 bg-rose-500/45'
                : 'border border-slate-300/80 bg-slate-400/45';
            }

            return (
              <div
                key={key}
                className={`${cellClass} transition-colors`}
                onClick={() => {
                  if (variant !== 'enemy') return;
                  if (!isYourTurn) return;
                  if (isAttacked) return;
                  makeMove({ action: 'attack', row, col });
                }}
              />
            );
          })}
        </div>
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
        <div className="flex w-full max-w-md flex-col items-center gap-4">
          <p className="text-center text-white/85">
            Tap a ship in the tray to rotate it. Drag it onto the board. Drag it
            back to the tray if you want to rotate it again.
          </p>

          <div className="w-full rounded-4xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-[0.28em] text-sky-100/80 uppercase">
                Ships
              </p>
              <p className="text-xs text-slate-300">
                Tap to rotate, drag to place
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {ships
                .filter((ship) => !ship.placed)
                .map((ship) => (
                  <ShipPiece
                    key={ship.id}
                    ship={ship}
                    scale="tray"
                    className={`touch-none transition-transform select-none ${dragState?.shipId === ship.id ? 'scale-95 opacity-60' : 'opacity-100'}`}
                    onPointerDown={handleShipPointerDown(ship.id)}
                  />
                ))}
            </div>
          </div>

          <div className="w-full">{renderBoard()}</div>

          <button
            onClick={handleSubmit}
            className={`w-full rounded-2xl px-4 py-3 text-lg font-semibold text-white transition ${
              hasSubmittedShips
                ? 'bg-emerald-600'
                : 'bg-sky-600 hover:bg-sky-500'
            }`}
            disabled={
              activeShips.filter((ship) => ship.placed).length !== 3 ||
              hasSubmittedShips
            }
          >
            {hasSubmittedShips
              ? 'Ships Confirmed ✓'
              : activeShips.filter((ship) => ship.placed).length === 3
                ? 'Start Game'
                : 'Place 3 Ships'}
          </button>

          {hasSubmittedShips && (
            <p className="text-yellow-300">Waiting for opponent...</p>
          )}

          <p className="text-white/75">
            {activeShips.filter((ship) => ship.placed).length} / 3 ships placed
          </p>
        </div>
      )}

      {gameState.phase === 'battle' && (
        <div className="flex w-full flex-col items-center gap-4 px-4 sm:px-6 lg:px-8">
          {gameState.winner == null && (
            <p className="text-white">
              {isYourTurn
                ? 'Your turn! Attack enemy board'
                : 'Waiting for opponent...'}
            </p>
          )}

          <div className="grid w-full max-w-7xl grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-8">
            <div className="flex w-full flex-col items-center gap-2">
              <p className="text-2xl font-semibold text-white">You</p>
              <div className="w-full max-w-2xl">
                {renderBattleBoard({ variant: 'self' })}
              </div>
            </div>

            <div className="flex w-full flex-col items-center gap-2">
              <p className="text-2xl font-semibold text-white">Enemy</p>
              <div className="w-full max-w-2xl">
                {renderBattleBoard({ variant: 'enemy' })}
              </div>
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
