import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Plus, History, Calendar, Wrench } from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import VehicleHistoryTimeline from "@/components/vehicle/VehicleHistoryTimeline";
import AddMaintenanceRecordForm from "@/components/vehicle/AddMaintenanceRecordForm";
import { motion } from "framer-motion";

export default function VehicleHistory() {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const vehicleId = params.get("id");

  useEffect(() => {
    loadData();
  }, [vehicleId]);

  const loadData = async () => {
    if (!vehicleId) return;
    setIsLoading(true);

    const [vehicleData, records, vehicleBookings] = await Promise.all([
      base44.entities.Vehicle.filter({ id: vehicleId }),
      base44.entities.VehicleMaintenanceRecord.filter(
        { vehicle_id: vehicleId },
        "-date"
      ),
      base44.entities.Booking.filter(
        { vehicle_id: vehicleId, status: "completed" },
        "-start_date"
      )
    ]);

    if (vehicleData.length > 0) {
      setVehicle(vehicleData[0]);
    }
    setMaintenanceRecords(records);
    setBookings(vehicleBookings);
    setIsLoading(false);
  };

  const handleAddSuccess = () => {
    setShowAddForm(false);
    loadData();
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando historial..." />;
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Vehículo no encontrado</p>
      </div>
    );
  }

  const totalMaintenanceCost = maintenanceRecords
    .reduce((sum, r) => sum + (r.cost || 0), 0);

  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.owner_payout || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("MyVehicles"))}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Volver a mis vehículos
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Vehicle Info Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Historial del vehículo</h1>
              <p className="text-gray-600 mt-1">{vehicle.title}</p>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-teal-600 hover:bg-teal-700 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar registro
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
                    <p className="text-sm text-gray-500">Reservas completadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{maintenanceRecords.length}</p>
                    <p className="text-sm text-gray-500">Registros de servicio</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                    <History className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(0)}</p>
                    <p className="text-sm text-gray-500">Ingresos totales</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Record Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AddMaintenanceRecordForm
                vehicle={vehicle}
                onSuccess={handleAddSuccess}
                onCancel={() => setShowAddForm(false)}
              />
            </motion.div>
          )}

          {/* History Timeline */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Historial completo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="all">Todo</TabsTrigger>
                  <TabsTrigger value="bookings">Reservas</TabsTrigger>
                  <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                  <VehicleHistoryTimeline
                    maintenanceRecords={maintenanceRecords}
                    bookings={bookings}
                  />
                </TabsContent>

                <TabsContent value="bookings" className="mt-0">
                  <VehicleHistoryTimeline
                    maintenanceRecords={[]}
                    bookings={bookings}
                  />
                </TabsContent>

                <TabsContent value="maintenance" className="mt-0">
                  <VehicleHistoryTimeline
                    maintenanceRecords={maintenanceRecords}
                    bookings={[]}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Maintenance Cost Summary */}
          {maintenanceRecords.length > 0 && (
            <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-orange-50 to-red-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Costo total de mantenimiento</p>
                    <p className="text-3xl font-bold text-gray-900">${totalMaintenanceCost.toFixed(2)}</p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center">
                    <Wrench className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}