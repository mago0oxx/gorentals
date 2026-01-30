import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft, Calendar, RefreshCw, CheckCircle, 
  AlertCircle, Loader2, Link as LinkIcon, ExternalLink
} from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function CalendarSync() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [autoSync, setAutoSync] = useState(false);

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
    if (userData.user_type !== "owner") {
      navigate(createPageUrl("Dashboard"));
      return;
    }

    setUser(userData);

    const vehiclesData = await base44.entities.Vehicle.filter({ 
      owner_email: userData.email 
    });

    setVehicles(vehiclesData);
    
    // Load sync settings from user data
    if (userData.calendar_sync_vehicle_id) {
      setSelectedVehicle(userData.calendar_sync_vehicle_id);
      setAutoSync(userData.calendar_auto_sync || false);
      setLastSync(userData.calendar_last_sync);
    }

    setIsLoading(false);
  };

  const handleSyncNow = async () => {
    if (!selectedVehicle) {
      setSyncStatus({ type: "error", message: "Por favor selecciona un vehículo" });
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const response = await base44.functions.invoke("syncGoogleCalendar", {
        vehicle_id: selectedVehicle
      });

      if (response.data.success) {
        setSyncStatus({
          type: "success",
          message: `Sincronización exitosa: ${response.data.blocked_count} fechas bloqueadas`
        });
        setLastSync(new Date().toISOString());
        
        // Save sync settings
        await base44.auth.updateMe({
          calendar_sync_vehicle_id: selectedVehicle,
          calendar_auto_sync: autoSync,
          calendar_last_sync: new Date().toISOString()
        });
      } else {
        setSyncStatus({
          type: "error",
          message: response.data.error || "Error al sincronizar"
        });
      }
    } catch (error) {
      setSyncStatus({
        type: "error",
        message: error.message || "Error de conexión"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAutoSync = async (enabled) => {
    setAutoSync(enabled);
    await base44.auth.updateMe({
      calendar_sync_vehicle_id: selectedVehicle,
      calendar_auto_sync: enabled
    });
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando configuración..." />;
  }

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Volver
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sincronización de Calendario
          </h1>
          <p className="text-gray-500">
            Bloquea automáticamente fechas desde tu Google Calendar
          </p>
        </div>

        {/* How it works */}
        <Card className="border-0 shadow-sm rounded-2xl mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              ¿Cómo funciona?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 font-semibold">
                1
              </div>
              <p>Conecta tu cuenta de Google Calendar (necesitas autorizar el acceso)</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 font-semibold">
                2
              </div>
              <p>Selecciona el vehículo que quieres sincronizar</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 font-semibold">
                3
              </div>
              <p>Todos los eventos en tu calendario se convertirán en fechas bloqueadas automáticamente</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 font-semibold">
                4
              </div>
              <p>Activa la sincronización automática para mantener todo actualizado</p>
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card className="border-0 shadow-sm rounded-2xl mb-6">
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
            <CardDescription>
              Selecciona el vehículo y configura la sincronización
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="vehicle">Vehículo a sincronizar</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger id="vehicle" className="mt-2 rounded-xl">
                  <SelectValue placeholder="Selecciona un vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="space-y-1">
                <Label htmlFor="auto-sync" className="font-medium">
                  Sincronización automática
                </Label>
                <p className="text-sm text-gray-500">
                  Sincronizar cada 24 horas automáticamente
                </p>
              </div>
              <Switch
                id="auto-sync"
                checked={autoSync}
                onCheckedChange={handleToggleAutoSync}
                disabled={!selectedVehicle}
              />
            </div>

            {lastSync && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle className="w-4 h-4" />
                Última sincronización: {format(new Date(lastSync), "PPp", { locale: es })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Alert */}
        {syncStatus && (
          <Alert className={`mb-6 rounded-xl ${
            syncStatus.type === "success" 
              ? "border-green-200 bg-green-50" 
              : "border-red-200 bg-red-50"
          }`}>
            {syncStatus.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <AlertDescription className={
              syncStatus.type === "success" ? "text-green-800" : "text-red-800"
            }>
              {syncStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Sync Button */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <Button
              onClick={handleSyncNow}
              disabled={!selectedVehicle || isSyncing}
              className="w-full h-14 bg-teal-600 hover:bg-teal-700 rounded-xl text-lg"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Sincronizar ahora
                </>
              )}
            </Button>

            {selectedVehicleData && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Vehículo seleccionado:</strong> {selectedVehicleData.title}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Fechas bloqueadas actualmente:</strong> {selectedVehicleData.blocked_dates?.length || 0}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help */}
        <Card className="border-0 shadow-sm rounded-2xl mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-blue-900">
                <p className="font-medium">Importante:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>La sincronización bloqueará las fechas de eventos en tu calendario principal</li>
                  <li>Las fechas bloqueadas manualmente no se eliminarán</li>
                  <li>Puedes sincronizar diferentes vehículos con diferentes calendarios</li>
                  <li>La sincronización automática se ejecuta una vez al día</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}