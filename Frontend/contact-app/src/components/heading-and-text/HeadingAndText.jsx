import TextLink from "../ui/TextLink";

export default function HeadingAndText(props) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        {props.mainHeading}
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Doesn&apos;t have an account yet?{" "}
        <TextLink to={props.link} disabled={props.disabled}>
          {props.pageName}
        </TextLink>
      </p>
    </div>
  );
}
