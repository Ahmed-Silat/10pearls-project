export default function CheckboxWithInput(props) {
  return (
    <div className="flex items-center my-4">
      <input type="checkbox" id={props.inputId} className="mr-1 ml-2" />
      <label
        htmlFor={props.htmlFor}
        className="text-xs text-zinc-500 cursor-pointer"
      >
        {props.labelName}
      </label>
    </div>
  );
}
