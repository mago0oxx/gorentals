import Landing from './pages/Landing';
import Register from './pages/Register';
import Browse from './pages/Browse';
import VehicleDetails from './pages/VehicleDetails';
import CreateBooking from './pages/CreateBooking';
import BookingDetails from './pages/BookingDetails';
import Dashboard from './pages/Dashboard';
import AddVehicle from './pages/AddVehicle';
import MyVehicles from './pages/MyVehicles';
import VehicleCalendar from './pages/VehicleCalendar';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Transactions from './pages/Transactions';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Landing": Landing,
    "Register": Register,
    "Browse": Browse,
    "VehicleDetails": VehicleDetails,
    "CreateBooking": CreateBooking,
    "BookingDetails": BookingDetails,
    "Dashboard": Dashboard,
    "AddVehicle": AddVehicle,
    "MyVehicles": MyVehicles,
    "VehicleCalendar": VehicleCalendar,
    "Profile": Profile,
    "AdminDashboard": AdminDashboard,
    "Transactions": Transactions,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};