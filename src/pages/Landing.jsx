import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Car, Shield, Calendar, Star, MapPin, ChevronRight, 
  CheckCircle, Users, Banknote, Search, ArrowRight, User
} from "lucide-react";
import { motion } from "framer-motion";
import VehicleCard from "@/components/vehicles/VehicleCard";
import { useLanguage } from "@/components/i18n/LanguageContext";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

export default function Landing() {
  const { t } = useLanguage();
  const [featuredVehicles, setFeaturedVehicles] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const auth = await base44.auth.isAuthenticated();
    setIsAuthenticated(auth);
    
    if (auth) {
      const userData = await base44.auth.me();
      setUser(userData);
    }
    
    const vehicles = await base44.entities.Vehicle.filter(
      { is_active: true, is_available: true },
      "-created_date",
      6
    );
    setFeaturedVehicles(vehicles);
  };

  const features = [
    {
      icon: Car,
      title: "Variedad de Vehículos",
      description: "Desde compactos hasta SUVs, encuentra el vehículo perfecto para tu aventura en la isla."
    },
    {
      icon: Shield,
      title: "Alquiler Seguro",
      description: "Verificación de usuarios, depósitos de seguridad y pagos protegidos con Stripe."
    },
    {
      icon: Calendar,
      title: "Reserva Fácil",
      description: "Selecciona tus fechas, solicita la reserva y recibe confirmación rápida del propietario."
    },
    {
      icon: Banknote,
      title: "Mejores Precios",
      description: "Precios competitivos directamente de propietarios locales. Sin intermediarios costosos."
    }
  ];

  const stats = [
    { value: "50+", label: "Vehículos disponibles" },
    { value: "100+", label: "Usuarios activos" },
    { value: "4.8", label: "Calificación promedio" },
    { value: "24/7", label: "Soporte disponible" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to={createPageUrl("Landing")} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">GoRentals</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {!isAuthenticated ? (
              <>
                <Button 
                  variant="ghost"
                  onClick={() => base44.auth.redirectToLogin(createPageUrl("Landing"))}
                  className="text-gray-700 hover:text-gray-900"
                >
                  {t('common.login')}
                </Button>
                <Link to={createPageUrl("Register")}>
                  <Button className="bg-teal-600 hover:bg-teal-700 rounded-xl">
                    {t('common.register')}
                  </Button>
                </Link>
              </>
            ) : (
              <Link to={createPageUrl("Profile")} className="flex items-center gap-2 text-gray-700 hover:text-teal-600 transition-colors">
                <User className="w-4 h-4" />
                <span className="font-medium">
                  {t('messages.hello')}, {user?.full_name?.split(' ')[0] || t('messages.user')}
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600"
            alt="Isla de Margarita"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-transparent" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-teal-400" />
              <span className="text-teal-400 font-medium">Isla de Margarita, Venezuela</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Alquila el vehículo
              <span className="text-teal-400"> perfecto</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-10 leading-relaxed">
              Conectamos propietarios de vehículos con viajeros en la Perla del Caribe. 
              Explora la isla a tu ritmo con nuestro marketplace de alquiler de autos.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={createPageUrl("Browse")}>
                <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl h-14 px-8 text-lg shadow-lg shadow-teal-500/30">
                  <Search className="w-5 h-5 mr-2" />
                  Buscar Vehículos
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-12 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl font-bold text-teal-600">{stat.value}</p>
                <p className="text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              La forma más fácil y segura de alquilar un vehículo en Isla de Margarita
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-sm hover:shadow-lg transition-shadow rounded-2xl">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mb-5">
                      <feature.icon className="w-7 h-7 text-teal-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Vehicles */}
      {featuredVehicles.length > 0 && (
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="flex items-end justify-between mb-12"
            >
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Vehículos destacados
                </h2>
                <p className="text-xl text-gray-500">
                  Los más populares disponibles ahora
                </p>
              </div>
              <Link to={createPageUrl("Browse")}>
                <Button variant="ghost" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                  Ver todos
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVehicles.map((vehicle, index) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <VehicleCard vehicle={vehicle} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it Works - For Renters */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Cómo funciona
            </h2>
            <p className="text-xl text-gray-500">
              Alquilar un vehículo nunca fue tan fácil
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Busca y elige", desc: "Explora nuestra variedad de vehículos y encuentra el ideal para ti." },
              { step: "02", title: "Reserva y paga", desc: "Selecciona tus fechas y realiza el pago de forma segura con Stripe." },
              { step: "03", title: "Disfruta", desc: "Recoge el vehículo y explora la Isla de Margarita a tu ritmo." }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-7xl font-bold text-gray-100 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for Owners */}
      <section className="py-24 bg-gradient-to-br from-teal-600 to-teal-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                ¿Tienes un vehículo? <br />Gana dinero alquilándolo
              </h2>
              <p className="text-xl text-teal-100 mb-8 leading-relaxed">
                Únete a nuestra comunidad de propietarios y genera ingresos extra 
                con tu vehículo cuando no lo usas. Tú controlas la disponibilidad y el precio.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  "Publica tu vehículo gratis",
                  "Tú decides cuándo está disponible",
                  "Pagos seguros y rápidos",
                  "Soporte dedicado para propietarios"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-teal-300" />
                    <span className="text-white">{item}</span>
                  </div>
                ))}
              </div>
              <Link to={createPageUrl("Register")}>
                <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100 rounded-xl h-14 px-8 text-lg shadow-lg">
                  Comenzar como propietario
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">GoRentals</span>
              </div>
              <p className="text-gray-400 max-w-md">
                El marketplace de alquiler de vehículos líder en Isla de Margarita. 
                Conectamos propietarios con viajeros de forma segura y sencilla.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Enlaces</h4>
              <ul className="space-y-2">
                <li><Link to={createPageUrl("Browse")} className="text-gray-400 hover:text-white transition-colors">Buscar vehículos</Link></li>
                <li><Link to={createPageUrl("Register")} className="text-gray-400 hover:text-white transition-colors">Registrarse</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Isla de Margarita, Venezuela</li>
                <li>info@gorentals.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} GoRentals. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}