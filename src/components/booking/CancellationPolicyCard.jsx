import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Clock, DollarSign, XCircle, Info } from "lucide-react";

export default function CancellationPolicyCard({ booking, isOwner }) {
  const calculateRefund = (daysUntilStart) => {
    if (daysUntilStart >= 7) return { percent: 100, amount: booking.subtotal + booking.security_deposit };
    if (daysUntilStart >= 3) return { percent: 50, amount: (booking.subtotal * 0.5) + booking.security_deposit };
    if (daysUntilStart >= 1) return { percent: 0, amount: booking.security_deposit };
    return { percent: 0, amount: 0 };
  };

  const policies = [
    {
      days: "7+ días antes",
      refund: "100% del alquiler + depósito",
      icon: Shield,
      color: "text-green-600 bg-green-50"
    },
    {
      days: "3-6 días antes",
      refund: "50% del alquiler + depósito",
      icon: Clock,
      color: "text-amber-600 bg-amber-50"
    },
    {
      days: "1-2 días antes",
      refund: "Solo depósito de seguridad",
      icon: DollarSign,
      color: "text-orange-600 bg-orange-50"
    },
    {
      days: "Mismo día o tarde",
      refund: "Sin reembolso",
      icon: XCircle,
      color: "text-red-600 bg-red-50"
    }
  ];

  const startDate = new Date(booking.start_date);
  const today = new Date();
  const daysUntilStart = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
  const currentRefund = calculateRefund(daysUntilStart);

  return (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Política de Cancelación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            El reembolso depende de cuándo canceles la reserva antes de la fecha de inicio.
          </AlertDescription>
        </Alert>

        {/* Policy Table */}
        <div className="space-y-2">
          {policies.map((policy, index) => {
            const Icon = policy.icon;
            return (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${policy.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{policy.days}</p>
                  <p className="text-xs text-gray-600">{policy.refund}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Situation */}
        {!["completed", "cancelled", "rejected"].includes(booking.status) && (
          <div className={`rounded-xl p-4 border ${
            currentRefund.percent >= 100 ? "bg-green-50 border-green-200" :
            currentRefund.percent >= 50 ? "bg-amber-50 border-amber-200" :
            currentRefund.amount > 0 ? "bg-orange-50 border-orange-200" :
            "bg-red-50 border-red-200"
          }`}>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Si cancelas ahora
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                ${currentRefund.amount.toFixed(2)}
              </span>
              <span className="text-sm text-gray-600">
                ({daysUntilStart} días hasta inicio)
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {currentRefund.percent > 0 
                ? `Reembolso del ${currentRefund.percent}% del alquiler + depósito completo`
                : currentRefund.amount > 0 
                  ? "Solo se reembolsará el depósito de seguridad"
                  : "No hay reembolso disponible"
              }
            </p>
          </div>
        )}

        {/* Important Notes */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-sm text-gray-900 mb-2">Notas importantes</h4>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>• La tarifa de servicio de la plataforma no es reembolsable</li>
            <li>• Los reembolsos se procesan en 5-7 días hábiles</li>
            <li>• El depósito de seguridad se devuelve tras la inspección del vehículo</li>
            {isOwner && (
              <>
                <li>• Como propietario, cancelar afecta tu reputación en la plataforma</li>
                <li>• Cancelaciones frecuentes pueden resultar en suspensión</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}