import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Sparkles, TrendingUp, Gift } from "lucide-react";
import { motion } from "framer-motion";

export default function FeaturedPromotions({ compact = false }) {
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const now = new Date();
      const allCoupons = await base44.entities.Coupon.filter({
        is_active: true,
        is_featured: true
      });

      // Filtrar cupones válidos
      const validCoupons = allCoupons.filter(c => {
        const validFrom = new Date(c.valid_from);
        const validUntil = new Date(c.valid_until);
        const isDateValid = now >= validFrom && now <= validUntil;
        const hasUsesLeft = !c.usage_limit || c.used_count < c.usage_limit;
        return isDateValid && hasUsesLeft;
      });

      setPromotions(validCoupons.slice(0, compact ? 2 : 3));
    } catch (error) {
      console.error("Error loading promotions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || promotions.length === 0) return null;

  const getIcon = (index) => {
    const icons = [Sparkles, TrendingUp, Gift];
    return icons[index % icons.length];
  };

  if (compact) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {promotions.map((promo, index) => {
          const Icon = getIcon(index);
          return (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 text-sm">{promo.name}</h4>
                        <Badge className="bg-teal-600 text-white border-0 text-xs">
                          {promo.code}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-1">{promo.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-teal-600">
                          {promo.discount_type === "percentage" 
                            ? `${promo.discount_value}% OFF` 
                            : `$${promo.discount_value} OFF`}
                        </span>
                        {promo.usage_limit && (
                          <span className="text-xs text-gray-500">
                            {promo.usage_limit - promo.used_count} usos restantes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl p-8 text-white mb-12">
      <div className="flex items-center gap-2 mb-6">
        <Tag className="w-6 h-6" />
        <h2 className="text-3xl font-bold">Promociones Activas</h2>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        {promotions.map((promo, index) => {
          const Icon = getIcon(index);
          return (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 bg-white/95 backdrop-blur-sm hover:bg-white transition-all hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-1">{promo.name}</h3>
                      <Badge className="bg-teal-600 text-white border-0">
                        {promo.code}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{promo.description}</p>
                  
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-teal-600">
                      {promo.discount_type === "percentage" 
                        ? `${promo.discount_value}% OFF` 
                        : `$${promo.discount_value} OFF`}
                    </div>
                    
                    {promo.min_booking_amount > 0 && (
                      <p className="text-xs text-gray-500">
                        Mínimo de compra: ${promo.min_booking_amount}
                      </p>
                    )}
                    
                    {promo.usage_limit && (
                      <p className="text-xs text-gray-500">
                        {promo.usage_limit - promo.used_count} cupones disponibles
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      Válido hasta {new Date(promo.valid_until).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}