import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Loader2, Shield, AlertCircle, ExternalLink, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCurrency } from "@/components/currency/CurrencyContext";
import PaymentMethodSelector from "./PaymentMethodSelector";

export default function PaymentButton({ booking, onPaymentComplete }) {
  const { currency, formatPrice } = useCurrency();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isCheckingDocs, setIsCheckingDocs] = useState(true);
  const [hasRequiredDocs, setHasRequiredDocs] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showSavedMethods, setShowSavedMethods] = useState(true);

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
    setIsProcessing(true);
    setError(null);

    try {
      console.log('[PaymentButton] Starting payment for booking:', booking.id);
      
      // Determine payment provider based on currency
      const isMercadoPago = currency === 'ARS';
      const functionName = isMercadoPago ? 'createMercadoPagoCheckout' : 'createCheckoutSession';
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('La solicitud tardó demasiado. Por favor intenta de nuevo.')), 30000)
      );

      const functionPromise = base44.functions.invoke(functionName, {
        booking_id: booking.id,
        payment_method_id: selectedPaymentMethod?.payment_method_id
      });

      const response = await Promise.race([functionPromise, timeoutPromise]);

      console.log('[PaymentButton] Received response:', response);

      if (!response || !response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      if (!response.data.checkout_url) {
        throw new Error('No se recibió URL de pago');
      }

      console.log('[PaymentButton] Redirecting to checkout:', response.data.checkout_url);
      
      // Redirect to payment provider
      window.location.href = response.data.checkout_url;

    } catch (err) {
      console.error('[PaymentButton] Error:', err);
      setError(err.message || 'Error al procesar el pago. Por favor intenta de nuevo.');
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

  const isMercadoPago = currency === 'ARS';
  const paymentProvider = isMercadoPago ? 'MercadoPago' : 'Stripe';
  const paymentIcon = isMercadoPago ? '💳' : '💳';

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
          <span>{formatPrice(booking.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tarifa de servicio</span>
          <span>{formatPrice(booking.platform_fee)}</span>
        </div>
        {(booking.extras_total || 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Extras</span>
            <span>{formatPrice(booking.extras_total)}</span>
          </div>
        )}
        {(booking.insurance_cost || 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Seguro</span>
            <span>{formatPrice(booking.insurance_cost)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Depósito (reembolsable)
          </span>
          <span>{formatPrice(booking.security_deposit)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold text-base">
          <span>Total</span>
          <span>{formatPrice(booking.total_amount)}</span>
        </div>
      </div>

      {/* Payment Method Selector */}
      {showSavedMethods && (
        <div className="mb-4">
          <PaymentMethodSelector
            onMethodSelect={setSelectedPaymentMethod}
            selectedMethod={selectedPaymentMethod}
          />
        </div>
      )}

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
            Pagar con {paymentProvider}
            <ExternalLink className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500 mt-3">
        🔒 Pago seguro procesado por {paymentProvider}
      </p>
    </>
  );
}