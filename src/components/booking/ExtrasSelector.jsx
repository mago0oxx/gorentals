import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Package, DollarSign } from "lucide-react";

export default function ExtrasSelector({ extras = [], totalDays = 1, onExtrasChange }) {
  const [selectedExtras, setSelectedExtras] = useState([]);

  const handleToggleExtra = (extra, checked) => {
    let newExtras;
    if (checked) {
      const total = extra.price_type === "per_day" ? extra.price * totalDays : extra.price;
      newExtras = [...selectedExtras, { ...extra, total }];
    } else {
      newExtras = selectedExtras.filter(e => e.name !== extra.name);
    }
    setSelectedExtras(newExtras);
    onExtrasChange(newExtras);
  };

  const isSelected = (extraName) => {
    return selectedExtras.some(e => e.name === extraName);
  };

  if (extras.length === 0) {
    return (
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-5">
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No hay extras disponibles para este vehículo</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium">Extras y accesorios</p>
            <p className="text-gray-500 text-sm">Personaliza tu experiencia</p>
          </div>
        </div>

        <div className="space-y-3">
          {extras.map((extra, index) => {
            const extraTotal = extra.price_type === "per_day" ? extra.price * totalDays : extra.price;
            const selected = isSelected(extra.name);

            return (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  selected
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleToggleExtra(extra, !selected)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(checked) => handleToggleExtra(extra, checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{extra.name}</p>
                        {extra.description && (
                          <p className="text-sm text-gray-500 mt-1">{extra.description}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-gray-900">${extraTotal.toFixed(2)}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {extra.price_type === "per_day" 
                            ? `$${extra.price}/día` 
                            : "Pago único"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedExtras.length > 0 && (
          <div className="mt-4 p-4 bg-purple-50 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="font-medium text-purple-900">Total extras</span>
              <span className="text-lg font-bold text-purple-900">
                ${selectedExtras.reduce((sum, e) => sum + e.total, 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}