import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations'; 
import Deudores from './pages/Deudores';
import Socios from './pages/Socios';
import { PagosCuotas } from './pages/PagosCuotas';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Rutas Protegidas (Requieren Token) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/reservas" element={<Reservations />} /> 
            <Route path="/deudores" element={<Deudores />} />
            <Route path="/socios" element={<Socios />} />
            <Route path="/pagos" element={<PagosCuotas />} />
          </Route>

          {/* Redirección comodín */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}