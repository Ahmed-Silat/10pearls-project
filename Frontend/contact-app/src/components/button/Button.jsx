export default function Button(props) {
  return (
    <button className={props.className}>
      <span>{props.name}</span>
    </button>
  );
}
