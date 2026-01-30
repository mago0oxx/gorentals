import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Loader2, Shield, AlertCircle, ExternalLink, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PaymentButton({ booking, onPaymentComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isCheckingDocs, setIsCheckingDocs] = useState(true);
  const [hasRequiredDocs, setHasRequiredDocs] = useState(false);

  useEffect(() => {
    checkDocuments();
  }, []);

  const checkDocuments = async () => {
    setIsCheckingDocs(true);
    try {
      const user = await base44.auth.me();
      const docs = await base44.entities.VerificationDocument.filter({
        user_email: user.email,
        user_type: user.user_type,
        status: "approved"
      });

      // Check if user has required document (driver license)
      const hasDriverLicense = docs.some(d => d.document_type === "driver_license");
      setHasRequiredDocs(hasDriverLicense);
    } catch (err) {
      console.error("Error checking documents:", err);
    } finally {
      setIsCheckingDocs(false);
    }
  };

  const handlePayment = async () => {
    // Check if running in iframe (preview mode)
    if (window.self !== window.top) {
      setError('⚠️ Los pagos no funcionan en vista previa. Por favor, publica tu app o abre el enlace en una nueva pestaña para procesar pagos.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('Calling createCheckoutSession with booking_id:', booking.id);
      
      const response = await base44.functions.invoke('createCheckoutSession', {
        booking_id: booking.id
      });

      console.log('Response from createCheckoutSession:', response);

      if (response?.data?.checkout_url) {
        console.log('Redirecting to:', response.data.checkout_url);
        window.location.href = response.data.checkout_url;
      } else {
        console.error('No checkout URL in response:', response);
        setError('Error al crear la sesión de pago - no se recibió URL');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || err.message || 'Error al procesar el pago. Por favor intenta de nuevo.');
      setIsProcessing(false);
    }
  };

  if (isCheckingDocs) {
    return (
      <div className="text-center py-4">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Verificando documentos...</p>
      </div>
    );
  }

  if (!hasRequiredDocs) {
    return (
      <>
        <Alert className="mb-4 border-amber-200 bg-amber-50">
          <FileText className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <p className="font-medium mb-2">Verificación de documentos requerida</p>
            <p className="text-sm">Para procesar el pago, necesitas subir y verificar tu licencia de conducir.</p>
          </AlertDescription>
        </Alert>
        <Link to={createPageUrl("DocumentVerification")}>
          <Button className="w-full bg-teal-600 hover:bg-teal-700 h-12">
            <FileText className="w-4 h-4 mr-2" />
            Verificar documentos
          </Button>
        </Link>
      </>
    );
  }

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