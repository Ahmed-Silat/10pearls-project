export default function Button(props) {
  return (
    <button className={props.className} onClick={props.onClick}>
      {/* <img src={props.image} alt={props.alt} className={props.imageClass} /> */}
      <span className={props.imageClass}>{props.image}</span>
      <span className={props.textClass}>{props.name}</span>
    </button>
  );
}
