import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Users, Car, Calendar, DollarSign, TrendingUp, MoreVertical,
  Search, Shield, UserX, Trash2, Eye, Ban, CheckCircle, User, Tag
} from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import CouponManagement from "@/components/admin/CouponManagement";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  active: "bg-teal-100 text-teal-700",
  completed: "bg-gray-100 text-gray-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-red-100 text-red-700"
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVehicles: 0,
    totalBookings: 0,
    totalRevenue: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [actionDialog, setActionDialog] = useState({ open: false, type: "", item: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      navigate(createPageUrl("Register"));
      return;
    }

    const user = await base44.auth.me();
    if (user.role !== "admin") {
      navigate(createPageUrl("Dashboard"));
      return;
    }

    const [usersData, vehiclesData, bookingsData, couponsData] = await Promise.all([
      base44.entities.User.list("-created_date"),
      base44.entities.Vehicle.list("-created_date"),
      base44.entities.Booking.list("-created_date"),
      base44.entities.Coupon.list("-created_date")
    ]);

    setUsers(usersData);
    setVehicles(vehiclesData);
    setBookings(bookingsData);
    setCoupons(couponsData);

    // Calculate stats
    const completedBookings = bookingsData.filter(b => b.status === "completed");
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.platform_fee || 0), 0);

    setStats({
      totalUsers: usersData.length,
      totalVehicles: vehiclesData.length,
      totalBookings: bookingsData.length,
      totalRevenue
    });

    setIsLoading(false);
  };

  const handleSuspendUser = async () => {
    if (!actionDialog.item) return;
    await base44.entities.User.update(actionDialog.item.id, {
      is_suspended: !actionDialog.item.is_suspended
    });
    await loadData();
    setActionDialog({ open: false, type: "", item: null });
  };

  const handleDeleteVehicle = async () => {
    if (!actionDialog.item) return;
    await base44.entities.Vehicle.delete(actionDialog.item.id);
    await loadData();
    setActionDialog({ open: false, type: "", item: null });
  };

  const handleToggleVehicleActive = async (vehicle) => {
    await base44.entities.Vehicle.update(vehicle.id, {
      is_active: !vehicle.is_active
    });
    await loadData();
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVehicles = vehicles.filter(v =>
    v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text="Cargando panel de administración..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                <p className="text-gray-500">GoRentals</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate(createPageUrl("AdminDocumentReview"))}
                variant="outline"
                className="rounded-xl border-teal-200 text-teal-600 hover:bg-teal-50"
              >
                <Shield className="w-4 h-4 mr-2" />
                Revisar documentos
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total usuarios</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Vehículos</p>
                  <p className="text-3xl font-bold">{stats.totalVehicles}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Car className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Reservas</p>
                  <p className="text-3xl font-bold">{stats.totalBookings}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ingresos plataforma</p>
                  <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(0)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar usuarios, vehículos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 rounded-xl"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="vehicles">Vehículos</TabsTrigger>
            <TabsTrigger value="bookings">Reservas</TabsTrigger>
            <TabsTrigger value="coupons">
              <Tag className="w-4 h-4 mr-2" />
              Cupones
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-0 shadow-sm rounded-2xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full">
                          {user.user_type === "owner" ? "Propietario" : "Arrendatario"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.location || "-"}</TableCell>
                      <TableCell>
                        {user.is_suspended ? (
                          <Badge className="bg-red-100 text-red-700 border-0">Suspendido</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 border-0">Activo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setActionDialog({ open: true, type: "suspend", item: user })}
                            >
                              {user.is_suspended ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Reactivar
                                </>
                              ) : (
                                <>
                                  <Ban className="w-4 h-4 mr-2" />
                                  Suspender
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles">
            <Card className="border-0 shadow-sm rounded-2xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Precio/día</TableHead>
                    <TableHead>Reservas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={vehicle.photos?.[0] || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=100"}
                            alt={vehicle.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium">{vehicle.title}</p>
                            <p className="text-sm text-gray-500">{vehicle.brand} {vehicle.model}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{vehicle.owner_name}</TableCell>
                      <TableCell>${vehicle.price_per_day}</TableCell>
                      <TableCell>{vehicle.total_bookings || 0}</TableCell>
                      <TableCell>
                        {vehicle.is_active ? (
                          <Badge className="bg-green-100 text-green-700 border-0">Activo</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-0">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(createPageUrl(`VehicleDetails?id=${vehicle.id}`))}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleVehicleActive(vehicle)}>
                              {vehicle.is_active ? (
                                <>
                                  <Ban className="w-4 h-4 mr-2" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Activar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setActionDialog({ open: true, type: "deleteVehicle", item: vehicle })}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons">
            <CouponManagement coupons={coupons} onRefresh={loadData} />
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card className="border-0 shadow-sm rounded-2xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Arrendatario</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.vehicle_title}</TableCell>
                      <TableCell>{booking.renter_name}</TableCell>
                      <TableCell>{booking.owner_name}</TableCell>
                      <TableCell>
                        {format(new Date(booking.start_date), "dd/MM", { locale: es })} - {format(new Date(booking.end_date), "dd/MM/yy", { locale: es })}
                      </TableCell>
                      <TableCell>${booking.total_amount?.toFixed(2)}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ${booking.platform_fee?.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[booking.status]} border-0`}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(createPageUrl(`BookingDetails?id=${booking.id}`))}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Dialogs */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: "", item: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === "suspend" && (actionDialog.item?.is_suspended ? "¿Reactivar usuario?" : "¿Suspender usuario?")}
              {actionDialog.type === "deleteVehicle" && "¿Eliminar vehículo?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.type === "suspend" && (
                actionDialog.item?.is_suspended
                  ? "El usuario podrá volver a usar la plataforma normalmente."
                  : "El usuario no podrá acceder a su cuenta ni realizar operaciones."
              )}
              {actionDialog.type === "deleteVehicle" && "Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={actionDialog.type === "suspend" ? handleSuspendUser : handleDeleteVehicle}
              className={actionDialog.type === "deleteVehicle" || (!actionDialog.item?.is_suspended && actionDialog.type === "suspend") ? "bg-red-600 hover:bg-red-700" : ""}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}