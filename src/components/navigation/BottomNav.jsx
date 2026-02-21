import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Calendar, MessageCircle, User } from "lucide-react";
import { useRef, useEffect } from "react";

export default function BottomNav({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationHistory = useRef({
    Browse: [],
    MyBookings: [],
    Dashboard: [],
    Chat: [],
    Profile: []
  });
  const currentTab = useRef(null);

  // Track navigation history per tab
  useEffect(() => {
    const pageName = location.pathname.split('/').pop();
    const tabForPage = tabs.find(t => 
      t.path === location.pathname || 
      (t.rootPages && t.rootPages.includes(pageName))
    );
    
    if (tabForPage && currentTab.current === tabForPage.id) {
      const history = navigationHistory.current[tabForPage.id];
      if (!history.includes(location.pathname)) {
        history.push(location.pathname);
      }
    }
  }, [location.pathname]);

  const tabs = [
    {
      id: "Browse",
      name: "Explorar",
      path: createPageUrl("Browse"),
      rootPages: ["Browse", "VehicleDetails", "CreateBooking", "LocalGuides"],
      icon: Search,
      active: ["Browse", "VehicleDetails", "CreateBooking", "LocalGuides"].some(p => 
        location.pathname === createPageUrl(p)
      )
    },
    {
      id: user ? "MyBookings" : "Dashboard",
      name: "Reservas",
      path: createPageUrl(user ? "MyBookings" : "Dashboard"),
      rootPages: user ? ["MyBookings", "BookingDetails"] : ["Dashboard"],
      icon: Calendar,
      active: (user ? ["MyBookings", "BookingDetails"] : ["Dashboard"]).some(p => 
        location.pathname === createPageUrl(p)
      )
    },
    {
      id: "Chat",
      name: "Chat",
      path: createPageUrl("Chat"),
      rootPages: ["Chat"],
      icon: MessageCircle,
      active: location.pathname === createPageUrl("Chat")
    },
    {
      id: "Profile",
      name: "Perfil",
      path: createPageUrl("Profile"),
      rootPages: ["Profile", "NotificationSettings"],
      icon: User,
      active: ["Profile", "NotificationSettings"].some(p => 
        location.pathname === createPageUrl(p)
      )
    }
  ];

  const handleTabClick = (tab, e) => {
    e.preventDefault();

    // If clicking the active tab, reset to root
    if (tab.active) {
      navigationHistory.current[tab.id] = [];
      navigate(tab.path);
    } else {
      // Switch to new tab, preserving its history
      currentTab.current = tab.id;
      const history = navigationHistory.current[tab.id];
      if (history.length > 0) {
        navigate(history[history.length - 1]);
      } else {
        navigate(tab.path);
      }
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.name}
              onClick={(e) => handleTabClick(tab, e)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}