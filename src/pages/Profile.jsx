import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, Loader2, Upload, User, MapPin, Phone, Mail, 
  Star, LogOut, Shield, Bell, Car
} from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { motion } from "framer-motion";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    location: "",
    bio: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      navigate(createPageUrl("Register"));
      return;
    }

    const userData = await base44.auth.me();
    setUser(userData);
    setFormData({
      phone: userData.phone || "",
      location: userData.location || "",
      bio: userData.bio || ""
    });
    setIsLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    
    await base44.auth.updateMe({ profile_image: file_url });
    setUser(prev => ({ ...prev, profile_image: file_url }));
    setIsUploading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await base44.auth.updateMe(formData);
    setUser(prev => ({ ...prev, ...formData }));
    setIsSaving(false);
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl("Landing"));
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando perfil..." />;
  }

  const userTypeLabel = user?.user_type === "owner" ? "Propietario" : "Arrendatario";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Volver
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>

          {/* Profile Photo */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user?.profile_image} />
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl">
                      {user?.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-teal-700 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-white" />
                    )}
                  </label>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{user?.full_name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="rounded-full">
                      {userTypeLabel}
                    </Badge>
                    {user?.is_verified && (
                      <Badge className="bg-green-100 text-green-700 border-0">
                        <Shield className="w-3 h-3 mr-1" />
                        Verificado
                      </Badge>
                    )}
                  </div>
                  {user?.average_rating > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{user.average_rating.toFixed(1)}</span>
                      <span>({user.total_reviews} reseñas)</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Información de cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 text-gray-500">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <p className="mt-1 font-medium">{user?.email}</p>
              </div>
              
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+58 412 123 4567"
                  className="mt-2 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  Ubicación
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Porlamar, Isla de Margarita"
                  className="mt-2 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Cuéntanos sobre ti..."
                  className="mt-2 rounded-xl resize-none"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-teal-600 hover:bg-teal-700 rounded-xl h-12"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Notifications Settings */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Configura qué notificaciones quieres recibir y cómo
              </p>
              <Link to={createPageUrl("NotificationSettings")}>
                <Button variant="outline" className="w-full rounded-xl h-12">
                  Configurar notificaciones
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Stats for Owners */}
          {user?.user_type === "owner" && (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-teal-600">
                      ${(user?.total_earnings || 0).toFixed(0)}
                    </p>
                    <p className="text-sm text-gray-500">Ganancias totales</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-teal-600">
                      {user?.total_reviews || 0}
                    </p>
                    <p className="text-sm text-gray-500">Reseñas</p>
                  </div>
                </div>
                <Link to={createPageUrl("OwnerDashboard")}>
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 rounded-xl h-12">
                    Ir al Panel de Gestión Completo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Logout */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full rounded-xl h-12 border-red-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </motion.div>
      </div>
    </div>
  );
}