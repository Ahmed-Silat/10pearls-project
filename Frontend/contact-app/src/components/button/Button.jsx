export default function Button(props) {
  const {
    name,
    className = "",
    onClick,
    type = "button",
    image,
    imageClass = "",
    disabled = false,
  } = props;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {image && <span className={`inline-flex ${imageClass}`}>{image}</span>}
      {name && <span>{name}</span>}
    </button>
  );
}