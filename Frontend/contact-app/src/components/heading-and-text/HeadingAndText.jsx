import { Link } from "react-router-dom";

export default function HeadingAndText(props) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        {props.mainHeading}
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Doesn&apos;t have an account yet?{" "}
        <Link
          to={props.link}
          className="font-semibold text-sky-600 transition-colors duration-200 hover:text-sky-700 hover:underline"
        >
          {props.pageName}
        </Link>
      </p>
    </div>
  );
}