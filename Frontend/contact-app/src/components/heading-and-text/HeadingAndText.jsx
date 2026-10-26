import TextLink from "../ui/TextLink";

/** Page heading for the auth cards, with a "Don't have an account yet? Signup" style line under it. */
export default function HeadingAndText(props) {
  return (
    <div className="grid gap-1.5">
      <h1 className="text-xl font-semibold leading-none tracking-tight">{props.mainHeading}</h1>
      <p className="text-sm text-muted-foreground">
        {props.prompt}{" "}
        <TextLink to={props.link} disabled={props.disabled}>
          {props.pageName}
        </TextLink>
      </p>
    </div>
  );
}
