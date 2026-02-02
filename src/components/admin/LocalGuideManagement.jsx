import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Edit, Trash2, Star, MapPin, Camera, Navigation, 
  UtensilsCrossed, Waves, Loader2, Eye, EyeOff, Upload, X 
} from "lucide-react";
import { toast } from "sonner";

export default function LocalGuideManagement() {
  const [guides, setGuides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingGuide, setEditingGuide] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "beach",
    location: "",
    coordinates: { lat: 11.0, lng: -63.9 },
    photos: [],
    rating: 5,
    price_level: "budget",
    tips: [],
    best_time_to_visit: "",
    duration: "",
    is_featured: false,
    is_active: true
  });

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      const data = await base44.entities.LocalGuide.list();
      setGuides(data);
    } catch (error) {
      console.error("Error loading guides:", error);
      toast.error("Error al cargar las guías");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Procesar tips (split by newlines)
      const processedData = {
        ...formData,
        tips: formData.tips.filter(tip => tip.trim() !== ""),
        photos: formData.photos.filter(photo => photo.trim() !== ""),
        rating: parseFloat(formData.rating),
        coordinates: {
          lat: parseFloat(formData.coordinates.lat),
          lng: parseFloat(formData.coordinates.lng)
        }
      };

      if (editingGuide) {
        await base44.entities.LocalGuide.update(editingGuide.id, processedData);
        toast.success("Guía actualizada exitosamente");
      } else {
        await base44.entities.LocalGuide.create(processedData);
        toast.success("Guía creada exitosamente");
      }

      setIsDialogOpen(false);
      resetForm();
      loadGuides();
    } catch (error) {
      console.error("Error saving guide:", error);
      toast.error("Error al guardar la guía");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (guide) => {
    setEditingGuide(guide);
    setFormData({
      title: guide.title || "",
      description: guide.description || "",
      category: guide.category || "beach",
      location: guide.location || "",
      coordinates: guide.coordinates || { lat: 11.0, lng: -63.9 },
      photos: guide.photos || [],
      rating: guide.rating || 5,
      price_level: guide.price_level || "budget",
      tips: guide.tips || [],
      best_time_to_visit: guide.best_time_to_visit || "",
      duration: guide.duration || "",
      is_featured: guide.is_featured || false,
      is_active: guide.is_active !== undefined ? guide.is_active : true
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta guía?")) return;

    try {
      await base44.entities.LocalGuide.delete(id);
      toast.success("Guía eliminada");
      loadGuides();
    } catch (error) {
      console.error("Error deleting guide:", error);
      toast.error("Error al eliminar la guía");
    }
  };

  const toggleFeatured = async (guide) => {
    try {
      await base44.entities.LocalGuide.update(guide.id, {
        ...guide,
        is_featured: !guide.is_featured
      });
      toast.success(guide.is_featured ? "Quitado de destacados" : "Marcado como destacado");
      loadGuides();
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  const toggleActive = async (guide) => {
    try {
      await base44.entities.LocalGuide.update(guide.id, {
        ...guide,
        is_active: !guide.is_active
      });
      toast.success(guide.is_active ? "Guía desactivada" : "Guía activada");
      loadGuides();
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      
      const results = await Promise.all(uploadPromises);
      const newPhotoUrls = results.map(result => result.file_url);
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotoUrls]
      }));
      
      toast.success(`${files.length} imagen(es) subida(s) exitosamente`);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Error al subir las imágenes");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemovePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setEditingGuide(null);
    setFormData({
      title: "",
      description: "",
      category: "beach",
      location: "",
      coordinates: { lat: 11.0, lng: -63.9 },
      photos: [],
      rating: 5,
      price_level: "budget",
      tips: [],
      best_time_to_visit: "",
      duration: "",
      is_featured: false,
      is_active: true
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "beach": return Waves;
      case "restaurant": return UtensilsCrossed;
      case "route": return Navigation;
      case "attraction": return Camera;
      default: return MapPin;
    }
  };

  const filteredGuides = activeTab === "all" 
    ? guides 
    : guides.filter(g => g.category === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Guías Turísticas</h2>
          <p className="text-gray-600 text-sm mt-1">
            {guides.length} guías totales • {guides.filter(g => g.is_active).length} activas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Guía
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGuide ? "Editar Guía" : "Nueva Guía Turística"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Playa El Agua"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label>Descripción *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción detallada del lugar..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label>Categoría *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beach">🏖️ Playa</SelectItem>
                      <SelectItem value="restaurant">🍴 Restaurante</SelectItem>
                      <SelectItem value="route">🗺️ Ruta</SelectItem>
                      <SelectItem value="attraction">📸 Atracción</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Nivel de Precio</Label>
                  <Select value={formData.price_level} onValueChange={(value) => setFormData({ ...formData, price_level: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Gratis</SelectItem>
                      <SelectItem value="budget">$ Económico</SelectItem>
                      <SelectItem value="moderate">$$ Moderado</SelectItem>
                      <SelectItem value="expensive">$$$ Costoso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Ubicación *</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ej: Costa Norte, Margarita"
                    required
                  />
                </div>

                <div>
                  <Label>Calificación (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Latitud</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.coordinates.lat}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      coordinates: { ...formData.coordinates, lat: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <Label>Longitud</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.coordinates.lng}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      coordinates: { ...formData.coordinates, lng: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <Label>Mejor Momento para Visitar</Label>
                  <Input
                    value={formData.best_time_to_visit}
                    onChange={(e) => setFormData({ ...formData, best_time_to_visit: e.target.value })}
                    placeholder="Ej: Mañanas entre semana"
                  />
                </div>

                <div>
                  <Label>Duración Sugerida</Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="Ej: Medio día"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Fotos del Lugar</Label>
                  
                  {/* Image Upload Button */}
                  <div className="mb-4">
                    <label className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-teal-500 hover:bg-teal-50 transition-all text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600 mb-1">
                          {uploadingImage ? "Subiendo imágenes..." : "Haz clic para subir imágenes"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Puedes seleccionar múltiples archivos
                        </p>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Photo Preview Grid */}
                  {formData.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {index === 0 && (
                            <Badge className="absolute bottom-2 left-2 bg-teal-600 text-xs">
                              Principal
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* URL Input (optional) */}
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      O agregar URLs manualmente
                    </summary>
                    <Textarea
                      value={formData.photos.join("\n")}
                      onChange={(e) => setFormData({ ...formData, photos: e.target.value.split("\n").filter(url => url.trim()) })}
                      placeholder="https://ejemplo.com/foto1.jpg&#10;https://ejemplo.com/foto2.jpg"
                      rows={3}
                      className="mt-2"
                    />
                  </details>
                </div>

                <div className="col-span-2">
                  <Label>Consejos (uno por línea)</Label>
                  <Textarea
                    value={formData.tips.join("\n")}
                    onChange={(e) => setFormData({ ...formData, tips: e.target.value.split("\n") })}
                    placeholder="Llega temprano para conseguir estacionamiento&#10;Trae protector solar"
                    rows={3}
                  />
                </div>

                <div className="col-span-2 flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Destacar en portada</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Activo (visible)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    editingGuide ? "Actualizar" : "Crear Guía"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Todas ({guides.length})</TabsTrigger>
          <TabsTrigger value="beach">Playas ({guides.filter(g => g.category === "beach").length})</TabsTrigger>
          <TabsTrigger value="restaurant">Restaurantes ({guides.filter(g => g.category === "restaurant").length})</TabsTrigger>
          <TabsTrigger value="route">Rutas ({guides.filter(g => g.category === "route").length})</TabsTrigger>
          <TabsTrigger value="attraction">Atracciones ({guides.filter(g => g.category === "attraction").length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
          </div>
        ) : filteredGuides.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay guías en esta categoría</p>
            </CardContent>
          </Card>
        ) : (
          filteredGuides.map((guide) => {
            const Icon = getCategoryIcon(guide.category);
            return (
              <Card key={guide.id} className={!guide.is_active ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {guide.photos?.[0] && (
                      <img
                        src={guide.photos[0]}
                        alt={guide.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{guide.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {guide.location}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFeatured(guide)}
                            className={guide.is_featured ? "text-yellow-500" : "text-gray-400"}
                          >
                            <Star className={`w-4 h-4 ${guide.is_featured ? "fill-yellow-500" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleActive(guide)}
                          >
                            {guide.is_active ? (
                              <Eye className="w-4 h-4 text-green-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(guide)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(guide.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {guide.description}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="gap-1">
                          <Icon className="w-3 h-3" />
                          {guide.category === "beach" && "Playa"}
                          {guide.category === "restaurant" && "Restaurante"}
                          {guide.category === "route" && "Ruta"}
                          {guide.category === "attraction" && "Atracción"}
                        </Badge>
                        {guide.rating && (
                          <Badge variant="outline" className="gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            {guide.rating.toFixed(1)}
                          </Badge>
                        )}
                        {guide.is_featured && (
                          <Badge className="bg-yellow-500">Destacado</Badge>
                        )}
                        {!guide.is_active && (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}