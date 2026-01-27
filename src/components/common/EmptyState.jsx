import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  actionLink,
  onAction 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && (actionLink || onAction) && (
        actionLink ? (
          <Link to={createPageUrl(actionLink)}>
            <Button className="bg-teal-600 hover:bg-teal-700 rounded-xl">
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button onClick={onAction} className="bg-teal-600 hover:bg-teal-700 rounded-xl">
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}