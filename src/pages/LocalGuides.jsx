import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, Star, Clock, DollarSign, Compass, 
  UtensilsCrossed, Waves, Camera, Navigation
} from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function LocalGuides() {
  const { t } = useLanguage();
  const [guides, setGuides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      const data = await base44.entities.LocalGuide.filter({ is_active: true });
      setGuides(data);
    } catch (error) {
      console.error("Error loading guides:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "beach": return Waves;
      case "restaurant": return UtensilsCrossed;
      case "route": return Navigation;
      case "attraction": return Camera;
      default: return Compass;
    }
  };

  const getPriceLevelText = (level) => {
    switch (level) {
      case "free": return "Gratis";
      case "budget": return "$";
      case "moderate": return "$$";
      case "expensive": return "$$$";
      default: return "";
    }
  };

  const filteredGuides = activeCategory === "all" 
    ? guides 
    : guides.filter(g => g.category === activeCategory);

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando guías..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
      {/* Hero Section */}
      <div className="relative h-[400px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        </div>
        <div className="relative h-full flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-5xl font-bold mb-4">Guías Locales</h1>
          <p className="text-xl text-center max-w-2xl opacity-90">
            Descubre los mejores lugares de Isla de Margarita
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="grid w-full grid-cols-5 h-auto bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-lg">
            <TabsTrigger value="all" className="rounded-xl py-3">
              <Compass className="w-4 h-4 mr-2" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="beach" className="rounded-xl py-3">
              <Waves className="w-4 h-4 mr-2" />
              Playas
            </TabsTrigger>
            <TabsTrigger value="restaurant" className="rounded-xl py-3">
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Restaurantes
            </TabsTrigger>
            <TabsTrigger value="route" className="rounded-xl py-3">
              <Navigation className="w-4 h-4 mr-2" />
              Rutas
            </TabsTrigger>
            <TabsTrigger value="attraction" className="rounded-xl py-3">
              <Camera className="w-4 h-4 mr-2" />
              Atracciones
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Guides Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.map((guide) => {
            const Icon = getCategoryIcon(guide.category);
            return (
              <Card key={guide.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-0">
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={guide.photos?.[0] || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600"}
                    alt={guide.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-white/90 text-teal-700 border-0">
                      <Icon className="w-3 h-3 mr-1" />
                      {guide.category === "beach" && "Playa"}
                      {guide.category === "restaurant" && "Restaurante"}
                      {guide.category === "route" && "Ruta"}
                      {guide.category === "attraction" && "Atracción"}
                    </Badge>
                    {guide.is_featured && (
                      <Badge className="bg-yellow-500 text-white border-0">
                        <Star className="w-3 h-3 mr-1" />
                        Destacado
                      </Badge>
                    )}
                  </div>
                  {guide.price_level && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-black/70 text-white border-0">
                        {getPriceLevelText(guide.price_level)}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                      {guide.title}
                    </h3>
                  </div>

                  {guide.rating && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < guide.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{guide.rating.toFixed(1)}</span>
                    </div>
                  )}

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {guide.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      {guide.location}
                    </div>
                    {guide.duration && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-teal-600" />
                        {guide.duration}
                      </div>
                    )}
                  </div>

                  {guide.tips && guide.tips.length > 0 && (
                    <div className="bg-teal-50 rounded-xl p-3 mb-4">
                      <p className="text-xs font-medium text-teal-900 mb-1">💡 Consejo:</p>
                      <p className="text-xs text-teal-700">{guide.tips[0]}</p>
                    </div>
                  )}

                  {guide.coordinates && (
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl"
                      onClick={() => window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${guide.coordinates.lat},${guide.coordinates.lng}`,
                        '_blank'
                      )}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Cómo llegar
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredGuides.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Compass className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay guías en esta categoría
            </h3>
            <p className="text-gray-500">
              Pronto agregaremos más lugares para explorar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}