import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
// Error pages
import Forbidden403 from './pages/errors/Forbidden403';
import Unauthorized401 from './pages/errors/Unauthorized401';
import ServerError500 from './pages/errors/ServerError500';
import Maintenance503 from './pages/errors/Maintenance503';
import NotFound404 from './pages/errors/NotFound404';
// Dev test menu
import ErrorTestMenu from './pages/ErrorTestMenu';

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

          {/* Rutas de Error - Acceso directo para pruebas */}
          <Route path="/404" element={<NotFound404 />} />
          <Route path="/403" element={<Forbidden403 />} />
          <Route path="/401" element={<Unauthorized401 />} />
          <Route path="/500" element={<ServerError500 />} />
          <Route path="/503" element={<Maintenance503 />} />

          {/* Página de pruebas de errores (solo desarrollo) */}
          <Route path="/test-errors" element={<ErrorTestMenu />} />

          {/* Rutas Protegidas (Requieren Token) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/reservas" element={<Reservations />} /> 
            <Route path="/deudores" element={<Deudores />} />
            <Route path="/socios" element={<Socios />} />
            <Route path="/pagos" element={<PagosCuotas />} />
          </Route>

          {/* 404 - Página no encontrada (comodín) */}
          <Route path="*" element={<NotFound404 />} />
        </Routes>
        {/* Menú de pruebas flotante - controlado por guard clause en el componente */}
        <ErrorTestMenu />
      </BrowserRouter>
    </AuthProvider>
  );
}