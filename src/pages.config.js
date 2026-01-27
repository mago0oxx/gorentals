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
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
};