import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, AlertTriangle, Shield, Clock, Camera, 
  FileText, Key, MapPin 
} from "lucide-react";

export default function DeliveryRulesCard({ isOwner }) {
  const ownerRules = [
    {
      icon: Key,
      title: "Preparación del vehículo",
      description: "Asegúrate de que el vehículo esté limpio, con tanque lleno y en buenas condiciones."
    },
    {
      icon: FileText,
      title: "Documentación requerida",
      description: "Ten listos: título del vehículo, seguro vigente, manual del propietario."
    },
    {
      icon: Camera,
      title: "Inspección fotográfica",
      description: "Toma fotos del vehículo (exterior, interior, kilometraje) antes de entregar."
    },
    {
      icon: MapPin,
      title: "Ubicación de entrega",
      description: "Confirma la ubicación exacta y horario con el arrendatario 24h antes."
    },
    {
      icon: Clock,
      title: "Puntualidad",
      description: "Sé puntual en la entrega. El retraso puede afectar tu calificación."
    }
  ];

  const renterRules = [
    {
      icon: FileText,
      title: "Documentos obligatorios",
      description: "Debes presentar: licencia de conducir vigente, identificación oficial."
    },
    {
      icon: Shield,
      title: "Depósito de seguridad",
      description: "El depósito se retiene temporalmente y se devuelve tras la inspección final."
    },
    {
      icon: Camera,
      title: "Registro de estado",
      description: "Documenta cualquier daño o irregularidad existente durante la entrega."
    },
    {
      icon: Clock,
      title: "Horario de recogida",
      description: "Llega puntual a la hora acordada. Confirma el lugar 24h antes."
    },
    {
      icon: AlertTriangle,
      title: "Durante el alquiler",
      description: "Reporta cualquier problema inmediatamente. No realices modificaciones al vehículo."
    }
  ];

  const rules = isOwner ? ownerRules : renterRules;

  return (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-teal-600" />
          Reglas de Entrega del Vehículo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-teal-200 bg-teal-50">
          <AlertTriangle className="h-4 w-4 text-teal-600" />
          <AlertDescription className="text-teal-800 text-sm">
            {isOwner 
              ? "Cumplir con estas reglas garantiza una experiencia positiva y protege tu vehículo."
              : "Sigue estas reglas para una experiencia sin problemas y evitar cargos adicionales."
            }
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {rules.map((rule, index) => {
            const Icon = rule.icon;
            return (
              <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Icon className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-gray-900">{rule.title}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">{rule.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Important Notes */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="font-semibold text-sm text-amber-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Importante
          </h4>
          <ul className="space-y-1 text-xs text-amber-800">
            <li>• Inspecciona el vehículo juntos y firma un acta de entrega/recepción</li>
            <li>• Toma fotos y videos como evidencia del estado del vehículo</li>
            <li>• Confirma que el tanque de combustible esté según lo acordado</li>
            <li>• Verifica que todos los accesorios y documentos estén completos</li>
            {isOwner && <li>• No entregues el vehículo si detectas alcohol o comportamiento sospechoso</li>}
            {!isOwner && <li>• Reporta cualquier problema técnico inmediatamente al propietario</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}