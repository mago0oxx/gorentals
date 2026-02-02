import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, Star, Clock, DollarSign, Compass, 
  UtensilsCrossed, Waves, Camera, Navigation, ArrowLeft
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
      <div className="relative h-[500px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1540202404-a2f29016b523?w=1600)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-teal-900/70 via-teal-800/50 to-teal-900/70" />
        </div>
        <Link to={createPageUrl("Landing")} className="absolute top-6 left-6 z-10">
          <Button variant="secondary" className="rounded-xl backdrop-blur-sm bg-white/90 hover:bg-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </Link>
        <div className="relative h-full flex flex-col items-center justify-center text-white px-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-8 h-8 text-teal-300" />
            <span className="text-teal-300 font-medium text-lg">Isla de Margarita, Venezuela</span>
          </div>
          <h1 className="text-6xl font-bold mb-4 text-center">Explora la Perla del Caribe</h1>
          <p className="text-xl text-center max-w-3xl opacity-90 mb-6">
            Descubre playas paradisíacas, gastronomía única, rutas increíbles y atracciones imperdibles
          </p>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <Waves className="w-4 h-4" />
              <span>50+ Playas</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <UtensilsCrossed className="w-4 h-4" />
              <span>Gastronomía Local</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <Camera className="w-4 h-4" />
              <span>Atracciones Únicas</span>
            </div>
          </div>
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

        {/* Featured Section */}
        {guides.filter(g => g.is_featured).length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              Lugares Destacados
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {guides.filter(g => g.is_featured).slice(0, 2).map((guide) => {
                const Icon = getCategoryIcon(guide.category);
                return (
                  <Card key={guide.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 group border-0">
                    <div className="relative h-80 overflow-hidden">
                      <img
                        src={guide.photos?.[0] || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"}
                        alt={guide.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="bg-teal-500 text-white border-0">
                            <Icon className="w-3 h-3 mr-1" />
                            {guide.category === "beach" && "Playa"}
                            {guide.category === "restaurant" && "Restaurante"}
                            {guide.category === "route" && "Ruta"}
                            {guide.category === "attraction" && "Atracción"}
                          </Badge>
                          {guide.rating && (
                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-sm font-medium">{guide.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{guide.title}</h3>
                        <p className="text-sm opacity-90 line-clamp-2 mb-3">{guide.description}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4" />
                          {guide.location}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Guides Grid */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {activeCategory === "all" ? "Todos los lugares" : 
            activeCategory === "beach" ? "Playas" :
            activeCategory === "restaurant" ? "Restaurantes" :
            activeCategory === "route" ? "Rutas" : "Atracciones"}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.filter(g => !g.is_featured || guides.filter(gf => gf.is_featured).length <= 2).map((guide) => {
            const Icon = getCategoryIcon(guide.category);
            return (
              <Card key={guide.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 bg-white/80 backdrop-blur-sm">
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={guide.photos?.[0] || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600"}
                    alt={guide.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-white/95 backdrop-blur-sm text-teal-700 border-0 shadow-lg">
                      <Icon className="w-3 h-3 mr-1" />
                      {guide.category === "beach" && "Playa"}
                      {guide.category === "restaurant" && "Restaurante"}
                      {guide.category === "route" && "Ruta"}
                      {guide.category === "attraction" && "Atracción"}
                    </Badge>
                  </div>
                  {guide.price_level && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-black/70 backdrop-blur-sm text-white border-0">
                        {getPriceLevelText(guide.price_level)}
                      </Badge>
                    </div>
                  )}
                  {guide.best_time_to_visit && (
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-teal-500/90 backdrop-blur-sm text-white border-0">
                        <Clock className="w-3 h-3 mr-1" />
                        {guide.best_time_to_visit}
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
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-3 mb-4 border border-teal-100">
                      <p className="text-xs font-semibold text-teal-900 mb-1 flex items-center gap-1">
                        💡 Consejo local:
                      </p>
                      <p className="text-xs text-teal-700 leading-relaxed">{guide.tips[0]}</p>
                    </div>
                  )}

                  {guide.coordinates && (
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300"
                      onClick={() => window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${guide.coordinates.lat},${guide.coordinates.lng}`,
                        '_blank'
                      )}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
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