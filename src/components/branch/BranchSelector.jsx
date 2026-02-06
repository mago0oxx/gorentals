import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BranchSelector({ selectedBranch, onBranchChange, className }) {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const data = await base44.entities.Branch.list("sort_order");
      setBranches(data);
      
      // Set default to Buenos Aires if no branch selected
      if (!selectedBranch && data.length > 0) {
        const buenosAires = data.find(b => b.city === "Buenos Aires");
        if (buenosAires && onBranchChange) {
          onBranchChange(buenosAires);
        }
      }
    } catch (error) {
      console.error("Error loading branches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || branches.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <MapPin className="w-4 h-4 text-gray-500" />
      <div className="flex items-center gap-1">
        {branches.map((branch, index) => (
          <div key={branch.id} className="flex items-center">
            <button
              onClick={() => !branch.is_coming_soon && onBranchChange(branch)}
              disabled={branch.is_coming_soon}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                selectedBranch?.id === branch.id
                  ? "bg-teal-600 text-white"
                  : branch.is_coming_soon
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              {branch.city}
              {branch.is_coming_soon && (
                <span className="ml-1 text-xs">• Próximamente</span>
              )}
            </button>
            {index < branches.length - 1 && (
              <span className="mx-1 text-gray-300">|</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}