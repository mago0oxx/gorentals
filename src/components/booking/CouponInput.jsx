import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, Check, X, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CouponInput({ totalAmount, vehicleType, onCouponApplied, onCouponRemoved }) {
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [error, setError] = useState("");

  const validateAndApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsValidating(true);
    setError("");

    try {
      const user = await base44.auth.me();
      
      // Buscar cupón
      const coupons = await base44.entities.Coupon.filter({
        code: couponCode.toUpperCase(),
        is_active: true
      });

      if (coupons.length === 0) {
        setError("Cupón no válido");
        setIsValidating(false);
        return;
      }

      const coupon = coupons[0];
      
      // Validar fecha
      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validUntil = new Date(coupon.valid_until);
      
      if (now < validFrom) {
        setError("Este cupón aún no está activo");
        setIsValidating(false);
        return;
      }
      
      if (now > validUntil) {
        setError("Este cupón ha expirado");
        setIsValidating(false);
        return;
      }

      // Validar límite de uso global
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        setError("Este cupón ha alcanzado su límite de usos");
        setIsValidating(false);
        return;
      }

      // Validar límite de uso por usuario
      const userUsages = await base44.entities.CouponUsage.filter({
        coupon_id: coupon.id,
        user_email: user.email
      });

      if (userUsages.length >= coupon.usage_per_user) {
        setError("Ya has usado este cupón el máximo permitido");
        setIsValidating(false);
        return;
      }

      // Validar monto mínimo
      if (totalAmount < coupon.min_booking_amount) {
        setError(`Monto mínimo requerido: $${coupon.min_booking_amount}`);
        setIsValidating(false);
        return;
      }

      // Validar tipo de vehículo
      if (coupon.applicable_vehicle_types && coupon.applicable_vehicle_types.length > 0) {
        if (!coupon.applicable_vehicle_types.includes(vehicleType)) {
          setError("Este cupón no aplica para este tipo de vehículo");
          setIsValidating(false);
          return;
        }
      }

      // Calcular descuento
      let discountAmount = 0;
      if (coupon.discount_type === "percentage") {
        discountAmount = (totalAmount * coupon.discount_value) / 100;
        if (coupon.max_discount_amount) {
          discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
        }
      } else {
        discountAmount = coupon.discount_value;
      }

      discountAmount = Math.min(discountAmount, totalAmount);

      const couponData = {
        ...coupon,
        discountAmount
      };

      setAppliedCoupon(couponData);
      onCouponApplied(couponData);
      setCouponCode("");
    } catch (err) {
      console.error("Error validating coupon:", err);
      setError("Error al validar el cupón");
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setError("");
    onCouponRemoved();
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-green-900">{appliedCoupon.name}</p>
                <Badge className="bg-green-600 text-white border-0 text-xs">
                  {appliedCoupon.code}
                </Badge>
              </div>
              <p className="text-sm text-green-700 mb-2">{appliedCoupon.description}</p>
              <p className="text-lg font-bold text-green-600">
                -${appliedCoupon.discountAmount.toFixed(2)} descuento
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={removeCoupon}
            className="text-green-600 hover:text-green-700 hover:bg-green-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Código de cupón"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase());
              setError("");
            }}
            className="pl-10 h-11 rounded-xl"
            onKeyPress={(e) => e.key === "Enter" && validateAndApplyCoupon()}
          />
        </div>
        <Button
          onClick={validateAndApplyCoupon}
          disabled={!couponCode.trim() || isValidating}
          className="h-11 px-6 rounded-xl bg-teal-600 hover:bg-teal-700"
        >
          {isValidating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Validando
            </>
          ) : (
            "Aplicar"
          )}
        </Button>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}