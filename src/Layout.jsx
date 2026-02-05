import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Car, User, LogOut, Shield, Search, LayoutDashboard, MapPin, Menu } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import ThemeToggle from "@/components/theme/ThemeToggle";
import BottomNav from "@/components/navigation/BottomNav";
import { useLanguage, LanguageProvider } from "@/components/i18n/LanguageContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

// Pages that don't show the navbar
const fullScreenPages = ["Landing", "Register", "Browse", "VehicleDetails", "CreateBooking", "BookingDetails", "AddVehicle", "MyVehicles", "VehicleCalendar", "Profile", "AdminDashboard", "LocalGuides"];

// Pages that show bottom navigation
const bottomNavPages = ["Browse", "Dashboard", "MyBookings", "Chat", "Profile", "LocalGuides"];

function LayoutContent({ children, currentPageName }) {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      const userData = await base44.auth.me();
      setUser(userData);
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl("Landing"));
  };

  // Full screen pages render without layout
  if (fullScreenPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-area-inset">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-50 safe-area-top">
        <div className="max-w-7xl mx-auto px-3 md:px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <Link to={createPageUrl("Landing")} className="flex items-center gap-2">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Car className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-400 dark:to-teal-500 bg-clip-text text-transparent hidden sm:block">GoRentals</span>
            </Link>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-6">
              <Link to={createPageUrl("Browse")} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2">
                <Search className="w-4 h-4" />
                {t('nav.browse')}
              </Link>
              <Link to={createPageUrl("LocalGuides")} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Guías Locales
              </Link>
              {user && (
                <Link to={createPageUrl("Dashboard")} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  {t('common.dashboard')}
                </Link>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-1 md:gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
              
              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <div className="flex flex-col gap-4 mt-8">
                    <Link 
                      to={createPageUrl("Browse")} 
                      className="flex items-center gap-3 text-gray-700 hover:text-teal-600 p-3 rounded-lg hover:bg-teal-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Search className="w-5 h-5" />
                      <span className="font-medium">{t('nav.browse')}</span>
                    </Link>
                    <Link 
                      to={createPageUrl("LocalGuides")} 
                      className="flex items-center gap-3 text-gray-700 hover:text-teal-600 p-3 rounded-lg hover:bg-teal-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MapPin className="w-5 h-5" />
                      <span className="font-medium">Guías Locales</span>
                    </Link>
                    {user && (
                      <>
                        <Link 
                          to={createPageUrl("Dashboard")} 
                          className="flex items-center gap-3 text-gray-700 hover:text-teal-600 p-3 rounded-lg hover:bg-teal-50"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-5 h-5" />
                          <span className="font-medium">{t('common.dashboard')}</span>
                        </Link>
                        <Link 
                          to={createPageUrl("Profile")} 
                          className="flex items-center gap-3 text-gray-700 hover:text-teal-600 p-3 rounded-lg hover:bg-teal-50"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <User className="w-5 h-5" />
                          <span className="font-medium">{t('common.profile')}</span>
                        </Link>
                        {user.role === "admin" && (
                          <Link 
                            to={createPageUrl("AdminDashboard")} 
                            className="flex items-center gap-3 text-gray-700 hover:text-teal-600 p-3 rounded-lg hover:bg-teal-50"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Shield className="w-5 h-5" />
                            <span className="font-medium">{t('common.admin')}</span>
                          </Link>
                        )}
                        <button 
                          onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                          className="flex items-center gap-3 text-red-600 hover:text-red-700 p-3 rounded-lg hover:bg-red-50 text-left w-full"
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="font-medium">{t('common.logout')}</span>
                        </button>
                      </>
                    )}
                    {!user && !isLoading && (
                      <div className="flex flex-col gap-2 pt-4">
                        <Link to={createPageUrl("Register")} onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full">
                            {t('common.login')}
                          </Button>
                        </Link>
                        <Link to={createPageUrl("Register")} onClick={() => setMobileMenuOpen(false)}>
                          <Button className="w-full bg-teal-600 hover:bg-teal-700">
                            {t('common.register')}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              
              <div className="hidden md:flex items-center gap-2">
              {!isLoading && user && (
                <NotificationBell userEmail={user.email} />
              )}
              {!isLoading && (
                user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.profile_image} />
                          <AvatarFallback className="bg-teal-100 text-teal-700">
                            {user.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5">
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Dashboard")} className="cursor-pointer">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          {t('common.dashboard')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Profile")} className="cursor-pointer">
                          <User className="w-4 h-4 mr-2" />
                          {t('common.profile')}
                        </Link>
                      </DropdownMenuItem>
                      {user.role === "admin" && (
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("AdminDashboard")} className="cursor-pointer">
                            <Shield className="w-4 h-4 mr-2" />
                            {t('common.admin')}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('common.logout')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link to={createPageUrl("Register")}>
                      <Button variant="ghost" className="rounded-xl">
                        {t('common.login')}
                      </Button>
                    </Link>
                    <Link to={createPageUrl("Register")}>
                      <Button className="bg-teal-600 hover:bg-teal-700 rounded-xl">
                        {t('common.register')}
                      </Button>
                    </Link>
                  </div>
                )
              )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className={bottomNavPages.includes(currentPageName) && user ? "pb-20" : ""}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {bottomNavPages.includes(currentPageName) && user && (
        <BottomNav user={user} />
      )}
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LayoutContent children={children} currentPageName={currentPageName} />
      </LanguageProvider>
    </ThemeProvider>
  );
}