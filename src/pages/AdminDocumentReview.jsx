import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft, FileText, CheckCircle, XCircle,
  Clock, User, Calendar, ExternalLink
} from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const DOCUMENT_LABELS = {
  driver_license: "Licencia de conducir",
  vehicle_registration: "Registro del vehículo",
  vehicle_insurance: "Seguro del vehículo",
  passport: "Pasaporte",
  dni: "DNI/Cédula"
};

export default function AdminDocumentReview() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [reviewAction, setReviewAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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
    if (userData.role !== "admin") {
      navigate(createPageUrl("Dashboard"));
      return;
    }

    setUser(userData);

    const docs = await base44.entities.VerificationDocument.list("-created_date");
    setDocuments(docs);
    setIsLoading(false);
  };

  const handleReview = async (document, action) => {
    setSelectedDoc(document);
    setReviewAction(action);
    setRejectionReason("");
  };

  const confirmReview = async () => {
    if (reviewAction === "reject" && !rejectionReason.trim()) {
      alert("Por favor proporciona una razón para el rechazo");
      return;
    }

    setIsProcessing(true);

    try {
      await base44.entities.VerificationDocument.update(selectedDoc.id, {
        status: reviewAction === "approve" ? "approved" : "rejected",
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reviewAction === "reject" ? rejectionReason : null
      });

      // Send notification to user
      await base44.entities.Notification.create({
        user_email: selectedDoc.user_email,
        title: reviewAction === "approve" 
          ? "Documento aprobado" 
          : "Documento rechazado",
        message: reviewAction === "approve"
          ? `Tu ${DOCUMENT_LABELS[selectedDoc.document_type]} ha sido aprobado.`
          : `Tu ${DOCUMENT_LABELS[selectedDoc.document_type]} ha sido rechazado. ${rejectionReason}`,
        type: "booking_request"
      });

      // Reload documents
      const docs = await base44.entities.VerificationDocument.list("-created_date");
      setDocuments(docs);

      setSelectedDoc(null);
      setReviewAction(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error reviewing document:", error);
      alert("Error al revisar el documento");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando documentos..." />;
  }

  const pendingDocs = documents.filter(d => d.status === "pending");
  const approvedDocs = documents.filter(d => d.status === "approved");
  const rejectedDocs = documents.filter(d => d.status === "rejected");

  const DocumentCard = ({ document }) => (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {DOCUMENT_LABELS[document.document_type]}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User className="w-4 h-4" />
                {document.user_name} ({document.user_type === "owner" ? "Propietario" : "Arrendatario"})
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(document.created_date), "PPp", { locale: es })}
              </div>
            </div>
          </div>
          {document.status === "pending" ? (
            <Badge className="bg-yellow-100 text-yellow-800">
              <Clock className="w-3 h-3 mr-1" />
              Pendiente
            </Badge>
          ) : document.status === "approved" ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Aprobado
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">
              <XCircle className="w-3 h-3 mr-1" />
              Rechazado
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <a
            href={document.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="outline" className="w-full rounded-xl">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver documento
            </Button>
          </a>

          {document.status === "pending" && (
            <>
              <Button
                onClick={() => handleReview(document, "approve")}
                className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprobar
              </Button>
              <Button
                onClick={() => handleReview(document, "reject")}
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
            </>
          )}
        </div>

        {document.status === "rejected" && document.rejection_reason && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800">
              <strong>Razón:</strong> {document.rejection_reason}
            </p>
          </div>
        )}

        {document.status === "approved" && document.reviewed_by && (
          <div className="mt-3 text-xs text-gray-500">
            Aprobado por {document.reviewed_by} el {format(new Date(document.reviewed_at), "PPp", { locale: es })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("AdminDashboard"))}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Volver al panel
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Revisión de Documentos
          </h1>
          <p className="text-gray-500">
            Revisa y aprueba los documentos de verificación de usuarios
          </p>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="relative">
              Pendientes
              {pendingDocs.length > 0 && (
                <span className="ml-2 w-5 h-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center">
                  {pendingDocs.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Aprobados ({approvedDocs.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rechazados ({rejectedDocs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingDocs.length === 0 ? (
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-12 text-center">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay documentos pendientes
                  </h3>
                  <p className="text-gray-500">
                    Todos los documentos han sido revisados
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingDocs.map(doc => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {approvedDocs.length === 0 ? (
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay documentos aprobados</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {approvedDocs.map(doc => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {rejectedDocs.length === 0 ? (
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-12 text-center">
                  <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay documentos rechazados</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rejectedDocs.map(doc => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Aprobar documento" : "Rechazar documento"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "¿Estás seguro de que quieres aprobar este documento?"
                : "Por favor proporciona una razón para el rechazo"}
            </DialogDescription>
          </DialogHeader>

          {reviewAction === "reject" && (
            <div className="space-y-2">
              <Label htmlFor="reason">Razón del rechazo</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ej: El documento está borroso, vencido, o no coincide con el nombre..."
                rows={4}
                className="rounded-xl"
              />
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setSelectedDoc(null)}
              className="flex-1 rounded-xl"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmReview}
              className={`flex-1 rounded-xl ${
                reviewAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              disabled={isProcessing}
            >
              {isProcessing ? "Procesando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}