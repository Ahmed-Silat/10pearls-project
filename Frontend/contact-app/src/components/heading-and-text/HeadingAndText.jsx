import { Link } from "react-router-dom";

export default function HeadingAndText(props) {
  return (
    <div>
      <h3 className="font-extrabold my-10 text-4xl">{props.mainHeading}</h3>
      <p className="text-zinc-500">
        Doesn&apos;t have an account yet ?{" "}
        <Link
          to={props.link}
          className="text-blue-500 underline decoration-1 hover:no-underline transition-all duration-300 hover:text-blue-700"
        >
          {props.pageName}
        </Link>
      </p>
    </div>
  );
}
