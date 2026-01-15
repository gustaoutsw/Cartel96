import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/login';
import Agenda from './pages/Agenda';
import AdsDashboard from './pages/AdsDashboard';
import CRM from './pages/CRM';
import Settings from './pages/Settings';
import StockShop from './pages/StockShop';
import Team from './pages/Team';
import Finance from './pages/Finance';
import Messages from './pages/Messages';
import VIPClub from './pages/VIPClub';

// Components
import Sidebar from './components/Sidebar';
import SkeletonScreen from './components/SkeletonScreen';

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.02 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

export default function App() {
  const [session, setSession] = useState<any>({ user: { email: 'gustavo@cartel96.com' } });
  const [loading] = useState(false);
  const [userProfile] = useState<{ nome: string; cargo: string } | null>({
    nome: 'Gustavo',
    cargo: 'dono'
  });
  const [isSimulatingBarber, setIsSimulatingBarber] = useState(false);

  const handleLogout = () => setSession(null);

  if (loading) return <SkeletonScreen />;

  if (!session) return <Login />;

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-zinc-950 text-white font-sans selection:bg-[#d4af37]/30">
        {/* SIDEBAR CONTAINER */}
        <Sidebar
          perfil={userProfile}
          onLogout={handleLogout}
          isSimulating={isSimulatingBarber}
          onToggleSimulation={() => setIsSimulatingBarber(!isSimulatingBarber)}
        />

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 transition-all duration-300 md:pl-20">
          <div className="max-w-[1600px] mx-auto p-4 md:p-8 pb-32 md:pb-8">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
                <Route path="/agenda" element={<PageWrapper><Agenda /></PageWrapper>} />
                <Route path="/ads" element={<PageWrapper><AdsDashboard /></PageWrapper>} />
                <Route path="/finance" element={<PageWrapper><Finance /></PageWrapper>} />
                <Route path="/team" element={<PageWrapper><Team /></PageWrapper>} />
                <Route path="/vip" element={<PageWrapper><VIPClub /></PageWrapper>} />
                <Route path="/campaigns" element={<PageWrapper><CRM /></PageWrapper>} />
                <Route path="/messages" element={<PageWrapper><Messages /></PageWrapper>} />
                <Route path="/stock" element={<PageWrapper><StockShop /></PageWrapper>} />
                <Route path="/shop" element={<PageWrapper><StockShop /></PageWrapper>} />
                <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}