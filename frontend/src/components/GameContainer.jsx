import { gameComponents } from '../games';

const GameContainer = ({ game, gameState, makeMove, backToRoom }) => {
  const Game = gameComponents[game];
  return (
    <div className="flex min-h-dvh w-screen items-center justify-center border-2 border-solid border-black text-3xl">
      {Game ? (
        <Game
          gameState={gameState}
          makeMove={makeMove}
          backToRoom={backToRoom}
        />
      ) : (
        'No game selected'
      )}
    </div>
  );
};

export default GameContainer;
