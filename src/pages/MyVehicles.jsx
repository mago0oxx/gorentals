import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/components/i18n/LanguageContext";
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
  Car, Plus, ChevronLeft, MoreVertical, Edit, Trash2, Calendar,
  Star, Eye, MapPin, User, History
} from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import { motion } from "framer-motion";

export default function MyVehicles() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

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
    if (user.user_type !== "owner") {
      navigate(createPageUrl("Dashboard"));
      return;
    }

    const data = await base44.entities.Vehicle.filter(
      { owner_email: user.email },
      "-created_date"
    );
    setVehicles(data);
    setIsLoading(false);
  };

  const toggleAvailability = async (vehicle) => {
    await base44.entities.Vehicle.update(vehicle.id, {
      is_available: !vehicle.is_available
    });
    setVehicles(prev =>
      prev.map(v =>
        v.id === vehicle.id ? { ...v, is_available: !v.is_available } : v
      )
    );
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await base44.entities.Vehicle.delete(deleteId);
    setVehicles(prev => prev.filter(v => v.id !== deleteId));
    setDeleteId(null);
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text={t('myVehicles.loading')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="text-gray-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">{t('myVehicles.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("Profile"))}
              className="rounded-xl"
            >
              <User className="w-4 h-4 mr-2" />
              {t('addVehicle.myProfile')}
            </Button>
            <Link to={createPageUrl("AddVehicle")}>
              <Button className="bg-teal-600 hover:bg-teal-700 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                {t('myVehicles.add')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {vehicles.length === 0 ? (
          <EmptyState
            icon={Car}
            title={t('myVehicles.noVehicles')}
            description={t('myVehicles.publishFirst')}
            actionLabel={t('messages.addVehicle')}
            actionLink="AddVehicle"
          />
        ) : (
          <div className="space-y-4">
            {vehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <Link
                        to={createPageUrl(`VehicleDetails?id=${vehicle.id}`)}
                        className="sm:w-56 h-40 sm:h-auto flex-shrink-0"
                      >
                        <img
                          src={vehicle.photos?.[0] || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400"}
                          alt={vehicle.title}
                          className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                        />
                      </Link>
                      
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link to={createPageUrl(`VehicleDetails?id=${vehicle.id}`)}>
                              <h3 className="font-semibold text-lg hover:text-teal-600 transition-colors">
                                {vehicle.title}
                              </h3>
                            </Link>
                            <p className="text-gray-500 text-sm">
                              {vehicle.brand} {vehicle.model} • {vehicle.year}
                            </p>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(createPageUrl(`VehicleDetails?id=${vehicle.id}`))}>
                                <Eye className="w-4 h-4 mr-2" />
                                {t('myVehicles.viewListing')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(createPageUrl(`AddVehicle?edit=${vehicle.id}`))}>
                                <Edit className="w-4 h-4 mr-2" />
                                {t('myVehicles.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(createPageUrl(`VehicleCalendar?id=${vehicle.id}`))}>
                                <Calendar className="w-4 h-4 mr-2" />
                                {t('myVehicles.availability')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(createPageUrl(`VehicleHistory?id=${vehicle.id}`))}>
                                <History className="w-4 h-4 mr-2" />
                                {t('myVehicles.history')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteId(vehicle.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t('myVehicles.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          {vehicle.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <MapPin className="w-4 h-4" />
                              {vehicle.location}
                            </div>
                          )}
                          {vehicle.average_rating > 0 && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <span>{vehicle.average_rating.toFixed(1)}</span>
                              <span className="text-gray-400">({vehicle.total_reviews})</span>
                            </div>
                          )}
                          <Badge variant="outline" className="rounded-full">
                            {vehicle.total_bookings || 0} {t('myVehicles.bookings')}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div>
                            <span className="text-2xl font-bold text-gray-900">
                              ${vehicle.price_per_day}
                            </span>
                            <span className="text-gray-500">{t('myVehicles.perDay')}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`text-sm ${vehicle.is_available ? "text-green-600" : "text-gray-500"}`}>
                              {vehicle.is_available ? t('myVehicles.available') : t('myVehicles.notAvailable')}
                            </span>
                            <Switch
                              checked={vehicle.is_available}
                              onCheckedChange={() => toggleAvailability(vehicle)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('myVehicles.deleteDialog')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('myVehicles.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('myVehicles.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}