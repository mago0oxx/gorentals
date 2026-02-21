import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { 
  ChevronLeft, Loader2, Upload, X, Car, DollarSign, MapPin, Info, Briefcase, User
} from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/i18n/LanguageContext";

const vehicleTypes = [
  { value: "sedan", label: "Sedán" },
  { value: "suv", label: "SUV" },
  { value: "pickup", label: "Pickup" },
  { value: "van", label: "Van" },
  { value: "motorcycle", label: "Moto" },
  { value: "compact", label: "Compacto" }
];

const transmissions = [
  { value: "automatic", label: "Automático" },
  { value: "manual", label: "Manual" }
];

const fuelTypes = [
  { value: "gasoline", label: "Gasolina" },
  { value: "diesel", label: "Diésel" },
  { value: "electric", label: "Eléctrico" },
  { value: "hybrid", label: "Híbrido" }
];

const getFeatureOptions = (t) => [
  "Aire acondicionado",
  "GPS",
  "Bluetooth",
  "Cámara de reversa",
  "Sensores de parqueo",
  "Asientos de cuero",
  "Techo corredizo",
  "Sistema de sonido premium",
  "USB/AUX",
  "Portaequipajes"
];

export default function AddVehicle() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const featureOptions = getFeatureOptions(t);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    vehicle_type: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    transmission: "",
    fuel_type: "",
    seats: 5,
    price_per_day: "",
    security_deposit: "",
    location: "",
    features: [],
    allow_commercial_use: false
  });

  const params = new URLSearchParams(window.location.search);
  const editId = params.get("edit");

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
    if (userData.user_type !== "owner") {
      navigate(createPageUrl("Dashboard"));
      return;
    }

    setUser(userData);

    // If editing, load vehicle data
    if (editId) {
      const vehicles = await base44.entities.Vehicle.filter({ id: editId });
      if (vehicles.length > 0 && vehicles[0].owner_email === userData.email) {
        const v = vehicles[0];
        setFormData({
          title: v.title || "",
          description: v.description || "",
          vehicle_type: v.vehicle_type || "",
          brand: v.brand || "",
          model: v.model || "",
          year: v.year || new Date().getFullYear(),
          transmission: v.transmission || "",
          fuel_type: v.fuel_type || "",
          seats: v.seats || 5,
          price_per_day: v.price_per_day || "",
          security_deposit: v.security_deposit || "",
          location: v.location || "",
          features: v.features || [],
          allow_commercial_use: v.allow_commercial_use || false
        });
        setPhotos(v.photos || []);
      }
    }

    setIsLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotos(prev => [...prev, file_url]);
    }

    setIsUploading(false);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const toggleFeature = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const vehicleData = {
      ...formData,
      photos,
      price_per_day: parseFloat(formData.price_per_day),
      security_deposit: parseFloat(formData.security_deposit),
      year: parseInt(formData.year),
      seats: parseInt(formData.seats)
    };

    if (editId) {
      // When editing, only update the form fields
      await base44.entities.Vehicle.update(editId, vehicleData);
    } else {
      // When creating, add all required fields
      await base44.entities.Vehicle.create({
        ...vehicleData,
        owner_id: user.id,
        owner_name: user.full_name,
        owner_email: user.email,
        is_available: true,
        is_active: true,
        average_rating: 0,
        total_reviews: 0,
        total_bookings: 0,
        blocked_dates: []
      });
    }

    navigate(createPageUrl("MyVehicles"));
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text={t('addVehicle.loading')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            {t('addVehicle.back')}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Profile"))}
            className="rounded-xl"
          >
            <User className="w-4 h-4 mr-2" />
            {t('addVehicle.myProfile')}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {editId ? t('addVehicle.editVehicle') : t('addVehicle.addVehicle')}
          </h1>
          <p className="text-gray-500 mb-8">
            {editId ? t('addVehicle.updateInfo') : t('addVehicle.publishStart')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photos */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">{t('addVehicle.vehiclePhotos')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500">{t('addVehicle.uploadPhotos')}</span>
                      </>
                    )}
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  {t('addVehicle.basicInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">{t('addVehicle.listingTitle')} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('addVehicle.titlePlaceholder')}
                    className="mt-2 rounded-xl"
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="brand">{t('addVehicle.brand')} *</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Toyota"
                      className="mt-2 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">{t('addVehicle.model')} *</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Corolla"
                      className="mt-2 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">{t('addVehicle.year')} *</Label>
                    <Input
                      id="year"
                      type="number"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="mt-2 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('addVehicle.vehicleType')} *</Label>
                    <Select
                      value={formData.vehicle_type}
                      onValueChange={(v) => setFormData({ ...formData, vehicle_type: v })}
                      required
                    >
                      <SelectTrigger className="mt-2 rounded-xl">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="seats">{t('addVehicle.seats')}</Label>
                    <Input
                      id="seats"
                      type="number"
                      min="1"
                      max="15"
                      value={formData.seats}
                      onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                      className="mt-2 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('addVehicle.transmission')} *</Label>
                    <Select
                      value={formData.transmission}
                      onValueChange={(v) => setFormData({ ...formData, transmission: v })}
                      required
                    >
                      <SelectTrigger className="mt-2 rounded-xl">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {transmissions.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('addVehicle.fuel')} *</Label>
                    <Select
                      value={formData.fuel_type}
                      onValueChange={(v) => setFormData({ ...formData, fuel_type: v })}
                      required
                    >
                      <SelectTrigger className="mt-2 rounded-xl">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {fuelTypes.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">{t('addVehicle.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('addVehicle.descPlaceholder')}
                    className="mt-2 rounded-xl resize-none"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">{t('addVehicle.features')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {featureOptions.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature}
                        checked={formData.features.includes(feature)}
                        onCheckedChange={() => toggleFeature(feature)}
                      />
                      <label
                        htmlFor={feature}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {feature}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Location */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {t('addVehicle.priceLocation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">{t('addVehicle.pricePerDay')} *</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        id="price"
                        type="number"
                        min="1"
                        step="0.01"
                        value={formData.price_per_day}
                        onChange={(e) => setFormData({ ...formData, price_per_day: e.target.value })}
                        placeholder="50"
                        className="pl-8 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="deposit">{t('addVehicle.securityDeposit')} *</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        id="deposit"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.security_deposit}
                        onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                        placeholder="200"
                        className="pl-8 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">{t('addVehicle.pickupLocation')} *</Label>
                  <div className="relative mt-2">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder={t('addVehicle.locationPlaceholder')}
                      className="pl-10 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">{t('addVehicle.commercialUse')}</p>
                        <p className="text-sm text-gray-500">{t('addVehicle.commercialDesc')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.allow_commercial_use}
                      onCheckedChange={(checked) => setFormData({ ...formData, allow_commercial_use: checked })}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">{t('addVehicle.platformCommission')}</p>
                      <p>{t('addVehicle.commissionDesc')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.brand || !formData.model || !formData.vehicle_type || !formData.transmission || !formData.fuel_type || !formData.price_per_day || !formData.security_deposit || !formData.location}
              className="w-full h-14 bg-teal-600 hover:bg-teal-700 rounded-xl text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('profile.saving')}
                </>
              ) : (
                editId ? t('profile.saveChanges') : t('addVehicle.publish')
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}