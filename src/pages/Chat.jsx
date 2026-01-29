import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ChatWindow from "@/components/chat/ChatWindow";
import ConversationList from "@/components/chat/ConversationList";
import EmptyState from "@/components/common/EmptyState";
import { MessageCircle } from "lucide-react";

export default function Chat() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const conversationId = params.get("id");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) setSelectedConversation(conv);
    }
  }, [conversationId, conversations]);

  const loadData = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      navigate(createPageUrl("Register"));
      return;
    }

    const userData = await base44.auth.me();
    setUser(userData);

    const convs = await base44.entities.Conversation.filter(
      {
        $or: [
          { owner_email: userData.email },
          { renter_email: userData.email }
        ]
      },
      "-last_message_at"
    );

    setConversations(convs);
    setIsLoading(false);

    // Subscribe to conversation updates
    base44.entities.Conversation.subscribe((event) => {
      if (event.type === "create" || event.type === "update") {
        loadData();
      }
    });
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando mensajes..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Volver al Dashboard
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mensajes</h1>

        {conversations.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No tienes conversaciones"
            description="Las conversaciones con propietarios o arrendatarios aparecerán aquí"
          />
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <ConversationList
                conversations={conversations}
                currentUser={user}
                onSelectConversation={setSelectedConversation}
                selectedId={selectedConversation?.id}
              />
            </div>

            {/* Chat Window */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <ChatWindow
                  conversation={selectedConversation}
                  currentUser={user}
                  onClose={() => setSelectedConversation(null)}
                />
              ) : (
                <div className="h-[600px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl">
                  <p className="text-gray-400">Selecciona una conversación para comenzar</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}