import { Navigate, Route, Routes } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { DashboardScreen } from './screens/Dashboard';
import { HistorialScreen } from './screens/Historial';
import { HoyScreen } from './screens/Hoy';
import { PerfilScreen } from './screens/Perfil';
import { ProfileProvider, useProfile } from './lib/useProfile';

function AppShell() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--color-ink-muted)' }}>
        Cargando...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <PerfilScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<HoyScreen />} />
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/historial" element={<HistorialScreen />} />
        <Route path="/perfil" element={<PerfilScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <ProfileProvider>
      <AppShell />
    </ProfileProvider>
  );
}

export default App;
