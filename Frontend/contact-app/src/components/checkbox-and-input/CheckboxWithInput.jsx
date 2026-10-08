export default function CheckboxWithInput(props) {
  return (
    <div className="my-4 flex items-center gap-2">
      <input
        type="checkbox"
        id={props.inputId}
        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-sky-600 focus:ring-sky-500"
      />
      <label
        htmlFor={props.htmlFor}
        className="cursor-pointer text-sm text-slate-600"
      >
        {props.labelName}
      </label>
    </div>
  );
}