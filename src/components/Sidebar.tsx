import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, LogOut, Lock, Eye, EyeOff, MessageSquare, Users, LayoutDashboard, Settings, X, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Helper to clear everything
const handleLogout = async (navigate: any) => {
    try {
        await supabase.auth.signOut();
        localStorage.clear();
        navigate('/login');
    } catch (e) {
        console.error('Logout error:', e);
        navigate('/login');
    }
};

interface SidebarProps {
    perfil: { nome: string; cargo: string } | null;
    onLogout?: () => void;
    isSimulating?: boolean;
    onToggleSimulation?: () => void;
    isOpen: boolean;    // REQUIRED
    onClose: () => void; // REQUIRED
}

const MENU_ITEMS = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard', access: 'admin' },
    { icon: <Calendar size={20} />, label: 'Agenda', path: '/agenda', access: 'all' },
    { icon: <Users size={20} />, label: 'Clientes', path: '/clients', access: 'all' },
    { icon: <MessageSquare size={20} />, label: 'Mensagens', path: '/inbox', access: 'all' },
    { icon: <Settings size={20} />, label: 'Configurações', path: '/configuracoes', access: 'all' },
];

export default function Sidebar({
    perfil,
    onLogout,
    isSimulating = false,
    onToggleSimulation,
    isOpen,
    onClose
}: SidebarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const fetchUserName = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('perfis').select('nome').eq('user_id', user.id).single();
                if (data) {
                    setUserName(data.nome);
                }
            }
        };
        fetchUserName();
    }, []);

    const onDirectLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            handleLogout(navigate);
        }
    };

    const isAdmin = useMemo(() => {
        const realRole = perfil?.cargo || 'barber';
        const effectiveRole = isSimulating ? 'barber' : realRole;
        return effectiveRole === 'dono' || effectiveRole === 'admin';
    }, [perfil, isSimulating]);

    return (
        <>
            {/* MOBILE BACKDROP - Only renders if open on mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* SIDEBAR CONTAINER */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 h-screen bg-zinc-950 border-r border-[#d4af37]/10 backdrop-blur-3xl 
                    transform transition-transform duration-300 ease-in-out flex flex-col
                    md:translate-x-0 md:static md:flex 
                    ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} 
                    ${isExpanded ? 'md:w-64' : 'md:w-20'}
                    w-64
                `}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="md:hidden absolute top-4 right-4 text-zinc-400 hover:text-white p-2 z-50"
                >
                    <X size={24} />
                </button>

                <div className="h-24 flex items-center justify-center border-b border-zinc-900/50 relative overflow-hidden shrink-0">
                    <div className={`transition-all duration-500 ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-75 absolute'}`}>
                        <h2 className="text-xl font-serif font-black text-[#d4af37] tracking-tighter drop-shadow-2xl italic">CARTEL 96</h2>
                    </div>
                    <div className={`transition-all duration-500 ${isExpanded ? 'opacity-0 scale-75 absolute' : 'opacity-100 scale-100'}`}>
                        <span className="text-2xl font-serif font-black text-[#d4af37] italic">C</span>
                    </div>
                </div>

                <nav className="flex-1 py-6 flex flex-col gap-1 px-3 overflow-y-auto overflow-x-hidden scrollbar-hide">
                    {MENU_ITEMS.map((item, idx) => {
                        const isLocked = item.access === 'admin' && !isAdmin;
                        const isActive = location.pathname === item.path;

                        return (
                            <div key={idx} className="relative group/item">
                                <button
                                    onClick={() => {
                                        if (!isLocked) {
                                            navigate(item.path);
                                            // Close on mobile
                                            if (window.innerWidth < 768) onClose();
                                        }
                                    }}
                                    disabled={isLocked}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 
                                    ${isActive ? 'bg-[#d4af37] text-black shadow-[0_10px_20px_-5px_rgba(212,175,55,0.3)]' : 'text-zinc-600 hover:text-[#d4af37] hover:bg-white/5'}
                                    ${isLocked ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:scale-[1.02]'}
                                `}
                                >
                                    <span className="relative z-10 flex items-center justify-center shrink-0">
                                        {item.icon}
                                    </span>

                                    {(isExpanded || window.innerWidth < 768) ? (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                            className="whitespace-nowrap font-black text-[10px] uppercase tracking-widest pl-2"
                                        >
                                            {item.label}
                                        </motion.span>
                                    ) : (
                                        <span className="sr-only">{item.label}</span>
                                    )}

                                    {isLocked && isExpanded && <Lock size={12} className="ml-auto text-zinc-800" />}
                                </button>
                            </div>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-900 bg-black/40 backdrop-blur-md shrink-0">
                    <div className={`flex items-center gap-3 ${isExpanded ? 'justify-start' : 'justify-center'}`}>
                        <div className={`relative w-10 h-10 rounded-2xl bg-zinc-900 border flex items-center justify-center text-[#d4af37] font-black shrink-0 transition-all duration-300
                        ${(isAdmin) ? 'border-[#d4af37]/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'border-zinc-800'}
                    `}>
                            {userName ? userName.charAt(0).toUpperCase() : (perfil?.nome ? perfil.nome.charAt(0).toUpperCase() : 'U')}
                            {isSimulating && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-black animate-pulse shadow-[0_0_8px_#3b82f6]" />}
                        </div>

                        {(isExpanded || window.innerWidth < 768) && (
                            <div className={`flex-1 min-w-0 ${!isExpanded ? 'md:hidden' : ''}`}>
                                <p className="text-[10px] font-black text-white uppercase tracking-tight truncate">{userName || perfil?.nome || 'Carregando...'}</p>
                                <button
                                    onClick={onDirectLogout}
                                    className="cursor-pointer hover:opacity-80 flex items-center gap-1 text-[8px] font-black text-red-500 hover:text-red-400 transition-colors uppercase mt-0.5"
                                >
                                    <LogOut size={10} /> Sair do Painel
                                </button>
                            </div>
                        )}

                        {isExpanded && (isAdmin || isSimulating) && onToggleSimulation && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleSimulation(); }}
                                className={`p-2 rounded-xl transition-all ${isSimulating ? 'text-blue-400 bg-blue-900/20 border border-blue-900/30' : 'text-zinc-600 hover:text-white hover:bg-zinc-900'}`}
                                title={isSimulating ? "Sair da Simulação" : "Modo Barbeiro"}
                            >
                                {isSimulating ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
