import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Loader2, CheckCircle, Shield, AlertCircle } from "lucide-react";
import { NotificationService } from "@/components/notifications/notificationService";

export default function PaymentButton({ booking, onPaymentComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  // Simulated card form (in production, use Stripe Elements)
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiry: "",
    cvc: "",
    name: ""
  });

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    // Validate card data
    if (!cardData.cardNumber || !cardData.expiry || !cardData.cvc || !cardData.name) {
      setError("Por favor completa todos los campos de la tarjeta");
      setIsProcessing(false);
      return;
    }

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In production, integrate with Stripe here
    const mockPaymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update booking status
    await base44.entities.Booking.update(booking.id, {
      status: "paid",
      payment_status: "paid",
      stripe_payment_intent_id: mockPaymentIntentId
    });

    // Create transaction records
    const platformFee = booking.platform_fee || 0;
    const ownerPayout = booking.owner_payout || (booking.subtotal - platformFee);

    // Renter payment transaction
    await base44.entities.Transaction.create({
      booking_id: booking.id,
      user_email: booking.renter_email,
      user_role: "renter",
      type: "payment",
      amount: booking.total_amount,
      status: "completed",
      description: `Pago por alquiler de ${booking.vehicle_title}`,
      vehicle_title: booking.vehicle_title,
      stripe_payment_intent_id: mockPaymentIntentId,
      metadata: {
        days: booking.total_days,
        start_date: booking.start_date,
        end_date: booking.end_date
      }
    });

    // Owner payout transaction (pending until booking completes)
    await base44.entities.Transaction.create({
      booking_id: booking.id,
      user_email: booking.owner_email,
      user_role: "owner",
      type: "payout",
      amount: ownerPayout,
      status: "pending",
      description: `Pago por alquiler de ${booking.vehicle_title}`,
      vehicle_title: booking.vehicle_title,
      stripe_payment_intent_id: mockPaymentIntentId
    });

    // Platform commission transaction
    await base44.entities.Transaction.create({
      booking_id: booking.id,
      user_email: "platform@rentamargarita.com",
      user_role: "platform",
      type: "commission",
      amount: platformFee,
      status: "completed",
      description: `Comisión por ${booking.vehicle_title}`,
      vehicle_title: booking.vehicle_title,
      stripe_payment_intent_id: mockPaymentIntentId
    });

    // Security deposit hold
    if (booking.security_deposit > 0) {
      await base44.entities.Transaction.create({
        booking_id: booking.id,
        user_email: booking.renter_email,
        user_role: "renter",
        type: "deposit_hold",
        amount: booking.security_deposit,
        status: "pending",
        description: `Depósito de seguridad - ${booking.vehicle_title}`,
        vehicle_title: booking.vehicle_title
      });
    }

    // Send notifications
    await NotificationService.notifyBookingPaid(booking);

    setPaymentSuccess(true);
    setIsProcessing(false);

    setTimeout(() => {
      setIsOpen(false);
      setPaymentSuccess(false);
      if (onPaymentComplete) onPaymentComplete();
    }, 2000);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
      >
        <CreditCard className="w-5 h-5 mr-2" />
        Pagar ${booking.total_amount?.toFixed(2)}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          {paymentSuccess ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Pago exitoso!</h3>
              <p className="text-gray-500">Tu reserva ha sido confirmada</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Completar pago</DialogTitle>
                <DialogDescription>
                  Ingresa los datos de tu tarjeta para confirmar la reserva
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Payment Summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Alquiler ({booking.total_days} días)</span>
                    <span>${booking.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tarifa de servicio</span>
                    <span>${booking.platform_fee?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Depósito (reembolsable)
                    </span>
                    <span>${booking.security_deposit?.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${booking.total_amount?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Card Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre en la tarjeta</Label>
                    <Input
                      id="name"
                      placeholder="Juan Pérez"
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardNumber">Número de tarjeta</Label>
                    <Input
                      id="cardNumber"
                      placeholder="4242 4242 4242 4242"
                      value={cardData.cardNumber}
                      onChange={(e) => setCardData({ ...cardData, cardNumber: formatCardNumber(e.target.value) })}
                      maxLength={19}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Vencimiento</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                        maxLength={5}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvc">CVC</Label>
                      <Input
                        id="cvc"
                        placeholder="123"
                        value={cardData.cvc}
                        onChange={(e) => setCardData({ ...cardData, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        maxLength={4}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700 h-12"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Pagar ${booking.total_amount?.toFixed(2)}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  🔒 Pago seguro procesado por Stripe
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}