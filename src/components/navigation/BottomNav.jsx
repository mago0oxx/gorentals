import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Calendar, MessageCircle, User } from "lucide-react";

export default function BottomNav({ user }) {
  const location = useLocation();
  
  const tabs = [
    {
      name: "Explorar",
      path: createPageUrl("Browse"),
      icon: Search,
      active: location.pathname === createPageUrl("Browse")
    },
    {
      name: "Reservas",
      path: createPageUrl(user ? "MyBookings" : "Dashboard"),
      icon: Calendar,
      active: location.pathname === createPageUrl("MyBookings") || location.pathname === createPageUrl("Dashboard")
    },
    {
      name: "Chat",
      path: createPageUrl("Chat"),
      icon: MessageCircle,
      active: location.pathname === createPageUrl("Chat")
    },
    {
      name: "Perfil",
      path: createPageUrl("Profile"),
      icon: User,
      active: location.pathname === createPageUrl("Profile")
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              to={tab.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                tab.active
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${tab.active ? "fill-teal-600 dark:fill-teal-400" : ""}`} />
              <span className="text-xs font-medium">{tab.name}</span>
              {tab.active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-teal-600 dark:bg-teal-400 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}