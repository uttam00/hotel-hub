import { Building } from "lucide-react";

interface AuthHeaderProps {
  heading: string;
  description: string;
}

export function AuthHeader({ heading, description }: AuthHeaderProps) {
  return (
    <div className="flex flex-col items-center space-y-2 text-center">
      <div className="flex items-center justify-center gap-2">
        <Building className="h-6 w-6" />
        <span className="text-xl font-bold">HostelHub</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
