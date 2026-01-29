import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Check } from "lucide-react";

const insuranceOptions = [
  {
    type: "none",
    name: "Sin seguro adicional",
    description: "Protección básica incluida con el vehículo",
    price: 0,
    features: ["Responsabilidad civil básica", "Cobertura legal mínima"]
  },
  {
    type: "basic",
    name: "Seguro Básico",
    description: "Protección estándar para tu viaje",
    price: 15,
    priceType: "per_day",
    features: [
      "Cobertura de daños al vehículo",
      "Protección contra robo",
      "Asistencia en carretera 24/7",
      "Conductor adicional incluido"
    ],
    recommended: true
  },
  {
    type: "premium",
    name: "Seguro Premium",
    description: "Máxima tranquilidad con cobertura completa",
    price: 25,
    priceType: "per_day",
    features: [
      "Cobertura completa sin deducible",
      "Protección de efectos personales",
      "Vehículo de reemplazo",
      "Asistencia en carretera premium",
      "Cancelación gratuita hasta 24h antes",
      "Conductores adicionales ilimitados"
    ]
  }
];

export default function InsuranceSelector({ totalDays = 1, onInsuranceChange }) {
  const [selectedType, setSelectedType] = useState("none");

  const handleSelect = (option) => {
    setSelectedType(option.type);
    const insuranceCost = option.priceType === "per_day" ? option.price * totalDays : option.price;
    onInsuranceChange({
      type: option.type,
      cost: insuranceCost
    });
  };

  return (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">Protección adicional</p>
            <p className="text-gray-500 text-sm">Viaja con mayor tranquilidad</p>
          </div>
        </div>

        <div className="space-y-3">
          {insuranceOptions.map((option) => {
            const isSelected = selectedType === option.type;
            const total = option.priceType === "per_day" ? option.price * totalDays : option.price;

            return (
              <div
                key={option.type}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleSelect(option)}
              >
                {option.recommended && (
                  <Badge className="absolute -top-2 right-4 bg-orange-500 text-white border-0">
                    Recomendado
                  </Badge>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-lg">{option.name}</p>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                  {option.price > 0 && (
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-gray-900">${total}</p>
                      <p className="text-xs text-gray-500">${option.price}/día</p>
                    </div>
                  )}
                  {option.price === 0 && (
                    <Badge variant="outline" className="ml-4">Gratis</Badge>
                  )}
                </div>

                <ul className="space-y-2">
                  {option.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Check className={`w-4 h-4 flex-shrink-0 ${
                        isSelected ? "text-blue-600" : "text-gray-400"
                      }`} />
                      <span className={isSelected ? "text-gray-900" : "text-gray-600"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}