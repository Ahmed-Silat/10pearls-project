export default function Button(props) {
  return (
    <button className={props.className} onClick={props.onClick}>
      <span>{props.name}</span>
    </button>
  );
}
