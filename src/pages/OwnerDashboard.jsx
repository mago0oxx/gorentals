import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Car, DollarSign, TrendingUp, Calendar, Plus, ChevronLeft,
  Edit, Eye, ToggleLeft, ToggleRight, Star, CheckCircle, Clock,
  XCircle, BarChart3, Receipt, ArrowUpRight, AlertCircle
} from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import BookingCard from "@/components/booking/BookingCard";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    avgRating: 0
  });
  const [isLoading, setIsLoading] = useState(true);

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

    const [ownerVehicles, ownerBookings, ownerTransactions] = await Promise.all([
      base44.entities.Vehicle.filter({ owner_email: userData.email }, "-created_date"),
      base44.entities.Booking.filter({ owner_email: userData.email }, "-created_date"),
      base44.entities.Transaction.filter({ user_email: userData.email }, "-created_date")
    ]);

    setVehicles(ownerVehicles);
    setBookings(ownerBookings);
    setTransactions(ownerTransactions);

    // Calculate stats
    const activeVehicles = ownerVehicles.filter(v => v.is_active && v.is_available).length;
    const completedBookings = ownerBookings.filter(b => b.status === "completed");
    const pendingBookings = ownerBookings.filter(b => b.status === "pending");
    
    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.owner_payout || 0), 0);
    
    // This month earnings
    const now = new Date();
    const thisMonthTransactions = ownerTransactions.filter(t => {
      const txDate = new Date(t.created_date);
      return t.type === "payout" && 
             t.status === "completed" &&
             txDate.getMonth() === now.getMonth() && 
             txDate.getFullYear() === now.getFullYear();
    });
    const thisMonthEarnings = thisMonthTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate average rating from all vehicles
    const vehiclesWithRatings = ownerVehicles.filter(v => v.average_rating > 0);
    const avgRating = vehiclesWithRatings.length > 0
      ? vehiclesWithRatings.reduce((sum, v) => sum + v.average_rating, 0) / vehiclesWithRatings.length
      : 0;

    setStats({
      totalVehicles: ownerVehicles.length,
      activeVehicles,
      totalBookings: ownerBookings.length,
      completedBookings: completedBookings.length,
      pendingBookings: pendingBookings.length,
      totalEarnings,
      thisMonthEarnings,
      avgRating
    });

    setIsLoading(false);
  };

  const handleToggleAvailability = async (vehicleId, currentStatus) => {
    await base44.entities.Vehicle.update(vehicleId, {
      is_available: !currentStatus
    });
    await loadData();
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando panel de propietario..." />;
  }

  const pendingBookings = bookings.filter(b => b.status === "pending");
  const activeBookings = bookings.filter(b => ["approved", "paid", "active"].includes(b.status));
  const completedTransactions = transactions.filter(t => t.type === "payout" && t.status === "completed");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Volver al Dashboard
          </Button>
          <Link to={createPageUrl("CalendarSync")}>
            <Button variant="outline" className="rounded-xl">
              <Calendar className="w-4 h-4 mr-2" />
              Sincronizar calendario
            </Button>
          </Link>
          <Link to={createPageUrl("AddVehicle")}>
            <Button className="bg-teal-600 hover:bg-teal-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Agregar vehículo
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Propietario</h1>
            <p className="text-gray-500 mt-1">Gestiona tus vehículos, reservas e ingresos</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Vehículos activos</p>
                    <p className="text-2xl font-bold">{stats.activeVehicles}/{stats.totalVehicles}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                    <Car className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Ganancias totales</p>
                    <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(0)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Este mes</p>
                    <p className="text-2xl font-bold">${stats.thisMonthEarnings.toFixed(0)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Calificación</p>
                    <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Star className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="vehicles" className="space-y-6">
            <TabsList className="bg-white rounded-xl p-1 shadow-sm">
              <TabsTrigger value="vehicles" className="rounded-lg">
                <Car className="w-4 h-4 mr-2" />
                Mis Vehículos
              </TabsTrigger>
              <TabsTrigger value="bookings" className="rounded-lg">
                <Calendar className="w-4 h-4 mr-2" />
                Reservas
                {pendingBookings.length > 0 && (
                  <span className="ml-2 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                    {pendingBookings.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="earnings" className="rounded-lg">
                <DollarSign className="w-4 h-4 mr-2" />
                Ingresos
              </TabsTrigger>
            </TabsList>

            {/* Vehicles Tab */}
            <TabsContent value="vehicles" className="space-y-4">
              {vehicles.length === 0 ? (
                <EmptyState
                  icon={Car}
                  title="No tienes vehículos publicados"
                  description="Publica tu primer vehículo y comienza a generar ingresos"
                  actionLabel="Agregar vehículo"
                  actionLink="AddVehicle"
                />
              ) : (
                <div className="space-y-4">
                  {vehicles.map((vehicle) => (
                    <Card key={vehicle.id} className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          <img
                            src={vehicle.photos?.[0] || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400"}
                            alt={vehicle.title}
                            className="w-full sm:w-48 h-32 object-cover rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none"
                          />
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{vehicle.title}</h3>
                                <p className="text-sm text-gray-500">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-lg font-bold text-teal-600">${vehicle.price_per_day}/día</span>
                                  {vehicle.average_rating > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                      <span className="text-sm font-medium">{vehicle.average_rating.toFixed(1)}</span>
                                      <span className="text-sm text-gray-500">({vehicle.total_reviews})</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                <Badge className={vehicle.is_active ? "bg-green-100 text-green-700 border-0" : "bg-gray-100 text-gray-700 border-0"}>
                                  {vehicle.is_active ? "Activo" : "Inactivo"}
                                </Badge>
                                <Badge className={vehicle.is_available ? "bg-blue-100 text-blue-700 border-0" : "bg-red-100 text-red-700 border-0"}>
                                  {vehicle.is_available ? "Disponible" : "No disponible"}
                                </Badge>
                              </div>
                            </div>
                            
                            <Separator className="my-3" />
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{vehicle.total_bookings || 0} reservas</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  <span>${((vehicle.total_bookings || 0) * vehicle.price_per_day * 3).toFixed(0)} generados</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleAvailability(vehicle.id, vehicle.is_available)}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  {vehicle.is_available ? (
                                    <><ToggleRight className="w-4 h-4 mr-1 text-green-600" /> Disponible</>
                                  ) : (
                                    <><ToggleLeft className="w-4 h-4 mr-1" /> No disponible</>
                                  )}
                                </Button>
                                <Link to={createPageUrl(`VehicleDetails?id=${vehicle.id}`)}>
                                  <Button variant="outline" size="sm" className="rounded-lg">
                                    <Eye className="w-4 h-4 mr-1" />
                                    Ver
                                  </Button>
                                </Link>
                                <Link to={createPageUrl(`AddVehicle?id=${vehicle.id}`)}>
                                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700 rounded-lg">
                                    <Edit className="w-4 h-4 mr-1" />
                                    Editar
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-4">
              <Tabs defaultValue="pending">
                <TabsList>
                  <TabsTrigger value="pending">
                    Pendientes
                    {pendingBookings.length > 0 && (
                      <span className="ml-2 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                        {pendingBookings.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="active">Activas ({activeBookings.length})</TabsTrigger>
                  <TabsTrigger value="completed">Completadas ({stats.completedBookings})</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-4">
                  {pendingBookings.length === 0 ? (
                    <EmptyState
                      icon={Clock}
                      title="No hay solicitudes pendientes"
                      description="Las nuevas solicitudes de reserva aparecerán aquí"
                    />
                  ) : (
                    <div className="space-y-4">
                      {pendingBookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} userType="owner" />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="active" className="mt-4">
                  {activeBookings.length === 0 ? (
                    <EmptyState
                      icon={Calendar}
                      title="No hay reservas activas"
                      description="Las reservas aprobadas y en curso aparecerán aquí"
                    />
                  ) : (
                    <div className="space-y-4">
                      {activeBookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} userType="owner" />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="mt-4">
                  {stats.completedBookings === 0 ? (
                    <EmptyState
                      icon={CheckCircle}
                      title="Sin reservas completadas"
                      description="Tu historial de reservas completadas aparecerá aquí"
                    />
                  ) : (
                    <div className="space-y-4">
                      {bookings
                        .filter(b => b.status === "completed")
                        .map((booking) => (
                          <BookingCard key={booking.id} booking={booking} userType="owner" />
                        ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">Ingresos totales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-gray-900">${stats.totalEarnings.toFixed(2)}</p>
                    <p className="text-sm text-gray-500 mt-1">De {stats.completedBookings} reservas</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">Este mes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-teal-600">${stats.thisMonthEarnings.toFixed(2)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {((stats.thisMonthEarnings / (stats.totalEarnings || 1)) * 100).toFixed(0)}% del total
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">Ingreso promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-gray-900">
                      ${stats.completedBookings > 0 ? (stats.totalEarnings / stats.completedBookings).toFixed(2) : "0.00"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Por reserva</p>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions List */}
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Detalle de Pagos Recibidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {completedTransactions.length === 0 ? (
                    <EmptyState
                      icon={DollarSign}
                      title="Sin pagos recibidos"
                      description="Los pagos de tus reservas completadas aparecerán aquí"
                    />
                  ) : (
                    <div className="space-y-3">
                      {completedTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                              <ArrowUpRight className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{transaction.vehicle_title || transaction.description}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(transaction.created_date), "d 'de' MMMM yyyy", { locale: es })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-green-600">+${transaction.amount.toFixed(2)}</p>
                            <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completado
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Earnings by Vehicle */}
              {vehicles.length > 0 && (
                <Card className="border-0 shadow-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Rendimiento por Vehículo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vehicles.map((vehicle) => {
                        const vehicleBookings = bookings.filter(
                          b => b.vehicle_id === vehicle.id && b.status === "completed"
                        );
                        const vehicleEarnings = vehicleBookings.reduce(
                          (sum, b) => sum + (b.owner_payout || 0), 0
                        );
                        const percentage = stats.totalEarnings > 0 
                          ? (vehicleEarnings / stats.totalEarnings * 100)
                          : 0;

                        return (
                          <div key={vehicle.id} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium truncate flex-1">{vehicle.title}</span>
                              <span className="font-bold text-teal-600 ml-2">${vehicleEarnings.toFixed(0)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-teal-600 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500">
                              {vehicleBookings.length} reservas • {percentage.toFixed(1)}% del total
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}