import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Protected } from './components/Ui';
import Home from './pages/Home';
import Booking from './pages/Booking';
import Account from './pages/Account';
import Invoice from './pages/Invoice';
import { ForgotPassword, Login, Register, ResetPassword } from './pages/Auth';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import AdminBookings from './admin/AdminBookings';
import AdminCalendar from './admin/AdminCalendar';
import AdminCatalog from './admin/AdminCatalog';
import AdminPayments from './admin/AdminPayments';
import AdminUsers from './admin/AdminUsers';
import { useEffect } from 'react';

function ScrollTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => { if (!hash) window.scrollTo(0, 0); }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Navbar />
      <div className="min-h-[70vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/account" element={<Protected><Account /></Protected>} />
          <Route path="/invoice/:id" element={<Protected><Invoice /></Protected>} />
          <Route path="/admin/login" element={<Login admin />} />
          <Route path="/admin" element={<Protected admin><AdminLayout /></Protected>}>
            <Route index element={<Dashboard />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="calendar" element={<AdminCalendar />} />
            <Route path="catalog" element={<AdminCatalog />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
          <Route path="*" element={<p className="p-20 text-center text-xl font-bold">404</p>} />
        </Routes>
      </div>
      <Footer />
    </>
  );
}
