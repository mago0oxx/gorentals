/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AddVehicle from './pages/AddVehicle';
import AdminDashboard from './pages/AdminDashboard';
import BookingDetails from './pages/BookingDetails';
import Browse from './pages/Browse';
import CreateBooking from './pages/CreateBooking';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import MyBookings from './pages/MyBookings';
import MyVehicles from './pages/MyVehicles';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Transactions from './pages/Transactions';
import VehicleCalendar from './pages/VehicleCalendar';
import VehicleDetails from './pages/VehicleDetails';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AddVehicle": AddVehicle,
    "AdminDashboard": AdminDashboard,
    "BookingDetails": BookingDetails,
    "Browse": Browse,
    "CreateBooking": CreateBooking,
    "Dashboard": Dashboard,
    "Landing": Landing,
    "MyBookings": MyBookings,
    "MyVehicles": MyVehicles,
    "Profile": Profile,
    "Register": Register,
    "Transactions": Transactions,
    "VehicleCalendar": VehicleCalendar,
    "VehicleDetails": VehicleDetails,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};