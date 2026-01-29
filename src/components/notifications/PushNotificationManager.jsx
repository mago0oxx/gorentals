import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff, Check, X } from "lucide-react";

export default function PushNotificationManager() {
  const [permission, setPermission] = useState(Notification.permission);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("Tu navegador no soporta notificaciones push");
      return;
    }

    setIsRequesting(true);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        // Update user preferences
        const user = await base44.auth.me();
        await base44.auth.updateMe({
          notification_preferences: {
            ...(user.notification_preferences || {}),
            push_enabled: true
          }
        });

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);

        // Show test notification
        new Notification("¡Notificaciones activadas!", {
          body: "Ahora recibirás actualizaciones importantes sobre tus reservas.",
          icon: "/favicon.ico",
          badge: "/favicon.ico"
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  const disableNotifications = async () => {
    const user = await base44.auth.me();
    await base44.auth.updateMe({
      notification_preferences: {
        ...(user.notification_preferences || {}),
        push_enabled: false
      }
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (!("Notification" in window)) {
    return null;
  }

  if (permission === "granted") {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-base">Notificaciones activadas</CardTitle>
              <CardDescription className="text-xs">Recibirás alertas importantes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {showSuccess && (
            <div className="flex items-center gap-2 text-green-700 text-sm mb-2">
              <Check className="w-4 h-4" />
              Configuración guardada
            </div>
          )}
          <Button
            onClick={disableNotifications}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <BellOff className="w-4 h-4 mr-2" />
            Desactivar notificaciones
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (permission === "denied") {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <BellOff className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-base">Notificaciones bloqueadas</CardTitle>
              <CardDescription className="text-xs">
                Has bloqueado las notificaciones
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 mb-3">
            Para recibir notificaciones, debes habilitar los permisos en la configuración de tu navegador.
          </p>
          <div className="bg-white rounded-lg p-3 text-xs text-gray-600">
            <strong>Cómo habilitar:</strong>
            <ol className="list-decimal ml-4 mt-1 space-y-1">
              <li>Haz clic en el ícono de candado/información en la barra de direcciones</li>
              <li>Busca "Notificaciones"</li>
              <li>Selecciona "Permitir"</li>
              <li>Recarga la página</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-base">Activa las notificaciones push</CardTitle>
            <CardDescription className="text-xs">
              Mantente informado sobre tus reservas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-sm text-gray-600">
          Recibe alertas instantáneas sobre:
        </p>
        <ul className="text-sm text-gray-600 space-y-1.5">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            Nuevas solicitudes de reserva
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            Aprobaciones y rechazos
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            Confirmaciones de pago
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            Recordatorios de recogida/devolución
          </li>
        </ul>
        <Button
          onClick={requestPermission}
          disabled={isRequesting}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Bell className="w-4 h-4 mr-2" />
          {isRequesting ? "Activando..." : "Activar notificaciones"}
        </Button>
      </CardContent>
    </Card>
  );
}