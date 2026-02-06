import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Trash2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/components/currency/CurrencyContext";

export default function PaymentMethodSelector({ onMethodSelect, selectedMethod }) {
  const { currency } = useCurrency();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      const methods = await base44.entities.PaymentMethod.filter({ 
        user_email: user.email,
        is_active: true 
      });
      setPaymentMethods(methods);
      
      // Auto-select default method
      const defaultMethod = methods.find(m => m.is_default);
      if (defaultMethod && !selectedMethod) {
        onMethodSelect?.(defaultMethod);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (methodId) => {
    setDeletingId(methodId);
    try {
      await base44.entities.PaymentMethod.delete(methodId);
      await loadPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const setAsDefault = async (methodId) => {
    try {
      const user = await base44.auth.me();
      
      // Remove default from all methods
      const allMethods = await base44.entities.PaymentMethod.filter({ 
        user_email: user.email 
      });
      
      for (const method of allMethods) {
        if (method.is_default) {
          await base44.entities.PaymentMethod.update(method.id, { is_default: false });
        }
      }
      
      // Set new default
      await base44.entities.PaymentMethod.update(methodId, { is_default: true });
      await loadPaymentMethods();
    } catch (error) {
      console.error('Error setting default method:', error);
    }
  };

  const getCardBrandIcon = (brand) => {
    const icons = {
      'visa': '💳',
      'mastercard': '💳',
      'amex': '💳',
      'discover': '💳',
      'diners': '💳',
      'jcb': '💳'
    };
    return icons[brand?.toLowerCase()] || '💳';
  };

  const getProviderBadge = (provider) => {
    if (provider === 'mercadopago') {
      return <Badge className="bg-blue-100 text-blue-700 border-0">MercadoPago</Badge>;
    }
    return <Badge className="bg-purple-100 text-purple-700 border-0">Stripe</Badge>;
  };

  // Filter methods by currency compatibility
  const compatibleMethods = paymentMethods.filter(method => {
    if (currency === 'ARS') {
      return method.payment_provider === 'mercadopago';
    }
    return method.payment_provider === 'stripe';
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Cargando métodos de pago...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Métodos de pago guardados</h3>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => onMethodSelect?.(null)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Nuevo método
        </Button>
      </div>

      {compatibleMethods.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No tienes métodos de pago guardados</p>
            <Button
              onClick={() => onMethodSelect?.(null)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar método de pago
            </Button>
          </CardContent>
        </Card>
      ) : (
        <RadioGroup 
          value={selectedMethod?.id} 
          onValueChange={(id) => {
            const method = compatibleMethods.find(m => m.id === id);
            onMethodSelect?.(method);
          }}
        >
          <AnimatePresence>
            {compatibleMethods.map((method) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedMethod?.id === method.id 
                      ? 'border-teal-500 bg-teal-50/50' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => onMethodSelect?.(method)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={method.id} id={method.id} />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{getCardBrandIcon(method.brand)}</span>
                          <span className="font-medium capitalize">{method.brand || 'Tarjeta'}</span>
                          <span className="text-gray-500">•••• {method.last_four}</span>
                          {method.is_default && (
                            <Badge variant="outline" className="ml-auto">
                              <Check className="w-3 h-3 mr-1" />
                              Predeterminado
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {getProviderBadge(method.payment_provider)}
                          {method.expiry_month && method.expiry_year && (
                            <span>Expira {method.expiry_month}/{method.expiry_year}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!method.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAsDefault(method.id);
                            }}
                            className="text-xs"
                          >
                            Predeterminado
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(method.id);
                          }}
                          disabled={deletingId === method.id}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </RadioGroup>
      )}
    </div>
  );
}