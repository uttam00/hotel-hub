import { BrandSpinner } from "@/components/ui/brand-spinner";
import { cn } from "@/lib/utils";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Loader({ size = "md", className }: LoaderProps) {
  return <BrandSpinner size={size} className={cn("text-primary", className)} />;
}

export function LoaderWithText({
  text = "Loading...",
  size = "md",
}: {
  text?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader size={size} />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function TableLoader() {
  return (
    <div className="flex items-center justify-center py-8">
      <LoaderWithText />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <LoaderWithText size="lg" />
    </div>
  );
}
