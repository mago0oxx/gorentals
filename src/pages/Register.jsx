import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Car, User, Loader2, MapPin, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    location: "",
    bio: ""
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      const user = await base44.auth.me();
      if (user.user_type) {
        // User already completed registration
        navigate(createPageUrl("Dashboard"));
      } else {
        // User is logged in but hasn't selected type
        setStep(2);
      }
    }
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl("Register"));
  };

  const handleCompleteProfile = async () => {
    if (!userType) return;
    
    setIsLoading(true);
    try {
      await base44.auth.updateMe({
        user_type: userType,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        is_verified: false,
        is_suspended: false,
        total_earnings: 0,
        average_rating: 0,
        total_reviews: 0
      });
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Link to={createPageUrl("Landing")} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-teal-400 to-teal-600" />
          
          <CardHeader className="text-center pt-8 pb-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-teal-600" />
            </div>
            <CardTitle className="text-2xl">
              {step === 1 ? "Bienvenido a RentaMargarita" : "Completa tu perfil"}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? "Inicia sesión para continuar" 
                : "Cuéntanos más sobre ti para personalizar tu experiencia"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            {step === 1 ? (
              <div className="space-y-6">
                <Button 
                  onClick={handleLogin}
                  className="w-full h-14 bg-teal-600 hover:bg-teal-700 rounded-xl text-lg"
                >
                  Iniciar sesión / Registrarse
                </Button>
                
                <p className="text-center text-sm text-gray-500">
                  Al continuar, aceptas nuestros términos de servicio y política de privacidad.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-4 block">¿Qué deseas hacer en RentaMargarita?</Label>
                  <RadioGroup value={userType} onValueChange={setUserType} className="grid grid-cols-2 gap-4">
                    <Label
                      htmlFor="renter"
                      className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                        userType === "renter" 
                          ? "border-teal-500 bg-teal-50" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <RadioGroupItem value="renter" id="renter" className="sr-only" />
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        userType === "renter" ? "bg-teal-100" : "bg-gray-100"
                      }`}>
                        <User className={`w-7 h-7 ${userType === "renter" ? "text-teal-600" : "text-gray-400"}`} />
                      </div>
                      <span className={`font-medium ${userType === "renter" ? "text-teal-700" : "text-gray-700"}`}>
                        Alquilar
                      </span>
                      <span className="text-xs text-gray-500 text-center">Busco un vehículo</span>
                    </Label>
                    
                    <Label
                      htmlFor="owner"
                      className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                        userType === "owner" 
                          ? "border-teal-500 bg-teal-50" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <RadioGroupItem value="owner" id="owner" className="sr-only" />
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        userType === "owner" ? "bg-teal-100" : "bg-gray-100"
                      }`}>
                        <Car className={`w-7 h-7 ${userType === "owner" ? "text-teal-600" : "text-gray-400"}`} />
                      </div>
                      <span className={`font-medium ${userType === "owner" ? "text-teal-700" : "text-gray-700"}`}>
                        Publicar
                      </span>
                      <span className="text-xs text-gray-500 text-center">Tengo un vehículo</span>
                    </Label>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+58 412 123 4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-2 h-12 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Ubicación en Isla de Margarita</Label>
                    <div className="relative mt-2">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="location"
                        placeholder="Ej: Porlamar, Pampatar, etc."
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCompleteProfile}
                  disabled={!userType || isLoading}
                  className="w-full h-14 bg-teal-600 hover:bg-teal-700 rounded-xl text-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Completar registro"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}