import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layout & Auth
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';

// Client Pages
import ClientDashboard from './pages/ClientDashboard';
import SubmitTransaction from './pages/SubmitTransaction';

// Clerk Pages
import ClerkDashboard from './pages/ClerkDashboard';
import ReviewTransaction from './pages/ReviewTransaction';
import ClerkHistory from './pages/ClerkHistory';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminTransactions from './pages/AdminTransactions';
import AdminUsers from './pages/AdminUsers';



function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected Routes inside Dashboard */}
          <Route element={<DashboardLayout />}>

            {/* CLIENT Routes */}
            <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
              <Route path="/dashboard" element={<ClientDashboard />} />
              <Route path="/submit" element={<SubmitTransaction />} />
            </Route>

            {/* CLERK Routes */}
            <Route element={<ProtectedRoute allowedRoles={['CLERK']} />}>
              <Route path="/review-queue" element={<ClerkDashboard />} />
              <Route path="/review/:id" element={<ReviewTransaction />} />
              <Route path="/clerk-history" element={<ClerkHistory />} />
            </Route>

            {/* ADMIN Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/transactions" element={<AdminTransactions />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>

          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
