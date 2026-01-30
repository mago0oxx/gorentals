import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Loader2, Shield, AlertCircle, ExternalLink } from "lucide-react";

export default function PaymentButton({ booking, onPaymentComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    // Check if running in iframe (preview mode)
    if (window.self !== window.top) {
      setError('⚠️ Los pagos no funcionan en vista previa. Por favor, publica tu app o abre el enlace en una nueva pestaña para procesar pagos.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { data } = await base44.functions.invoke('createCheckoutSession', {
        booking_id: booking.id
      });

      if (data.checkout_url) {
        // Add small delay to ensure state is updated before redirect
        setTimeout(() => {
          window.location.href = data.checkout_url;
        }, 100);
      } else {
        setError('Error al crear la sesión de pago');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || err.message || 'Error al procesar el pago. Por favor intenta de nuevo.');
      setIsProcessing(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Alquiler ({booking.total_days} días)</span>
          <span>${booking.subtotal?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tarifa de servicio</span>
          <span>${booking.platform_fee?.toFixed(2)}</span>
        </div>
        {(booking.extras_total || 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Extras</span>
            <span>${booking.extras_total?.toFixed(2)}</span>
          </div>
        )}
        {(booking.insurance_cost || 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Seguro</span>
            <span>${booking.insurance_cost?.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Depósito (reembolsable)
          </span>
          <span>${booking.security_deposit?.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold text-base">
          <span>Total</span>
          <span>${booking.total_amount?.toFixed(2)}</span>
        </div>
      </div>

      <Button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Redirigiendo a pago...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            Pagar con Stripe
            <ExternalLink className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500 mt-3">
        🔒 Pago seguro procesado por Stripe
      </p>
    </>
  );
}