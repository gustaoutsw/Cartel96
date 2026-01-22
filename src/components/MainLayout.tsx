import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut();
            localStorage.clear();
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
            navigate('/login');
        }
    };

    const sidebarProfile = profile ? {
        nome: profile.nome || 'User',
        cargo: profile.cargo || 'barber'
    } : {
        nome: 'User',
        cargo: 'barber'
    };

    return (
        <div className="flex min-h-screen bg-black text-white font-sans selection:bg-[#d4af37]/30">
            {/* MOBILE HEADER - Visible only on mobile */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 flex items-center justify-between px-4 z-40">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                >
                    <Menu size={24} />
                </button>
                <div className="flex-1 flex justify-center">
                    <h1 className="text-xl font-serif font-black text-[#d4af37] tracking-tighter italic">CARTEL 96</h1>
                </div>
                <div className="w-10"></div> {/* Spacer */}
            </header>

            {/* Sidebar with mobile state */}
            <Sidebar
                perfil={sidebarProfile}
                onLogout={handleLogout}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Main Content */}
            <main className="flex-1 transition-all duration-300 md:pl-20 w-full flex flex-col pt-16 md:pt-0 overflow-x-hidden">
                <div className="flex-1 w-full max-w-[1600px] mx-auto px-0 md:p-8 pb-0 md:pb-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
