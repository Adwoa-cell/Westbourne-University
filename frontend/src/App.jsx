
import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Public university pages
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Programmes from './pages/Programmes.jsx';
import Admissions from './pages/Admissions.jsx';
import CutOffPoints from './pages/CutOffPoints.jsx';
import News from './pages/News.jsx';
import Contact from './pages/Contact.jsx';
import NotFound from './pages/NotFound.jsx';

// Authentication pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import Account from './pages/Account.jsx';

// Administrator pages
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminProgrammes from './pages/AdminProgrammes.jsx';
import AdminApplications from './pages/AdminApplications.jsx';
import AdminStudents from './pages/AdminStudents.jsx';
import AdminCalendar from './pages/AdminCalendar.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <ScrollToTop />

      <Header />

      <main id="main">
        <Routes>
          {/* Public university pages */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/programmes" element={<Programmes />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/cut-off-points" element={<CutOffPoints />} />
          <Route path="/news" element={<News />} />
          <Route path="/contact" element={<Contact />} />

          {/* Authentication pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected account page */}
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />

          {/* Administrator dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['administrator']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Administrator Programmes Management */}
          <Route
            path="/admin/programmes"
            element={
              <ProtectedRoute allowedRoles={['administrator']}>
                <AdminProgrammes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute allowedRoles={['administrator']}>
                <AdminApplications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['administrator']}>
                <AdminStudents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/calendar"
            element={
              <ProtectedRoute allowedRoles={['administrator']}>
                <AdminCalendar />
              </ProtectedRoute>
            }
          />

          {/* 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}
