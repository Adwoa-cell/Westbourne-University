
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { configured, loading, session, profile, profileError } = useAuth();
  const location = useLocation();

  if (!configured) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return <p className="status container" role="status">Loading...</p>;
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (allowedRoles?.length) {
    if (profileError) {
      return (
        <p className="status container" role="alert">
          Unable to verify your permissions. Please try again.
        </p>
      );
    }

    if (!profile) {
      return (
        <p className="status container" role="status">
          Verifying your permissions...
        </p>
      );
    }

    if (!allowedRoles.includes(profile.role)) {
      return <Navigate to="/account" replace />;
    }
  }

  return children;
}
