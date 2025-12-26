import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/common/Loader';
import { ROUTES } from '../utils/constants';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { RoleSelect } from '../pages/auth/RoleSelect';

// User Pages
import { Dashboard } from '../pages/user/Dashboard';
import { DistressCall } from '../pages/user/DistressCall';
import { Tracking } from '../pages/user/Tracking';
import { Profile } from '../pages/user/Profile';
import { Store } from '../pages/user/Store';

// Vet Pages
import { VetDashboard } from '../pages/vet/VetDashboard';
import { DistressList } from '../pages/vet/DistressList';
import { VetTracking } from '../pages/vet/VetTracking';
import { VetStore } from '../pages/vet/VetStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('user' | 'vet')[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'vet' ? ROUTES.VET_DASHBOARD : ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'vet' ? ROUTES.VET_DASHBOARD : ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route path={ROUTES.ROLE_SELECT} element={<RoleSelect />} />

      {/* User Routes */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DISTRESS_CALL}
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <DistressCall />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.TRACKING}
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <Tracking />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.STORE}
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <Store />
          </ProtectedRoute>
        }
      />

      {/* Vet Routes */}
      <Route
        path={ROUTES.VET_DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={['vet']}>
            <VetDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.VET_DISTRESS_LIST}
        element={
          <ProtectedRoute allowedRoles={['vet']}>
            <DistressList />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${ROUTES.VET_TRACKING}/:distressId`}
        element={
          <ProtectedRoute allowedRoles={['vet']}>
            <VetTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.VET_STORE}
        element={
          <ProtectedRoute allowedRoles={['vet']}>
            <VetStore />
          </ProtectedRoute>
        }
      />

      {/* Shared Routes */}
      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Default Route */}
      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
};
