import Landing from './pages/Landing';
import Register from './pages/Register';
import Browse from './pages/Browse';
import VehicleDetails from './pages/VehicleDetails';
import CreateBooking from './pages/CreateBooking';
import BookingDetails from './pages/BookingDetails';
import Dashboard from './pages/Dashboard';


export const PAGES = {
    "Landing": Landing,
    "Register": Register,
    "Browse": Browse,
    "VehicleDetails": VehicleDetails,
    "CreateBooking": CreateBooking,
    "BookingDetails": BookingDetails,
    "Dashboard": Dashboard,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
};