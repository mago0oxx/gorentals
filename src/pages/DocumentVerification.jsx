import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, Upload, FileText, CheckCircle, XCircle,
  Clock, Shield, AlertCircle, Loader2
} from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const DOCUMENT_TYPES = {
  owner: [
    { value: "driver_license", label: "Licencia de conducir", required: true },
    { value: "vehicle_registration", label: "Registro del vehículo", required: true },
    { value: "vehicle_insurance", label: "Seguro del vehículo", required: false }
  ],
  renter: [
    { value: "driver_license", label: "Licencia de conducir", required: true },
    { value: "passport", label: "Pasaporte", required: false },
    { value: "dni", label: "DNI/Cédula", required: false }
  ]
};

export default function DocumentVerification() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState({});

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
    if (!userData.user_type) {
      navigate(createPageUrl("Register"));
      return;
    }

    setUser(userData);

    const docs = await base44.entities.VerificationDocument.filter({
      user_email: userData.email
    }, "-created_date");

    setDocuments(docs);
    setIsLoading(false);
  };

  const handleFileUpload = async (documentType, event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('[DocumentVerification] Starting upload for:', documentType, 'File:', file.name);

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("El archivo es demasiado grande. Máximo 10MB.");
      event.target.value = null;
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      alert("Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG o PDF.");
      event.target.value = null;
      return;
    }

    setUploading(prev => ({ ...prev, [documentType]: true }));

    try {
      console.log('[DocumentVerification] Uploading file to server...');
      
      // Add timeout for file upload (60 seconds)
      const uploadPromise = base44.integrations.Core.UploadFile({ file });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('La carga del archivo tardó demasiado')), 60000)
      );
      
      const { file_url } = await Promise.race([uploadPromise, timeoutPromise]);
      console.log('[DocumentVerification] File uploaded:', file_url);

      // Create document record
      console.log('[DocumentVerification] Creating document record...');
      await base44.entities.VerificationDocument.create({
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
        user_type: user.user_type,
        document_type: documentType,
        document_url: file_url,
        status: "pending"
      });
      console.log('[DocumentVerification] Document record created');

      // Reload documents
      console.log('[DocumentVerification] Reloading documents...');
      const docs = await base44.entities.VerificationDocument.filter({
        user_email: user.email
      }, "-created_date");
      setDocuments(docs);
      console.log('[DocumentVerification] Documents reloaded successfully');

      alert("Documento subido exitosamente. Será revisado en 24-48 horas.");

    } catch (error) {
      console.error('[DocumentVerification] Error:', error);
      alert(error.message || "Error al subir el documento. Inténtalo de nuevo.");
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }));
      event.target.value = null;
    }
  };

  const getDocumentStatus = (documentType) => {
    const doc = documents.find(d => d.document_type === documentType);
    return doc;
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { icon: Clock, label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
      approved: { icon: CheckCircle, label: "Aprobado", className: "bg-green-100 text-green-800" },
      rejected: { icon: XCircle, label: "Rechazado", className: "bg-red-100 text-red-800" }
    };

    const { icon: Icon, label, className } = config[status] || config.pending;

    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando documentos..." />;
  }

  const documentTypes = DOCUMENT_TYPES[user.user_type] || [];
  const allRequiredApproved = documentTypes
    .filter(dt => dt.required)
    .every(dt => {
      const doc = getDocumentStatus(dt.value);
      return doc && doc.status === "approved";
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Volver
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Verificación de Documentos
              </h1>
              <p className="text-gray-500">
                Sube tus documentos para verificar tu cuenta
              </p>
            </div>
          </div>
        </div>

        {/* Status Alert */}
        {allRequiredApproved ? (
          <Alert className="mb-6 rounded-xl border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ¡Tu cuenta está completamente verificada! Todos tus documentos han sido aprobados.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6 rounded-xl border-blue-200 bg-blue-50">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Sube tus documentos para verificar tu cuenta. Los documentos serán revisados por nuestro equipo en 24-48 horas.
            </AlertDescription>
          </Alert>
        )}

        {/* Document Upload Cards */}
        <div className="space-y-4">
          {documentTypes.map((docType) => {
            const existingDoc = getDocumentStatus(docType.value);
            const isUploading = uploading[docType.value];

            return (
              <Card key={docType.value} className="border-0 shadow-sm rounded-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-teal-600" />
                        {docType.label}
                        {docType.required && (
                          <span className="text-red-500 text-sm">*</span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {docType.required ? "Documento requerido" : "Documento opcional"}
                      </CardDescription>
                    </div>
                    {existingDoc && getStatusBadge(existingDoc.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {existingDoc ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-600">Documento subido</p>
                          <a
                            href={existingDoc.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-teal-600 hover:underline"
                          >
                            Ver documento
                          </a>
                        </div>
                        <p className="text-xs text-gray-500">
                          Subido el {new Date(existingDoc.created_date).toLocaleDateString('es-VE')}
                        </p>
                      </div>

                      {existingDoc.status === "rejected" && (
                        <Alert className="border-red-200 bg-red-50">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            <p className="font-medium mb-1">Documento rechazado</p>
                            {existingDoc.rejection_reason && (
                              <p className="text-sm">{existingDoc.rejection_reason}</p>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      {existingDoc.status === "rejected" && (
                        <div>
                          <input
                            type="file"
                            id={`reupload-${docType.value}`}
                            className="hidden"
                            accept="image/jpeg,image/png,image/jpg,application/pdf"
                            onChange={(e) => handleFileUpload(docType.value, e)}
                            disabled={isUploading}
                          />
                          <label 
                            htmlFor={`reupload-${docType.value}`}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                            style={isUploading ? { pointerEvents: 'none', opacity: 0.5 } : {}}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Subiendo...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Volver a subir
                              </>
                            )}
                          </label>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id={`upload-${docType.value}`}
                        className="hidden"
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        onChange={(e) => handleFileUpload(docType.value, e)}
                        disabled={isUploading}
                      />
                      <label 
                        htmlFor={`upload-${docType.value}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-teal-700 cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                        style={isUploading ? { pointerEvents: 'none', opacity: 0.5 } : {}}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Subir documento
                          </>
                        )}
                      </label>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Formatos: JPG, PNG, PDF (máx. 10MB)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help Card */}
        <Card className="border-0 shadow-sm rounded-2xl mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-blue-900">
                <p className="font-medium">Consejos para subir documentos:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Asegúrate de que los documentos sean legibles y estén completos</li>
                  <li>Las fotos deben tener buena iluminación y enfoque</li>
                  <li>No subas documentos vencidos</li>
                  <li>Los documentos del vehículo deben estar a tu nombre (propietarios)</li>
                  <li>La revisión toma entre 24-48 horas hábiles</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}