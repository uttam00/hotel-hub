import { BrandSpinner } from "@/components/ui/brand-spinner";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <BrandSpinner size="lg" className="text-primary" />
    </div>
  );
}
