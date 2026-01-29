import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ChatWindow({ conversation, onClose, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const isOwner = currentUser.email === conversation.owner_email;
  const otherUser = isOwner 
    ? { name: conversation.renter_name, email: conversation.renter_email }
    : { name: conversation.owner_name, email: conversation.owner_email };

  useEffect(() => {
    loadMessages();
    
    // Subscribe to new messages
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data.conversation_id === conversation.id) {
        if (event.type === "create") {
          setMessages(prev => [...prev, event.data]);
          scrollToBottom();
          
          // Mark as read if not from current user
          if (event.data.sender_email !== currentUser.email) {
            markAsRead(event.data.id);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    const msgs = await base44.entities.Message.filter(
      { conversation_id: conversation.id },
      "created_date"
    );
    setMessages(msgs);
    
    // Mark unread messages as read
    const unreadMessages = msgs.filter(m => 
      !m.is_read && m.sender_email !== currentUser.email
    );
    
    for (const msg of unreadMessages) {
      await markAsRead(msg.id);
    }
    
    // Reset unread count
    const field = isOwner ? "unread_count_owner" : "unread_count_renter";
    await base44.entities.Conversation.update(conversation.id, {
      [field]: 0
    });
    
    setIsLoading(false);
  };

  const markAsRead = async (messageId) => {
    await base44.entities.Message.update(messageId, {
      is_read: true,
      read_at: new Date().toISOString()
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    
    await base44.entities.Message.create({
      conversation_id: conversation.id,
      sender_id: currentUser.id,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name,
      message: newMessage.trim()
    });

    // Update conversation
    const otherUserField = isOwner ? "unread_count_renter" : "unread_count_owner";
    await base44.entities.Conversation.update(conversation.id, {
      last_message: newMessage.trim(),
      last_message_at: new Date().toISOString(),
      [otherUserField]: (conversation[otherUserField] || 0) + 1
    });

    setNewMessage("");
    setIsSending(false);
  };

  return (
    <Card className="border-0 shadow-lg rounded-2xl flex flex-col h-[600px]">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-teal-100 text-teal-700">
                {otherUser.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{otherUser.name}</CardTitle>
              <p className="text-sm text-gray-500">{conversation.vehicle_title}</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No hay mensajes aún. ¡Envía el primero!
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.sender_email === currentUser.email;
            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[70%] ${isCurrentUser ? "order-2" : "order-1"}`}>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isCurrentUser
                        ? "bg-teal-600 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-900 rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                  <p className={`text-xs text-gray-400 mt-1 ${isCurrentUser ? "text-right" : "text-left"}`}>
                    {format(new Date(msg.created_date), "HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="border-t p-4">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 rounded-xl"
            disabled={isSending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="bg-teal-600 hover:bg-teal-700 rounded-xl"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}