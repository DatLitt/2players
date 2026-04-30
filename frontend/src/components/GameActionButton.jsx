const GameActionButton = ({
  label,
  onClick,
  tone = 'bg-green-500 hover:bg-green-600',
}) => {
  return (
    <button
      type="button"
      className={`mt-4 rounded px-4 py-2 font-semibold text-white transition ${tone}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default GameActionButton;
