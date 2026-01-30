import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft, DollarSign, TrendingUp, Calendar, Download,
  Car, CheckCircle, Clock, Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const COLORS = ['#14b8a6', '#06b6d4', '#8b5cf6', '#f59e0b'];

export default function OwnerEarnings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("this_month");
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    completedBookings: 0,
    pendingEarnings: 0,
    avgBookingValue: 0
  });
  const [vehicleStats, setVehicleStats] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (bookings.length > 0) {
      calculateStats();
    }
  }, [period, bookings]);

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

    const [vehiclesData, bookingsData, transactionsData] = await Promise.all([
      base44.entities.Vehicle.filter({ owner_email: userData.email }),
      base44.entities.Booking.filter({ owner_email: userData.email }, "-created_date"),
      base44.entities.Transaction.filter({ 
        user_email: userData.email,
        type: "payout"
      }, "-created_date")
    ]);

    setVehicles(vehiclesData);
    setBookings(bookingsData);
    setTransactions(transactionsData);
    setIsLoading(false);
  };

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month":
        return { 
          start: startOfMonth(subMonths(now, 1)), 
          end: endOfMonth(subMonths(now, 1)) 
        };
      case "this_year":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "all_time":
        return { start: new Date(2020, 0, 1), end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const calculateStats = () => {
    const { start, end } = getDateRange();
    
    const filteredBookings = bookings.filter(b => {
      const bookingDate = parseISO(b.created_date);
      return bookingDate >= start && bookingDate <= end;
    });

    const completed = filteredBookings.filter(b => b.status === "completed");
    const paid = filteredBookings.filter(b => b.payment_status === "paid" && b.status !== "completed");

    const totalEarnings = completed.reduce((sum, b) => sum + (b.owner_payout || 0), 0);
    const pendingEarnings = paid.reduce((sum, b) => sum + (b.owner_payout || 0), 0);
    const avgBookingValue = completed.length > 0 ? totalEarnings / completed.length : 0;

    setStats({
      totalEarnings,
      completedBookings: completed.length,
      pendingEarnings,
      avgBookingValue
    });

    // Stats by vehicle
    const vehicleMap = {};
    filteredBookings.forEach(booking => {
      if (booking.status === "completed") {
        if (!vehicleMap[booking.vehicle_id]) {
          vehicleMap[booking.vehicle_id] = {
            title: booking.vehicle_title,
            earnings: 0,
            bookings: 0
          };
        }
        vehicleMap[booking.vehicle_id].earnings += booking.owner_payout || 0;
        vehicleMap[booking.vehicle_id].bookings += 1;
      }
    });

    const vehicleStatsArray = Object.entries(vehicleMap).map(([id, data]) => ({
      name: data.title,
      value: data.earnings,
      bookings: data.bookings
    })).sort((a, b) => b.value - a.value);

    setVehicleStats(vehicleStatsArray);

    // Monthly data for chart
    if (period === "this_year" || period === "all_time") {
      const monthlyMap = {};
      bookings.forEach(booking => {
        if (booking.status === "completed") {
          const date = parseISO(booking.created_date);
          if (date >= start && date <= end) {
            const monthKey = format(date, "MMM yyyy", { locale: es });
            if (!monthlyMap[monthKey]) {
              monthlyMap[monthKey] = 0;
            }
            monthlyMap[monthKey] += booking.owner_payout || 0;
          }
        }
      });

      const monthlyArray = Object.entries(monthlyMap).map(([month, amount]) => ({
        month,
        amount
      }));

      setMonthlyData(monthlyArray);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await base44.functions.invoke("generateEarningsReport", {
        owner_email: user.email,
        period,
        stats,
        vehicleStats,
        monthlyData
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-ganancias-${period}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Error exporting report:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando reportes..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Volver
          </Button>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_month">Este mes</SelectItem>
                <SelectItem value="last_month">Mes pasado</SelectItem>
                <SelectItem value="this_year">Este año</SelectItem>
                <SelectItem value="all_time">Todo el tiempo</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="outline"
              className="rounded-xl"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Exportar PDF
            </Button>
            <Link to={createPageUrl("CalendarSync")}>
              <Button variant="outline" className="rounded-xl">
                <Calendar className="w-4 h-4 mr-2" />
                Sincronizar calendario
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reportes de Ganancias</h1>
          <p className="text-gray-500 mt-1">Analiza tus ingresos y rendimiento</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Ganancias</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalEarnings.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Reservas completadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Ganancias pendientes</p>
              <p className="text-2xl font-bold text-gray-900">${stats.pendingEarnings.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Promedio por reserva</p>
              <p className="text-2xl font-bold text-gray-900">${stats.avgBookingValue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly Chart */}
          {(period === "this_year" || period === "all_time") && monthlyData.length > 0 && (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle>Ganancias por mes</CardTitle>
                <CardDescription>Evolución de tus ingresos en el tiempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => `$${value.toFixed(2)}`}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#14b8a6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Vehicle Performance */}
          {vehicleStats.length > 0 && (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle>Rendimiento por vehículo</CardTitle>
                <CardDescription>Comparación de ganancias entre tus vehículos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vehicleStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => `$${value.toFixed(2)}`}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="value" fill="#14b8a6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Distribution Pie */}
          {vehicleStats.length > 0 && (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle>Distribución de ingresos</CardTitle>
                <CardDescription>Porcentaje de ganancias por vehículo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={vehicleStats}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
                    >
                      {vehicleStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `$${value.toFixed(2)}`}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Vehicle Details Table */}
          {vehicleStats.length > 0 && (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle>Detalles por vehículo</CardTitle>
                <CardDescription>Resumen de actividad y ganancias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vehicleStats.map((vehicle, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                          <Car className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{vehicle.name}</p>
                          <p className="text-sm text-gray-500">{vehicle.bookings} reservas</p>
                        </div>
                      </div>
                      <p className="text-lg font-semibold text-teal-600">
                        ${vehicle.value.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {vehicleStats.length === 0 && (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay datos para este período
              </h3>
              <p className="text-gray-500">
                Selecciona otro período o espera a tener reservas completadas
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}