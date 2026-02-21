import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Tag, Loader2, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

const vehicleTypes = [
  { value: "sedan", label: "Sedán" },
  { value: "suv", label: "SUV" },
  { value: "pickup", label: "Pickup" },
  { value: "van", label: "Van" },
  { value: "motorcycle", label: "Moto" },
  { value: "compact", label: "Compacto" }
];

export default function CouponManagement({ coupons, onRefresh }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, coupon: null });
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discount_type: "percentage",
    discount_value: 0,
    min_booking_amount: 0,
    max_discount_amount: null,
    valid_from: "",
    valid_until: "",
    usage_limit: null,
    usage_per_user: 1,
    applicable_vehicle_types: [],
    is_featured: false,
    is_active: true
  });

  const handleOpenDialog = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_booking_amount: coupon.min_booking_amount || 0,
        max_discount_amount: coupon.max_discount_amount || null,
        valid_from: coupon.valid_from,
        valid_until: coupon.valid_until,
        usage_limit: coupon.usage_limit || null,
        usage_per_user: coupon.usage_per_user || 1,
        applicable_vehicle_types: coupon.applicable_vehicle_types || [],
        is_featured: coupon.is_featured || false,
        is_active: coupon.is_active
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        name: "",
        description: "",
        discount_type: "percentage",
        discount_value: 0,
        min_booking_amount: 0,
        max_discount_amount: null,
        valid_from: "",
        valid_until: "",
        usage_limit: null,
        usage_per_user: 1,
        applicable_vehicle_types: [],
        is_featured: false,
        is_active: true
      });
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        code: formData.code.toUpperCase(),
        discount_value: parseFloat(formData.discount_value),
        min_booking_amount: parseFloat(formData.min_booking_amount) || 0,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        usage_per_user: parseInt(formData.usage_per_user) || 1,
      };

      if (editingCoupon) {
        await base44.entities.Coupon.update(editingCoupon.id, data);
      } else {
        await base44.entities.Coupon.create({ ...data, used_count: 0 });
      }

      setIsOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Error saving coupon:", error);
      alert("Error al guardar el cupón");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.coupon) return;
    
    try {
      await base44.entities.Coupon.delete(deleteDialog.coupon.id);
      setDeleteDialog({ open: false, coupon: null });
      onRefresh();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      alert("Error al eliminar el cupón");
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await base44.entities.Coupon.update(coupon.id, {
        is_active: !coupon.is_active
      });
      onRefresh();
    } catch (error) {
      console.error("Error toggling coupon:", error);
    }
  };

  const handleToggleFeatured = async (coupon) => {
    try {
      await base44.entities.Coupon.update(coupon.id, {
        is_featured: !coupon.is_featured
      });
      onRefresh();
    } catch (error) {
      console.error("Error toggling featured:", error);
    }
  };

  const toggleVehicleType = (type) => {
    setFormData(prev => ({
      ...prev,
      applicable_vehicle_types: prev.applicable_vehicle_types.includes(type)
        ? prev.applicable_vehicle_types.filter(t => t !== type)
        : [...prev.applicable_vehicle_types, type]
    }));
  };

  const isExpired = (coupon) => new Date(coupon.valid_until) < new Date();
  const isNotStarted = (coupon) => new Date(coupon.valid_from) > new Date();
  const hasReachedLimit = (coupon) => coupon.usage_limit && coupon.used_count >= coupon.usage_limit;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cupones de descuento</h2>
          <p className="text-gray-500">Gestiona promociones y códigos de descuento</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-teal-600 hover:bg-teal-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo cupón
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? "Editar cupón" : "Crear nuevo cupón"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Código del cupón *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="VERANO2026"
                    required
                    className="uppercase"
                  />
                </div>
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Promoción Verano"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe la promoción..."
                  rows={2}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de descuento *</Label>
                  <Select value={formData.discount_type} onValueChange={(value) => setFormData({ ...formData, discount_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje</SelectItem>
                      <SelectItem value="fixed">Monto fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor del descuento *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === "percentage" ? "25" : "50"}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.discount_type === "percentage" ? "Porcentaje (ej: 25 = 25%)" : "Monto en USD"}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Monto mínimo de reserva</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.min_booking_amount}
                    onChange={(e) => setFormData({ ...formData, min_booking_amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                {formData.discount_type === "percentage" && (
                  <div>
                    <Label>Descuento máximo (USD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.max_discount_amount || ""}
                      onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value || null })}
                      placeholder="Sin límite"
                    />
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Válido desde *</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Válido hasta *</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Límite total de usos</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.usage_limit || ""}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value || null })}
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <Label>Usos por usuario *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.usage_per_user}
                    onChange={(e) => setFormData({ ...formData, usage_per_user: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Tipos de vehículos aplicables (vacío = todos)</Label>
                <div className="flex flex-wrap gap-2">
                  {vehicleTypes.map(type => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={formData.applicable_vehicle_types.includes(type.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleVehicleType(type.value)}
                      className={formData.applicable_vehicle_types.includes(type.value) ? "bg-teal-600 hover:bg-teal-700" : ""}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Cupón destacado</p>
                  <p className="text-sm text-gray-500">Se mostrará en Landing y Browse</p>
                </div>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Cupón activo</p>
                  <p className="text-sm text-gray-500">Los usuarios pueden usarlo</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-teal-600 hover:bg-teal-700">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    editingCoupon ? "Guardar cambios" : "Crear cupón"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupons List */}
      <div className="space-y-4">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{coupon.name}</h3>
                      <Badge className="bg-teal-600 text-white border-0">
                        {coupon.code}
                      </Badge>
                      {coupon.is_featured && (
                        <Badge className="bg-purple-100 text-purple-700 border-0">
                          Destacado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{coupon.description}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-500">Descuento</p>
                    <p className="font-semibold text-teal-600">
                      {coupon.discount_type === "percentage" 
                        ? `${coupon.discount_value}%` 
                        : `$${coupon.discount_value}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Validez</p>
                    <p className="text-sm font-medium">
                      {format(new Date(coupon.valid_from), "dd/MM/yy")} - {format(new Date(coupon.valid_until), "dd/MM/yy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Usos</p>
                    <p className="text-sm font-medium">
                      {coupon.used_count} / {coupon.usage_limit || "∞"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estado</p>
                    <div className="flex items-center gap-1">
                      {isExpired(coupon) ? (
                        <Badge className="bg-red-100 text-red-700 border-0">
                          <XCircle className="w-3 h-3 mr-1" />
                          Expirado
                        </Badge>
                      ) : isNotStarted(coupon) ? (
                        <Badge className="bg-blue-100 text-blue-700 border-0">
                          Próximo
                        </Badge>
                      ) : hasReachedLimit(coupon) ? (
                        <Badge className="bg-orange-100 text-orange-700 border-0">
                          Agotado
                        </Badge>
                      ) : coupon.is_active ? (
                        <Badge className="bg-green-100 text-green-700 border-0">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700 border-0">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(coupon)}
                    className="rounded-lg"
                  >
                    {coupon.is_active ? "Desactivar" : "Activar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleFeatured(coupon)}
                    className="rounded-lg"
                  >
                    {coupon.is_featured ? "Quitar destacado" : "Destacar"}
                  </Button>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleOpenDialog(coupon)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeleteDialog({ open: true, coupon })}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {coupons.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No hay cupones creados</p>
            <p className="text-sm text-gray-400">Crea tu primer cupón de descuento</p>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, coupon: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cupón?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cupón "{deleteDialog.coupon?.code}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}