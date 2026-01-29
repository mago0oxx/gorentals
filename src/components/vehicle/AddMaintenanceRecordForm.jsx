import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, X, FileText } from "lucide-react";

export default function AddMaintenanceRecordForm({ vehicle, onSuccess, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    record_type: "maintenance",
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    cost: "",
    mileage: "",
    service_provider: "",
    notes: ""
  });
  const [documents, setDocuments] = useState([]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploadedUrls.push(file_url);
    }

    setDocuments([...documents, ...uploadedUrls]);
    setIsUploading(false);
  };

  const removeDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    await base44.entities.VehicleMaintenanceRecord.create({
      vehicle_id: vehicle.id,
      vehicle_title: vehicle.title,
      owner_id: vehicle.owner_id,
      owner_email: vehicle.owner_email,
      record_type: formData.record_type,
      title: formData.title,
      description: formData.description,
      date: formData.date,
      cost: formData.cost ? parseFloat(formData.cost) : null,
      mileage: formData.mileage ? parseFloat(formData.mileage) : null,
      service_provider: formData.service_provider,
      notes: formData.notes,
      documents
    });

    setIsSubmitting(false);
    onSuccess();
  };

  return (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle>Agregar registro al historial</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="record_type">Tipo de registro</Label>
            <Select
              value={formData.record_type}
              onValueChange={(value) => setFormData({ ...formData, record_type: value })}
            >
              <SelectTrigger className="mt-2 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="repair">Reparación</SelectItem>
                <SelectItem value="incident">Incidente</SelectItem>
                <SelectItem value="inspection">Inspección</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Cambio de aceite, Reparación de frenos"
              className="mt-2 rounded-xl"
              required
            />
          </div>

          <div>
            <Label htmlFor="date">Fecha *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-2 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost">Costo (USD)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0.00"
                className="mt-2 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="mileage">Kilometraje</Label>
              <Input
                id="mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                placeholder="50000"
                className="mt-2 rounded-xl"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="service_provider">Taller / Proveedor</Label>
            <Input
              id="service_provider"
              value={formData.service_provider}
              onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
              placeholder="Nombre del taller"
              className="mt-2 rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe los detalles del servicio o incidente..."
              className="mt-2 rounded-xl resize-none"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Información adicional relevante..."
              className="mt-2 rounded-xl resize-none"
              rows={2}
            />
          </div>

          {/* Document Upload */}
          <div>
            <Label>Documentos adjuntos (facturas, reportes, fotos)</Label>
            <div className="mt-2">
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-500 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                    <span className="text-sm text-gray-600">Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Subir archivos</span>
                  </>
                )}
              </label>
            </div>

            {documents.length > 0 && (
              <div className="mt-3 space-y-2">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 flex-1 truncate">
                      Documento {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDocument(index)}
                      className="h-6 w-6"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-teal-600 hover:bg-teal-700 rounded-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar registro"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}