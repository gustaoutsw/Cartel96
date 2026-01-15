import { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, Gift, TrendingUp, History, Send, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

// --- TYPES & MOCK ---
interface Reward {
    id: number;
    title: string;
    cost: number;
    description: string;
    icon: any;
}

const REWARDS: Reward[] = [
    { id: 1, title: 'Corte Grátis', cost: 500, description: 'Um corte completo por nossa conta.', icon: <Sparkles size={20} /> },
    { id: 2, title: 'Hidratação Premium', cost: 350, description: 'Tratamento profundo para os fios.', icon: <Gift size={20} /> },
    { id: 3, title: 'Pomada Matte', cost: 150, description: 'Leve para casa nossa pomada exclusiva.', icon: <Gift size={20} /> },
];

const MOCK_RANKING = [
    { id: 1, name: 'Roberto Silva', points: 1250, tier: 'black', spend: 1250.00 },
    { id: 2, name: 'Carlos Eduardo', points: 980, tier: 'gold', spend: 980.00 },
    { id: 3, name: 'Felipe Costa', points: 850, tier: 'gold', spend: 850.00 },
    { id: 4, name: 'Bruno Mezenga', points: 720, tier: 'silver', spend: 720.00 },
    { id: 5, name: 'André Santos', points: 650, tier: 'silver', spend: 650.00 },
];

export default function VIPClub() {
    const navigate = useNavigate();
    const [points, setPoints] = useState(620); // User points mock
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Tier Logic
    const getTier = (pts: number) => {
        if (pts >= 1000) return { name: 'BLACK', color: 'bg-zinc-950 border-zinc-800 text-zinc-400', gradient: 'from-zinc-900 via-black to-zinc-900' };
        if (pts >= 750) return { name: 'GOLD', color: 'bg-[#d4af37] text-black', gradient: 'from-yellow-200 via-yellow-400 to-yellow-600' };
        if (pts >= 300) return { name: 'SILVER', color: 'bg-zinc-300 text-zinc-900', gradient: 'from-zinc-100 via-zinc-300 to-zinc-500' };
        return { name: 'BRONZE', color: 'bg-orange-700 text-orange-100', gradient: 'from-orange-700 via-orange-500 to-orange-800' };
    };

    const currentTier = getTier(points);
    const nextTierPoints = points < 300 ? 300 : points < 750 ? 750 : points < 1000 ? 1000 : 10000;
    const progress = Math.min((points / nextTierPoints) * 100, 100);

    const handleRedeem = (reward: Reward) => {
        if (points >= reward.cost) {
            setSelectedReward(reward);
            setShowSuccessModal(true);
            setPoints(prev => prev - reward.cost);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#d4af37', '#ffffff'] // Gold & White
            });
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <header className="flex justify-between items-end gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black text-white tracking-tighter uppercase drop-shadow-2xl mb-1">
                        Clube <span className="text-[#d4af37]">VIP</span>
                    </h1>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">Fidelidade e Recompensas</p>
                </div>
                <button
                    onClick={() => navigate('/messages')}
                    className="hidden md:flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-700 rounded-2xl hover:border-[#d4af37] text-zinc-300 hover:text-[#d4af37] font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95"
                >
                    <Send size={14} /> Enviar Saldo por WhatsApp
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* 3D VIRTUAL CARD */}
                <div className="flex flex-col gap-6">
                    <motion.div
                        initial={{ rotateY: 10, rotateX: 5 }}
                        whileHover={{ rotateY: 0, rotateX: 0, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`relative w-full h-72 rounded-[40px] p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden bg-gradient-to-br ${currentTier.gradient} border border-white/10`}
                    >
                        {/* Shiffing Glass reflections */}
                        <div className="absolute top-0 right-0 p-40 bg-white/5 rounded-full blur-3xl mix-blend-overlay -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                                        <Crown size={24} className="text-white" />
                                    </div>
                                    <span className="font-serif font-black tracking-[0.3em] text-white/90 text-sm uppercase">Cartel 96 Elite</span>
                                </div>
                                <span className="font-mono text-white/80 text-xl tracking-[0.2em] drop-shadow-md">•••• 9696</span>
                            </div>

                            <div>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Saldo de Pontos</p>
                                <h2 className="text-6xl font-black text-white tracking-tighter drop-shadow-lg">{points} <span className="text-2xl opacity-40 italic">PTS</span></h2>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-white/80 text-xs font-black uppercase tracking-widest mb-1">{currentTier.name} MEMBER</p>
                                    <p className="text-white text-lg font-serif font-black tracking-tight drop-shadow-sm uppercase">Gustavo Silva</p>
                                </div>
                                <div className="w-14 h-9 bg-gradient-to-r from-yellow-100 to-yellow-600 rounded-lg flex items-center justify-center opacity-90 border border-black/20 shadow-inner overflow-hidden">
                                    <div className="w-10 h-6 border border-black/10 rounded-sm bg-white/10 backdrop-blur-sm" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* PROGRESS BAR */}
                    <div className="bg-zinc-900/30 backdrop-blur-xl p-6 rounded-3xl border border-zinc-800 shadow-xl">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-4">
                            <span>Status: {currentTier.name}</span>
                            <span className="text-[#d4af37]">{points} / {nextTierPoints}</span>
                        </div>
                        <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                            <motion.div
                                initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                                className={`h-full rounded-full bg-gradient-to-r ${currentTier.gradient} shadow-[0_0_15px_rgba(212,175,55,0.3)]`}
                            />
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-4 text-center font-bold uppercase tracking-widest">
                            Faltam <span className="text-[#d4af37]">{nextTierPoints - points} pontos</span> para o próximo nível estratégico.
                        </p>
                    </div>
                </div>

                {/* REWARDS GRID */}
                <div className="flex flex-col h-full">
                    <h3 className="text-2xl font-serif font-black text-white uppercase mb-8 flex items-center gap-3">
                        Rewards <span className="text-[#d4af37]"><Gift size={20} /></span>
                    </h3>
                    <div className="space-y-6 flex-1">
                        {REWARDS.map(reward => {
                            const canRedeem = points >= reward.cost;
                            return (
                                <div key={reward.id} className={`flex items-center justify-between p-6 rounded-[32px] border transition-all group ${canRedeem ? 'bg-zinc-900/30 border-zinc-800 hover:border-[#d4af37]/30' : 'bg-zinc-950/40 border-zinc-900/50 opacity-50'}`}>
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${canRedeem ? 'bg-[#d4af37] text-black scale-100' : 'bg-zinc-800 text-zinc-600 scale-90'}`}>
                                            {reward.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-white group-hover:text-[#d4af37] transition-colors uppercase tracking-tight">{reward.title}</h4>
                                            <p className="text-xs text-zinc-500 font-bold mt-1">{reward.description}</p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-lg font-black text-white mb-2">{reward.cost} <span className="text-[10px] opacity-40">PTS</span></p>
                                        <button
                                            onClick={() => handleRedeem(reward)}
                                            disabled={!canRedeem}
                                            className={`text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-xl transition-all ${canRedeem ? 'bg-white text-black hover:bg-[#d4af37] hover:scale-105 shadow-xl active:scale-95' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                                        >
                                            {canRedeem ? 'RESGATAR' : 'BLOQUEADO'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* TOP 10 & HISTORY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* RANKING */}
                <div className="md:col-span-2 bg-zinc-900/20 border border-zinc-800/80 rounded-[40px] p-8 backdrop-blur-md shadow-2xl">
                    <h3 className="text-xl font-serif font-black text-white uppercase mb-8 flex items-center gap-3">
                        Líderes de Gasto <TrendingUp size={18} className="text-[#d4af37]" />
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-3">
                            <thead>
                                <tr className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">
                                    <th className="pb-4 pl-4">#</th>
                                    <th className="pb-4">Membro</th>
                                    <th className="pb-4">Nível</th>
                                    <th className="pb-4 text-right pr-4">Investimento</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_RANKING.map((client, idx) => (
                                    <tr key={client.id} className="group hover:bg-[#d4af37]/5 transition-all duration-300">
                                        <td className="py-4 pl-4 font-black text-zinc-700 italic group-hover:text-[#d4af37]">{idx + 1}</td>
                                        <td className="py-4 font-black text-white group-hover:text-[#d4af37] transition-colors">{client.name}</td>
                                        <td className="py-4">
                                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${client.tier === 'black' ? 'bg-zinc-950 text-white border border-zinc-800' : client.tier === 'gold' ? 'bg-[#d4af37] text-black shadow-[0_0_10px_#d4af37]' : 'bg-zinc-300 text-zinc-900'}`}>
                                                {client.tier}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right pr-4 text-white font-black">R$ {client.spend.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* HISTORY */}
                <div className="bg-orange-900/10 border border-[#d4af37]/10 rounded-[40px] p-8 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
                    <h3 className="text-xl font-serif font-black text-white uppercase mb-8 flex items-center gap-3">
                        History <History size={18} className="text-zinc-500" />
                    </h3>
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4 items-center group/item cursor-pointer">
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#d4af37] group-hover/item:border-[#d4af37] transition-colors"><CheckCircle size={16} /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-white group-hover/item:text-[#d4af37] transition-colors truncate">Resgate Efetuado</p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-0.5">Membro VIP #0{i}5</p>
                                </div>
                                <span className="text-[9px] text-zinc-700 font-black italic tracking-tighter shrink-0">{i}d atrás</span>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-10 py-3 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white hover:border-zinc-700 transition-all">Ver Histórico Detalhado</button>
                </div>
            </div>

            {/* WAX SEAL MODAL */}
            <AnimatePresence>
                {showSuccessModal && selectedReward && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                            onClick={() => setShowSuccessModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, rotate: -5 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.8, opacity: 0 }}
                            className="relative bg-[#09090b] border border-[#d4af37]/40 p-12 rounded-[40px] max-w-sm w-full text-center shadow-[0_0_80px_rgba(212,175,55,0.2)] overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-28 h-28 bg-[#a82a2a] rounded-full flex items-center justify-center shadow-2xl border-4 border-[#8b1e1e] opacity-95 rotate-12 flex-col gap-0.5">
                                <span className="font-serif font-black text-[#601212] text-[10px] leading-none">OFFICIAL</span>
                                <span className="font-serif font-black text-[#601212] text-xs leading-none">C96</span>
                            </div>

                            <div className="mb-8 flex justify-center">
                                <div className="w-24 h-24 bg-[#d4af37]/10 rounded-[32px] flex items-center justify-center border-2 border-[#d4af37] text-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                                    <Sparkles size={48} />
                                </div>
                            </div>

                            <h2 className="text-3xl font-serif font-black text-white mb-3 uppercase tracking-tight">Confirmed</h2>
                            <p className="text-zinc-500 text-sm mb-8 font-bold">
                                Você resgatou <strong className="text-[#d4af37]">{selectedReward.title}</strong> com sucesso.
                            </p>

                            <div className="bg-black border border-zinc-800/80 p-5 rounded-[24px] mb-8 shadow-inner">
                                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-black mb-2">Voucher Code</p>
                                <p className="text-3xl font-mono font-black text-white tracking-[0.3em] drop-shadow-sm">#VIP-{Math.floor(Math.random() * 9000) + 1000}</p>
                            </div>

                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full py-4 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-[0_15px_30px_-5px_rgba(255,255,255,0.2)] transition-all active:scale-95 hover:bg-[#d4af37]"
                            >
                                FECHAR ENVELOPE
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
