import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Cpu, Save, Plus, ToggleLeft, ToggleRight, Check, Copy, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface Barber {
    id: number;
    name: string;
    specialty: string;
    active: boolean;
    commission: number;
    avatar: string;
}

const INITIAL_BARBERS: Barber[] = [
    { id: 1, name: "Gustavo Silva", specialty: "Master Barber", active: true, commission: 50, avatar: "GS" },
    { id: 2, name: "Lucas Ferreira", specialty: "Barba Expert", active: true, commission: 45, avatar: "LF" },
];

export default function Settings() {
    const [barbers, setBarbers] = useState<Barber[]>(INITIAL_BARBERS);
    const [apiLogs, setApiLogs] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [newBarberName, setNewBarberName] = useState('');

    useEffect(() => {
        const fetchTeam = async () => {
            const { data } = await supabase.from('perfis').select('*').eq('cargo', 'barber');
            if (data && data.length > 0) {
                setBarbers(data.map((p: any) => ({
                    id: p.id,
                    name: p.nome,
                    specialty: p.especialidade || 'Master Barber',
                    active: true,
                    commission: p.comissao_pct || 50,
                    avatar: p.nome.substring(0, 2).toUpperCase()
                })));
            }
        };
        fetchTeam();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const time = format(new Date(), "HH:mm:ss");
            setApiLogs(prev => [`[${time}] System Heartbeat: OK`, ...prev.slice(0, 3)]);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const toggleBarber = (id: number) => {
        setBarbers(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
        setHasChanges(true);
    };

    return (
        <div className="space-y-10 pb-32">
            <header>
                <h1 className="text-4xl font-serif font-black text-white tracking-tighter uppercase drop-shadow-2xl mb-1">
                    Master <span className="text-[#d4af37]">Config</span>
                </h1>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Engine & Crew Management</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">

                {/* 1. CREW MANAGEMENT */}
                <motion.section
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className="bg-zinc-900/30 backdrop-blur-xl rounded-[40px] border border-zinc-800/80 p-8 shadow-2xl"
                >
                    <h3 className="text-xl font-serif font-black text-white uppercase mb-8 flex items-center gap-3">
                        Squad Control <User size={18} className="text-[#d4af37]" />
                    </h3>

                    <div className="flex gap-4 mb-10">
                        <input
                            value={newBarberName} onChange={e => setNewBarberName(e.target.value)}
                            placeholder="Add identity to crew..."
                            className="flex-1 bg-black/40 border border-zinc-800 rounded-2xl px-6 text-xs font-bold outline-none focus:border-[#d4af37]/40 transition-all placeholder:text-zinc-700 shadow-inner text-white"
                        />
                        <button className="bg-[#d4af37] text-black p-4 rounded-2xl shadow-lg hover:scale-105 transition-transform active:scale-95">
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {barbers.map(barber => (
                            <div key={barber.id} className="p-6 bg-black/40 border border-zinc-800 rounded-[32px] flex items-center justify-between group hover:border-[#d4af37]/20 transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-[#d4af37] font-black text-xs border border-zinc-800 group-hover:border-[#d4af37]/30 transition-all">
                                        {barber.avatar}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-[#d4af37] transition-all">{barber.name}</p>
                                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1">{barber.specialty}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-black px-4 py-2 rounded-xl border border-zinc-800 focus-within:border-[#d4af37]/40 transition-all">
                                        <span className="text-[10px] font-black text-zinc-600">%</span>
                                        <input
                                            type="number" value={barber.commission}
                                            className="w-10 bg-transparent text-sm font-black text-white text-right outline-none"
                                            onChange={(e) => {
                                                const newVal = Number(e.target.value);
                                                setBarbers(prev => prev.map(b => b.id === barber.id ? { ...b, commission: newVal } : b));
                                                setHasChanges(true);
                                            }}
                                        />
                                    </div>
                                    <button onClick={() => toggleBarber(barber.id)} className={`transition-all ${barber.active ? 'text-emerald-500' : 'text-zinc-800'}`}>
                                        {barber.active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* 2. SYSTEM ENGINE */}
                <div className="flex flex-col gap-10">

                    <motion.section
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        className="bg-zinc-900/30 backdrop-blur-xl rounded-[40px] border border-zinc-800/80 p-8 shadow-2xl"
                    >
                        <h3 className="text-xl font-serif font-black text-white uppercase mb-8 flex items-center gap-3">
                            Security Protocol <Shield size={18} className="text-[#d4af37]" />
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-5 bg-black/40 rounded-[24px] border border-zinc-900">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                        <Check size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-white uppercase italic">Security Shield</p>
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">RSA 4096 Protection Active</p>
                                    </div>
                                </div>
                                <button className="text-[9px] font-black uppercase text-[#d4af37] bg-[#d4af37]/10 px-3 py-1.5 rounded-lg border border-[#d4af37]/20">LOCK</button>
                            </div>
                            <button className="w-full py-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white hover:border-zinc-700 transition-all flex items-center justify-center gap-3">
                                <Lock size={14} /> Reset Master Password
                            </button>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        className="bg-zinc-900/30 backdrop-blur-xl rounded-[40px] border border-zinc-800/80 p-8 shadow-2xl flex-1"
                    >
                        <h3 className="text-xl font-serif font-black text-white uppercase mb-8 flex items-center gap-3">
                            API Connect <Cpu size={18} className="text-[#d4af37]" />
                        </h3>
                        <div className="space-y-6">
                            <div className="bg-black p-5 rounded-[24px] border border-zinc-950 shadow-inner font-mono text-[10px] min-h-[120px]">
                                <div className="flex justify-between items-center mb-4 opacity-40">
                                    <span className="uppercase tracking-widest">Live Engine Stream</span>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                                </div>
                                <div className="space-y-1.5 overflow-hidden">
                                    {apiLogs.map((log, i) => (
                                        <p key={i} className="text-emerald-500/60 truncate italic">{log}</p>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1 bg-black/40 border border-zinc-800 px-5 py-3 rounded-2xl text-[10px] font-mono text-zinc-600 flex items-center overflow-hidden italic truncate">
                                    sk_live_•••••••••••••9696
                                </div>
                                <button className="p-3 bg-zinc-900 hover:bg-[#d4af37] hover:text-black border border-zinc-800 rounded-2xl transition-all shadow-lg active:scale-95">
                                    <Copy size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.section>
                </div>
            </div>

            {/* SAVE ACTION HUD */}
            <AnimatePresence>
                {hasChanges && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-10 left-0 right-0 z-50 flex justify-center pointer-events-none px-6"
                    >
                        <button
                            onClick={() => setHasChanges(false)}
                            className="pointer-events-auto flex items-center gap-4 bg-[#d4af37] text-black px-12 py-5 rounded-[32px] font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_-10px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all text-sm italic"
                        >
                            <Save size={20} /> Save Engine Config
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
