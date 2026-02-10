import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Car, Calendar, DollarSign, Star, Plus, Settings, ChevronRight,
  TrendingUp, Clock, CheckCircle, MapPin, Bell, Receipt, MessageCircle
} from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import NotificationBell from "@/components/notifications/NotificationBell";
import EmptyState from "@/components/common/EmptyState";
import BookingCard from "@/components/booking/BookingCard";
import VehicleCard from "@/components/vehicles/VehicleCard";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/i18n/LanguageContext";
import PullToRefresh from "@/components/common/PullToRefresh";

export default function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeBookings: 0,
    totalEarnings: 0,
    avgRating: 0
  });
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
    
    if (!userData.user_type) {
      navigate(createPageUrl("Register"));
      return;
    }

    setUser(userData);

    if (userData.user_type === "owner") {
      // Load owner data
      const [ownerVehicles, ownerBookings] = await Promise.all([
        base44.entities.Vehicle.filter({ owner_email: userData.email }, "-created_date"),
        base44.entities.Booking.filter({ owner_email: userData.email }, "-created_date")
      ]);

      setVehicles(ownerVehicles);
      setBookings(ownerBookings);

      const activeBookingsCount = ownerBookings.filter(
        b => ["pending", "approved", "paid", "active"].includes(b.status)
      ).length;

      setStats({
        totalVehicles: ownerVehicles.length,
        activeBookings: activeBookingsCount,
        totalEarnings: userData.total_earnings || 0,
        avgRating: userData.average_rating || 0
      });
    } else {
      // Load renter data
      const renterBookings = await base44.entities.Booking.filter(
        { renter_email: userData.email },
        "-created_date"
      );

      setBookings(renterBookings);

      const activeBookingsCount = renterBookings.filter(
        b => ["pending", "approved", "paid", "active"].includes(b.status)
      ).length;

      setStats({
        activeBookings: activeBookingsCount,
        completedBookings: renterBookings.filter(b => b.status === "completed").length
      });
    }

    setIsLoading(false);
  };

  const handleRefresh = async () => {
    await loadData();
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" text={t('messages.loadingDashboard')} />;
  }

  if (!user) return null;

  const isOwner = user.user_type === "owner";
  const pendingBookings = bookings.filter(b => b.status === "pending");
  const activeBookings = bookings.filter(b => ["approved", "paid", "active"].includes(b.status));
  const pastBookings = bookings.filter(b => ["completed", "rejected", "cancelled"].includes(b.status));

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col gap-4">
            {/* User Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 md:w-16 md:h-16">
                  <AvatarImage src={user.profile_image} />
                  <AvatarFallback className="bg-teal-100 text-teal-700 text-lg md:text-xl">
                    {user.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                    {t('messages.hello')}, {user.full_name?.split(" ")[0]}
                  </h1>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                    {user.location || t('messages.location')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell userEmail={user.email} />
                <Link to={createPageUrl("Profile")} className="md:hidden">
                  <Button variant="ghost" size="icon" className="rounded-xl">
                    <Settings className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Action Buttons - Responsive Grid */}
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
              {!isOwner && (
                <Link to={createPageUrl("AddVehicle")} className="col-span-2 md:col-span-1">
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Publicar mi auto
                  </Button>
                </Link>
              )}
              {isOwner && (
                <Link to={createPageUrl("AddVehicle")} className="col-span-2 md:col-span-1">
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('messages.addVehicle')}
                  </Button>
                </Link>
              )}
              <Link to={createPageUrl("MyBookings")}>
                <Button variant="outline" className="w-full rounded-xl">
                  <Calendar className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">{isOwner ? t('messages.manage') : t('messages.bookings')}</span>
                </Button>
              </Link>
              <Link to={createPageUrl("Chat")}>
                <Button variant="outline" className="w-full rounded-xl">
                  <MessageCircle className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">{t('messages.messages')}</span>
                </Button>
              </Link>
              {isOwner && (
                <>
                  <Link to={createPageUrl("OwnerDashboard")}>
                    <Button variant="outline" className="w-full rounded-xl border-teal-200 text-teal-600 hover:bg-teal-50">
                      <Car className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">{t('messages.fullManagement')}</span>
                    </Button>
                  </Link>
                  <Link to={createPageUrl("OwnerEarnings")}>
                    <Button variant="outline" className="w-full rounded-xl">
                      <DollarSign className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">{t('messages.earnings')}</span>
                    </Button>
                  </Link>
                </>
              )}
              <Link to={createPageUrl("Transactions")} className="hidden md:block">
                <Button variant="outline" className="w-full rounded-xl">
                  <Receipt className="w-4 h-4 mr-2" />
                  {t('messages.transactions')}
                </Button>
              </Link>
              <Link to={createPageUrl("Profile")} className="hidden md:block">
                <Button variant="outline" className="w-full rounded-xl">
                  <Settings className="w-4 h-4 mr-2" />
                  {t('common.profile')}
                </Button>
              </Link>
              {!isOwner && (
                <Link to={createPageUrl("Browse")}>
                  <Button variant="outline" className="w-full rounded-xl">
                    <Car className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">{t('messages.searchVehicles')}</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className={`grid gap-4 mb-8 ${isOwner ? "md:grid-cols-4" : "md:grid-cols-2"}`}>
          {isOwner ? (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <Card className="border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{t('messages.myVehicles')}</p>
                        <p className="text-3xl font-bold">{stats.totalVehicles}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                        <Car className="w-6 h-6 text-teal-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{t('messages.activeBookings')}</p>
                        <p className="text-3xl font-bold">{stats.activeBookings}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{t('messages.totalEarnings')}</p>
                        <p className="text-3xl font-bold">${stats.totalEarnings.toFixed(0)}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{t('messages.rating')}</p>
                        <p className="text-3xl font-bold">{stats.avgRating.toFixed(1)}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Star className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <Card className="border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{t('messages.activeBookings')}</p>
                        <p className="text-3xl font-bold">{stats.activeBookings}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-teal-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{t('messages.completedBookings')}</p>
                        <p className="text-3xl font-bold">{stats.completedBookings}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>

        {/* Owner: Vehicles Section */}
        {isOwner && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{t('messages.myVehicles')}</h2>
              <Link to={createPageUrl("MyVehicles")}>
                <Button variant="ghost" className="text-teal-600 hover:text-teal-700">
                  {t('messages.viewAll')} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            {vehicles.length === 0 ? (
              <EmptyState
                icon={Car}
                title={t('messages.noVehiclesPublished')}
                description={t('messages.publishFirst')}
                actionLabel={t('messages.addVehicle')}
                actionLink="AddVehicle"
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.slice(0, 3).map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookings Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">{t('messages.bookings')}</h2>
          <Tabs defaultValue={pendingBookings.length > 0 ? "pending" : "active"}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="relative">
                {t('messages.pending')}
                {pendingBookings.length > 0 && (
                  <span className="ml-2 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                    {pendingBookings.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="active">{t('messages.active')}</TabsTrigger>
              <TabsTrigger value="history">{t('messages.history')}</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingBookings.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title={t('messages.noPending')}
                  description={isOwner 
                    ? t('messages.pendingDesc')
                    : t('messages.findVehicle')}
                />
              ) : (
                <div className="space-y-4">
                  {pendingBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      userType={user.user_type}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="active">
              {activeBookings.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title={t('messages.noActive')}
                  description={t('messages.activeDesc')}
                />
              ) : (
                <div className="space-y-4">
                  {activeBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      userType={user.user_type}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              {pastBookings.length === 0 ? (
                <EmptyState
                  icon={CheckCircle}
                  title={t('messages.noHistory')}
                  description={t('messages.historyDesc')}
                />
              ) : (
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      userType={user.user_type}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}