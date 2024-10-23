export default function TextWithHorizontalLine() {
  return (
    <div className="flex items-center my-6">
      <hr className="flex-grow border-t border-gray-300" />
      <span className="mx-4 text-gray-500 text-sm">or login with</span>
      <hr className="flex-grow border-t border-gray-300" />
    </div>
  );
}
