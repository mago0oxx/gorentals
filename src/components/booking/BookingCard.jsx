import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, DollarSign, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusConfig = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Aprobado", color: "bg-blue-100 text-blue-700" },
  rejected: { label: "Rechazado", color: "bg-red-100 text-red-700" },
  paid: { label: "Pagado", color: "bg-green-100 text-green-700" },
  active: { label: "En curso", color: "bg-teal-100 text-teal-700" },
  completed: { label: "Completado", color: "bg-gray-100 text-gray-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" }
};

export default function BookingCard({ booking, userType = "renter" }) {
  const status = statusConfig[booking.status] || statusConfig.pending;
  const photo = booking.vehicle_photo || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400";

  return (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-48 h-32 sm:h-auto">
            <img
              src={photo}
              alt={booking.vehicle_title}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{booking.vehicle_title}</h3>
                <p className="text-sm text-gray-500">
                  {userType === "owner" ? `Arrendatario: ${booking.renter_name}` : `Propietario: ${booking.owner_name}`}
                </p>
              </div>
              <Badge className={`${status.color} border-0`}>
                {status.label}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  {format(new Date(booking.start_date), "dd MMM", { locale: es })} - {format(new Date(booking.end_date), "dd MMM yyyy", { locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span>${booking.total_amount?.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-gray-400">
                {booking.total_days} {booking.total_days === 1 ? "día" : "días"}
              </span>
              <Link to={createPageUrl(`BookingDetails?id=${booking.id}`)}>
                <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                  Ver detalles
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}