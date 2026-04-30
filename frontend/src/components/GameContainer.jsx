import TicTacToe from '../games/tictactoe/TicTacToe';
import Battleship from '../games/battleship/Battleship';

const gameComponents = {
  tictactoe: TicTacToe,
  battleship: Battleship,
};

const GameContainer = ({
  game,
  gameState,
  makeMove,
  restartGame,
  backToRoom,
  playerIndex,
}) => {
  const Game = gameComponents[game];
  return (
    <div className="flex min-h-dvh w-screen items-center justify-center border-2 border-solid border-black bg-gray-800">
      {Game ? (
        <Game
          gameState={gameState}
          makeMove={makeMove}
          restartGame={restartGame}
          backToRoom={backToRoom}
          playerIndex={playerIndex}
        />
      ) : (
        'No game selected'
      )}
    </div>
  );
};

export default GameContainer;
