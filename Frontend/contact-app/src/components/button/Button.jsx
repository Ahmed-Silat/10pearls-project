export default function Button(props) {
  return (
    <button className={props.className} onClick={props.onClick}>
      <span className={props.imageClass}>{props.image}</span>
      <span>{props.name}</span>
    </button>
  );
}
