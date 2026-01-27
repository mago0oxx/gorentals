import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Calendar, CheckCircle, XCircle, Clock, Car, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const typeConfig = {
  booking_request: { icon: Calendar, color: "text-blue-600 bg-blue-100" },
  booking_approved: { icon: CheckCircle, color: "text-green-600 bg-green-100" },
  booking_rejected: { icon: XCircle, color: "text-red-600 bg-red-100" },
  booking_paid: { icon: DollarSign, color: "text-green-600 bg-green-100" },
  booking_completed: { icon: CheckCircle, color: "text-teal-600 bg-teal-100" },
  pickup_reminder: { icon: Car, color: "text-amber-600 bg-amber-100" },
  return_reminder: { icon: Clock, color: "text-purple-600 bg-purple-100" }
};

export default function NotificationBell({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (userEmail) {
      loadNotifications();
      // Subscribe to real-time updates
      const unsubscribe = base44.entities.Notification.subscribe((event) => {
        if (event.data?.user_email === userEmail) {
          loadNotifications();
        }
      });
      return () => unsubscribe();
    }
  }, [userEmail]);

  const loadNotifications = async () => {
    const data = await base44.entities.Notification.filter(
      { user_email: userEmail },
      "-created_date",
      20
    );
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.is_read).length);
  };

  const markAsRead = async (notification) => {
    if (!notification.is_read) {
      await base44.entities.Notification.update(notification.id, { is_read: true });
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => 
      base44.entities.Notification.update(n.id, { is_read: true })
    ));
    loadNotifications();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-teal-600">
              Marcar todas como leídas
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No tienes notificaciones
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const config = typeConfig[notification.type] || typeConfig.booking_request;
                const Icon = config.icon;
                
                return (
                  <Link
                    key={notification.id}
                    to={notification.booking_id ? createPageUrl(`BookingDetails?id=${notification.booking_id}`) : "#"}
                    onClick={() => {
                      markAsRead(notification);
                      setOpen(false);
                    }}
                    className={`block p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? "bg-blue-50/50" : ""}`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.is_read ? "font-semibold" : ""}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}