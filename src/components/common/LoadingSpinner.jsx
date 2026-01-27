import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoadingSpinner({ className, size = "md", text }) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Loader2 className={cn(sizes[size], "animate-spin text-teal-600")} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}