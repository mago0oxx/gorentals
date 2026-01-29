import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Bell, MessageCircle, CreditCard, Tag, Clock, Volume2, Loader2 } from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PushNotificationManager from "@/components/notifications/PushNotificationManager";
import { motion } from "framer-motion";

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    booking_updates: true,
    chat_messages: true,
    payment_updates: true,
    promotional: false,
    reminders: true,
    push_enabled: true,
    sound_enabled: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      navigate(createPageUrl("Register"));
      return;
    }

    const userData = await base44.auth.me();
    setUser(userData);

    if (userData.notification_preferences) {
      setPreferences(userData.notification_preferences);
    }

    setIsLoading(false);
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await base44.auth.updateMe({
      notification_preferences: preferences
    });
    
    // If enabling push notifications, request permission
    if (preferences.push_enabled && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    
    setIsSaving(false);
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando configuración..." />;
  }

  const notificationTypes = [
    {
      key: "booking_updates",
      icon: Bell,
      title: "Actualizaciones de reservas",
      description: "Recibe notificaciones cuando el estado de tus reservas cambie (aprobadas, rechazadas, completadas)"
    },
    {
      key: "chat_messages",
      icon: MessageCircle,
      title: "Mensajes de chat",
      description: "Notificaciones cuando recibas nuevos mensajes de propietarios o arrendatarios"
    },
    {
      key: "payment_updates",
      icon: CreditCard,
      title: "Actualizaciones de pagos",
      description: "Notificaciones sobre pagos, reembolsos y ganancias"
    },
    {
      key: "promotional",
      icon: Tag,
      title: "Ofertas y promociones",
      description: "Recibe ofertas especiales y promociones de vehículos"
    },
    {
      key: "reminders",
      icon: Clock,
      title: "Recordatorios",
      description: "Recordatorios sobre recogida y devolución de vehículos"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Profile"))}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Volver al perfil
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración de notificaciones</h1>
            <p className="text-gray-500 mt-1">
              Personaliza qué notificaciones deseas recibir
            </p>
          </div>

          {/* Notification Types */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Tipos de notificaciones</CardTitle>
              <CardDescription>
                Elige qué información quieres recibir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {notificationTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div key={type.key} className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-teal-600" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={type.key} className="font-medium cursor-pointer">
                          {type.title}
                        </Label>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {type.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={type.key}
                      checked={preferences[type.key]}
                      onCheckedChange={() => handleToggle(type.key)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Push Notifications Settings */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Preferencias de entrega</CardTitle>
              <CardDescription>
                Cómo deseas recibir las notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="push_enabled" className="font-medium cursor-pointer">
                      Notificaciones push
                    </Label>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Recibe notificaciones del navegador incluso cuando no estés en la app
                    </p>
                  </div>
                </div>
                <Switch
                  id="push_enabled"
                  checked={preferences.push_enabled}
                  onCheckedChange={() => handleToggle("push_enabled")}
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Volume2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="sound_enabled" className="font-medium cursor-pointer">
                      Sonido de notificaciones
                    </Label>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Reproducir un sonido cuando llegue una notificación
                    </p>
                  </div>
                </div>
                <Switch
                  id="sound_enabled"
                  checked={preferences.sound_enabled}
                  onCheckedChange={() => handleToggle("sound_enabled")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Push Notification Manager */}
          <PushNotificationManager />

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-teal-600 hover:bg-teal-700 rounded-xl h-12"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar preferencias"
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}