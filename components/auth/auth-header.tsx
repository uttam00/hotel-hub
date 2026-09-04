interface AuthHeaderProps {
  heading: string;
  description: string;
}

/**
 * Left-aligned rather than centred: the form fields below it are left-aligned,
 * and a centred heading over left-aligned inputs creates two competing axes.
 * The brand mark lives in AuthShell, so it isn't repeated here.
 */
export function AuthHeader({ heading, description }: AuthHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{heading}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
