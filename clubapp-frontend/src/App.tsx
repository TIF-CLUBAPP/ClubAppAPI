import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';

export default function App() {
  return (
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
}