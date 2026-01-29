import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, DollarSign, TrendingUp, Star, Award, 
  CheckCircle, Clock, XCircle 
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function VehicleHistoryCard({ vehicleId, ownerId }) {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, earnings: 0, avgRating: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [vehicleId]);

  const loadHistory = async () => {
    const bookings = await base44.entities.Booking.filter({
      vehicle_id: vehicleId
    });
    
    const sortedHistory = bookings.sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );
    
    const completed = bookings.filter(b => b.status === "completed");
    const totalEarnings = completed.reduce((sum, b) => sum + (b.owner_payout || 0), 0);
    
    // Get reviews for this vehicle
    const reviews = await base44.entities.Review.filter({ vehicle_id: vehicleId });
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;
    
    setHistory(sortedHistory);
    setStats({
      total: bookings.length,
      completed: completed.length,
      earnings: totalEarnings,
      avgRating
    });
    setIsLoading(false);
  };

  const statusConfig = {
    pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700", icon: Clock },
    approved: { label: "Aprobado", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
    rejected: { label: "Rechazado", color: "bg-red-100 text-red-700", icon: XCircle },
    paid: { label: "Pagado", color: "bg-green-100 text-green-700", icon: CheckCircle },
    active: { label: "En curso", color: "bg-teal-100 text-teal-700", icon: Calendar },
    completed: { label: "Completado", color: "bg-gray-100 text-gray-700", icon: CheckCircle },
    cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle }
  };

  if (isLoading) {
    return <LoadingSpinner className="h-32" />;
  }

  return (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Historial de Alquileres
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total reservas</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            <p className="text-xs text-gray-500">Completadas</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${stats.earnings.toFixed(0)}</p>
            <p className="text-xs text-gray-500">Ingresos totales</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-2">
              <Star className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Calificación</p>
          </div>
        </div>

        <Separator />

        {/* History List */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">Últimas reservas</h4>
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No hay reservas registradas para este vehículo.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.slice(0, 10).map((booking) => {
                const status = statusConfig[booking.status];
                const StatusIcon = status.icon;
                
                return (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{booking.renter_name}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(booking.start_date), "d MMM", { locale: es })} - {format(new Date(booking.end_date), "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-2">
                      {booking.status === "completed" && (
                        <span className="text-sm font-medium text-green-600">
                          +${booking.owner_payout?.toFixed(0)}
                        </span>
                      )}
                      <Badge className={`${status.color} border-0 text-xs`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Performance Badge */}
        {stats.completed >= 5 && stats.avgRating >= 4.5 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-900">¡Propietario destacado!</p>
              <p className="text-xs text-amber-700">Excelente historial de alquileres</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}