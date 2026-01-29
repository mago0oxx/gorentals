import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar, Wrench, AlertTriangle, CheckCircle, FileText,
  Download, DollarSign, Gauge, MapPin, ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const recordTypeConfig = {
  maintenance: {
    label: "Mantenimiento",
    color: "bg-blue-100 text-blue-700",
    icon: Wrench
  },
  repair: {
    label: "Reparación",
    color: "bg-orange-100 text-orange-700",
    icon: AlertTriangle
  },
  incident: {
    label: "Incidente",
    color: "bg-red-100 text-red-700",
    icon: AlertTriangle
  },
  inspection: {
    label: "Inspección",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle
  }
};

export default function VehicleHistoryTimeline({ maintenanceRecords, bookings }) {
  const [expandedRecord, setExpandedRecord] = useState(null);

  // Combine and sort all records by date
  const allRecords = [
    ...maintenanceRecords.map(r => ({ ...r, sourceType: "maintenance" })),
    ...bookings.map(b => ({
      id: b.id,
      date: b.start_date,
      sourceType: "booking",
      ...b
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (allRecords.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No hay registros en el historial</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allRecords.map((record, index) => {
        const isExpanded = expandedRecord === record.id;

        if (record.sourceType === "booking") {
          return (
            <Card key={record.id} className="border-l-4 border-l-teal-500">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge className="bg-teal-100 text-teal-700 border-0 mb-2">
                          Reserva
                        </Badge>
                        <p className="font-semibold">Alquiler: {record.renter_name}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(record.start_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                          {" → "}
                          {format(new Date(record.end_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={
                          record.status === "completed" ? "border-green-500 text-green-700" :
                          record.status === "cancelled" ? "border-red-500 text-red-700" :
                          "border-gray-300"
                        }>
                          {record.status === "completed" ? "Completado" :
                           record.status === "cancelled" ? "Cancelado" :
                           record.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {record.total_days} días
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        ${record.total_amount?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }

        const config = recordTypeConfig[record.record_type];
        const Icon = config.icon;

        return (
          <Card key={record.id} className={`border-l-4 ${
            record.record_type === "maintenance" ? "border-l-blue-500" :
            record.record_type === "repair" ? "border-l-orange-500" :
            record.record_type === "incident" ? "border-l-red-500" :
            "border-l-green-500"
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  record.record_type === "maintenance" ? "bg-blue-100" :
                  record.record_type === "repair" ? "bg-orange-100" :
                  record.record_type === "incident" ? "bg-red-100" :
                  "bg-green-100"
                }`}>
                  <Icon className={`w-5 h-5 ${
                    record.record_type === "maintenance" ? "text-blue-600" :
                    record.record_type === "repair" ? "text-orange-600" :
                    record.record_type === "incident" ? "text-red-600" :
                    "text-green-600"
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge className={`${config.color} border-0 mb-2`}>
                        {config.label}
                      </Badge>
                      <p className="font-semibold">{record.title}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(record.date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                    </div>
                    {record.cost && (
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${record.cost.toFixed(2)}</p>
                      </div>
                    )}
                  </div>

                  {isExpanded ? (
                    <div className="mt-4 space-y-3">
                      <Separator />
                      
                      {record.description && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Descripción</p>
                          <p className="text-sm text-gray-600">{record.description}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {record.mileage && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Gauge className="w-4 h-4" />
                            {record.mileage.toLocaleString()} km
                          </div>
                        )}
                        {record.service_provider && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {record.service_provider}
                          </div>
                        )}
                      </div>

                      {record.notes && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Notas</p>
                          <p className="text-sm text-gray-600">{record.notes}</p>
                        </div>
                      )}

                      {record.documents && record.documents.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Documentos adjuntos</p>
                          <div className="space-y-2">
                            {record.documents.map((doc, idx) => (
                              <a
                                key={idx}
                                href={doc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700"
                              >
                                <FileText className="w-4 h-4" />
                                Documento {idx + 1}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedRecord(null)}
                        className="text-xs"
                      >
                        Ver menos
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      {record.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {record.description}
                        </p>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedRecord(record.id)}
                        className="text-xs"
                      >
                        Ver detalles
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}