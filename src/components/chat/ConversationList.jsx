import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ConversationList({ conversations, currentUser, onSelectConversation, selectedId }) {
  const isOwner = (conv) => currentUser.email === conv.owner_email;
  
  const getOtherUser = (conv) => {
    return isOwner(conv)
      ? { name: conv.renter_name, email: conv.renter_email }
      : { name: conv.owner_name, email: conv.owner_email };
  };

  const getUnreadCount = (conv) => {
    return isOwner(conv) ? conv.unread_count_owner : conv.unread_count_renter;
  };

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No hay conversaciones aún</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => {
        const otherUser = getOtherUser(conv);
        const unreadCount = getUnreadCount(conv);
        const isSelected = conv.id === selectedId;

        return (
          <Card
            key={conv.id}
            onClick={() => onSelectConversation(conv)}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-0 shadow-sm rounded-xl ${
              isSelected ? "bg-teal-50 border-teal-200" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-teal-100 text-teal-700">
                  {otherUser.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold truncate">{otherUser.name}</p>
                  {unreadCount > 0 && (
                    <Badge className="bg-teal-600 text-white border-0 h-5 min-w-[20px] flex items-center justify-center">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate mb-1">{conv.vehicle_title}</p>
                {conv.last_message && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 truncate flex-1">
                      {conv.last_message}
                    </p>
                    {conv.last_message_at && (
                      <p className="text-xs text-gray-400 ml-2">
                        {format(new Date(conv.last_message_at), "dd/MM", { locale: es })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}