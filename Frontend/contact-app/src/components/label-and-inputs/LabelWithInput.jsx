export default function LabelWithInput(props) {
  return (
    <div className="my-3">
      <label
        htmlFor={props.htmlFor}
        className="block"
        // className={props.labelClass}
      >
        {props.labelName}
      </label>
      <input
        type={props.inputType}
        id={props.inputId}
        className={`${props.className} text-black rounded-md border-2 border-gray-300 rounded-md w-full p-1.5 focus:border-blue-500`}
        placeholder={props.placeholder}
        onChange={props.onChange}
        required
        value={props.value}
      />
    </div>
  );
}
