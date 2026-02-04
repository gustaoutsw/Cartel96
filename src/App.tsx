import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';

// Pages
import Login from './pages/LoginPage';
import Booking from './pages/Booking';
import Agenda from './pages/Agenda';
import Inbox from './pages/Inbox';
import Clients from './pages/Clients';
import SettingsPage from './pages/SettingsPage';
import Dashboard from './pages/Dashboard';
import StockShop from './pages/StockShop'; // Estoque
import CRM from './pages/CRM'; // <--- AQUI: O Pipeline que estava faltando

// Components
import MainLayout from './components/MainLayout';
import SkeletonScreen from './components/SkeletonScreen';

const PageWrapper = ({ children }: { children: ReactNode }) => (
  <div className="w-full h-full">
    {children}
  </div>
);

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SkeletonScreen />;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default function App() {
  const { loading } = useAuth();

  if (loading) return <SkeletonScreen />;

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          {/* ROTAS PÚBLICAS */}
          <Route path="/login" element={<Login />} />
          <Route path="/agendar" element={<Booking />} />

          {/* ROTAS PROTEGIDAS */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PageWrapper><Dashboard /></PageWrapper>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/agenda"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PageWrapper><Agenda /></PageWrapper>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* --- ROTA DO PIPELINE CRM (ADICIONADA AGORA) --- */}
          <Route
            path="/crm"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PageWrapper><CRM /></PageWrapper>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          {/* ----------------------------------------------- */}

          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PageWrapper><Inbox /></PageWrapper>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PageWrapper><Clients /></PageWrapper>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* ROTA DE ESTOQUE/PRODUTOS */}
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PageWrapper><StockShop /></PageWrapper>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PageWrapper><SettingsPage /></PageWrapper>
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* REDIRECTS PADRÃO */}
          {/* Se a rota não existir, manda pra Agenda ou Dashboard */}
          <Route path="/" element={<Navigate to="/agenda" replace />} />
          <Route path="*" element={<Navigate to="/agenda" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}