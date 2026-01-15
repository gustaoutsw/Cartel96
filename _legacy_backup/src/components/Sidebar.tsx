import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, BarChart2, Settings, Megaphone, Package, ShoppingBag, LogOut, Users, Wallet, MessageSquare, Lock, Eye, EyeOff, Crown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
    perfil: { nome: string; cargo: string } | null;
    onLogout: () => void;
    isSimulating?: boolean;
    onToggleSimulation?: () => void;
}

const MENU_ITEMS = [
    { icon: <Calendar size={20} />, label: 'Agenda', path: '/agenda', access: 'all' },
    { icon: <BarChart2 size={20} />, label: 'Métricas Ads', path: '/ads', access: 'admin' },
    { icon: <Wallet size={20} />, label: 'Financeiro', path: '/finance', access: 'admin' },
    { icon: <Users size={20} />, label: 'Equipe', path: '/team', access: 'admin' },
    { icon: <Crown size={20} />, label: 'Clube VIP', path: '/vip', access: 'all' },
    { icon: <Megaphone size={20} />, label: 'Campanhas', path: '/campaigns', access: 'admin' },
    { icon: <MessageSquare size={20} />, label: 'Mensagens', path: '/messages', access: 'all' },
    { icon: <Package size={20} />, label: 'Estoque', path: '/stock', access: 'admin' },
    { icon: <ShoppingBag size={20} />, label: 'Loja', path: '/shop', access: 'all' },
    { icon: <Settings size={20} />, label: 'Configurações', path: '/settings', access: 'all' },
];

export default function Sidebar({ perfil, onLogout, isSimulating = false, onToggleSimulation }: SidebarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin = useMemo(() => {
        const realRole = perfil?.cargo || 'barber';
        const effectiveRole = isSimulating ? 'barber' : realRole;
        return effectiveRole === 'dono' || effectiveRole === 'admin';
    }, [perfil, isSimulating]);

    return (
        <>
            {/* DESKTOP SIDEBAR */}
            <aside
                className={`hidden md:flex fixed left-0 top-0 h-screen bg-zinc-950 border-r border-[#d4af37]/10 backdrop-blur-3xl transition-all duration-300 ease-in-out z-[9999] flex-col ${isExpanded ? 'w-64' : 'w-20'}`}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >
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
                                    onClick={() => !isLocked && navigate(item.path)}
                                    disabled={isLocked}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 
                                        ${isActive ? 'bg-[#d4af37] text-black shadow-[0_10px_20px_-5px_rgba(212,175,55,0.3)]' : 'text-zinc-600 hover:text-[#d4af37] hover:bg-white/5'}
                                        ${isLocked ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:scale-[1.02]'}
                                    `}
                                >
                                    <span className="relative z-10 flex items-center justify-center shrink-0">
                                        {item.icon}
                                    </span>
                                    {isExpanded && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                            className="whitespace-nowrap font-black text-[10px] uppercase tracking-widest"
                                        >
                                            {item.label}
                                        </motion.span>
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
                            {perfil?.nome ? perfil.nome.charAt(0).toUpperCase() : 'U'}
                            {isSimulating && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-black animate-pulse shadow-[0_0_8px_#3b82f6]" />}
                        </div>

                        {isExpanded && (
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-white uppercase tracking-tight truncate">{perfil?.nome || 'Usuário'}</p>
                                <button onClick={onLogout} className="flex items-center gap-1 text-[8px] font-black text-red-500 hover:text-red-400 transition-colors uppercase mt-0.5">
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

            {/* MOBILE BOTTOM NAV */}
            <nav className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[24px] flex items-center justify-around px-2 z-[9999] shadow-2xl">
                {MENU_ITEMS.slice(0, 5).map((item, idx) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={idx}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-[#d4af37] scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                            <div className={`p-2.5 rounded-xl transition-all ${isActive ? 'bg-[#d4af37]/20 border border-[#d4af37]/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]' : ''}`}>
                                {item.icon}
                            </div>
                        </button>
                    );
                })}
            </nav>
        </>
    );
}
