import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft, DollarSign, TrendingUp, TrendingDown, Clock,
  CheckCircle, XCircle, ArrowUpRight, ArrowDownLeft, Shield, RefreshCw, User
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";

const typeConfig = {
  payment: { label: "Pago", icon: ArrowUpRight, color: "text-red-600 bg-red-50" },
  payout: { label: "Ingreso", icon: ArrowDownLeft, color: "text-green-600 bg-green-50" },
  commission: { label: "Comisión", icon: DollarSign, color: "text-purple-600 bg-purple-50" },
  refund: { label: "Reembolso", icon: RefreshCw, color: "text-blue-600 bg-blue-50" },
  deposit_hold: { label: "Depósito retenido", icon: Shield, color: "text-amber-600 bg-amber-50" },
  deposit_release: { label: "Depósito liberado", icon: Shield, color: "text-green-600 bg-green-50" }
};

const statusConfig = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700" },
  completed: { label: "Completado", color: "bg-green-100 text-green-700" },
  failed: { label: "Fallido", color: "bg-red-100 text-red-700" },
  refunded: { label: "Reembolsado", color: "bg-blue-100 text-blue-700" }
};

export default function Transactions() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ totalIncome: 0, totalSpent: 0, pendingPayouts: 0 });
  const [isLoading, setIsLoading] = useState(true);

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

    const userTransactions = await base44.entities.Transaction.filter(
      { user_email: userData.email },
      "-created_date"
    );
    setTransactions(userTransactions);

    // Calculate stats
    const isOwner = userData.user_type === "owner";
    
    if (isOwner) {
      const completedPayouts = userTransactions
        .filter(t => t.type === "payout" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const pendingPayouts = userTransactions
        .filter(t => t.type === "payout" && t.status === "pending")
        .reduce((sum, t) => sum + t.amount, 0);

      setStats({
        totalIncome: completedPayouts,
        pendingPayouts: pendingPayouts,
        totalTransactions: userTransactions.length
      });
    } else {
      const totalSpent = userTransactions
        .filter(t => t.type === "payment" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);

      const heldDeposits = userTransactions
        .filter(t => t.type === "deposit_hold" && t.status === "pending")
        .reduce((sum, t) => sum + t.amount, 0);

      setStats({
        totalSpent: totalSpent,
        heldDeposits: heldDeposits,
        totalTransactions: userTransactions.length
      });
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando transacciones..." />;
  }

  const isOwner = user?.user_type === "owner";
  const completedTransactions = transactions.filter(t => t.status === "completed");
  const pendingTransactions = transactions.filter(t => t.status === "pending");

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
            Volver
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Profile"))}
            className="rounded-xl"
          >
            <User className="w-4 h-4 mr-2" />
            Mi Perfil
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Historial de transacciones</h1>
        <p className="text-gray-500 mb-8">Revisa todos tus movimientos financieros</p>

        {/* Stats Cards */}
        <div className={`grid gap-4 mb-8 ${isOwner ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {isOwner ? (
            <>
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Ingresos totales</p>
                      <p className="text-2xl font-bold text-green-600">${stats.totalIncome?.toFixed(2)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Pagos pendientes</p>
                      <p className="text-2xl font-bold text-amber-600">${stats.pendingPayouts?.toFixed(2)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Transacciones</p>
                      <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total gastado</p>
                      <p className="text-2xl font-bold">${stats.totalSpent?.toFixed(2)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Depósitos retenidos</p>
                      <p className="text-2xl font-bold text-amber-600">${stats.heldDeposits?.toFixed(2)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Transactions List */}
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <TransactionList transactions={transactions} isOwner={isOwner} />
          </TabsContent>
          <TabsContent value="completed">
            <TransactionList transactions={completedTransactions} isOwner={isOwner} />
          </TabsContent>
          <TabsContent value="pending">
            <TransactionList transactions={pendingTransactions} isOwner={isOwner} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TransactionList({ transactions, isOwner }) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Sin transacciones"
        description="Tus movimientos aparecerán aquí"
      />
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const type = typeConfig[transaction.type] || typeConfig.payment;
        const status = statusConfig[transaction.status] || statusConfig.pending;
        const Icon = type.icon;
        
        const isIncome = transaction.type === "payout" || transaction.type === "deposit_release" || transaction.type === "refund";

        return (
          <Card key={transaction.id} className="border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{transaction.description}</p>
                    <Badge className={`${status.color} border-0 text-xs`}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {format(new Date(transaction.created_date), "d MMM yyyy, HH:mm", { locale: es })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isIncome ? "text-green-600" : "text-gray-900"}`}>
                    {isIncome ? "+" : "-"}${transaction.amount?.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">{transaction.currency || "USD"}</p>
                </div>
              </div>
              {transaction.booking_id && (
                <Link 
                  to={createPageUrl(`BookingDetails?id=${transaction.booking_id}`)}
                  className="block mt-3 text-sm text-teal-600 hover:underline"
                >
                  Ver reserva →
                </Link>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}