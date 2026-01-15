import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            // 1. Kill session in backend
            await signOut();

            // 2. Clear LocalStorage
            localStorage.clear();

            // 3. Redirect immediately
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
            // Fallback redirect even if error
            navigate('/login');
        }
    };

    // Sidebar needs perfil object. Provide fallback if profile is loading or null.
    // The previous App.tsx had hardcoded { nome: 'User', cargo: 'barber' }
    // We try to use real profile, defaulting to User.
    const sidebarProfile = profile ? {
        nome: profile.nome || 'User',
        cargo: profile.cargo || 'barber'
    } : {
        nome: 'User',
        cargo: 'barber'
    };

    return (
        <div className="flex min-h-screen bg-zinc-950 text-white font-sans selection:bg-[#d4af37]/30">
            <Sidebar
                perfil={sidebarProfile}
                onLogout={handleLogout}
            />
            <main className="flex-1 transition-all duration-300 md:pl-20">
                <div className="max-w-[1600px] mx-auto p-4 md:p-8 pb-32 md:pb-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
