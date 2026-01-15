import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, Users, Scissors, TrendingUp, Calendar, Zap, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const revenueData = [
    { name: 'Seg', valor: 2100 },
    { name: 'Ter', valor: 1800 },
    { name: 'Qua', valor: 2400 },
    { name: 'Qui', valor: 2800 },
    { name: 'Sex', valor: 3500 },
    { name: 'Sáb', valor: 4200 },
    { name: 'Dom', valor: 1500 },
];

const topPerformers = [
    { name: 'Gustavo Silva', services: 142, revenue: 8400, avatar: 'GS' },
    { name: 'Lucas Ferreira', services: 128, revenue: 7200, avatar: 'LF' },
    { name: 'Beto Silva', services: 95, revenue: 5100, avatar: 'BS' },
];

export default function Dashboard() {
    const navigate = useNavigate();

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col gap-2">
                <h1 className="text-4xl font-serif font-black text-white tracking-tighter uppercase drop-shadow-2xl">
                    Strategic <span className="text-[#d4af37]">Overview</span>
                </h1>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Business Inteligence & Performance</p>
            </header>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <KpiCard
                    title="Faturamento Semanal"
                    value="R$ 18.250"
                    trend="+14%"
                    icon={<DollarSign size={20} />}
                    onClick={() => navigate('/finance')}
                />
                <KpiCard
                    title="Atendimentos"
                    value="342"
                    trend="+8%"
                    icon={<Scissors size={20} />}
                    onClick={() => navigate('/agenda')}
                />
                <KpiCard
                    title="Novos Clientes"
                    value="64"
                    trend="+22%"
                    icon={<Users size={20} />}
                    onClick={() => navigate('/campaigns')}
                />
                <KpiCard
                    title="Ticket Médio"
                    value="R$ 124"
                    trend="+5.2%"
                    icon={<TrendingUp size={20} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* REVENUE CHART */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-8 bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/80 rounded-[40px] p-10 shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-40 bg-[#d4af37]/5 rounded-full blur-[100px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
                    <h3 className="text-xl font-serif font-black text-white mb-10 flex items-center justify-between">
                        Fluxo de Receita
                        <span className="text-[9px] bg-white/5 border border-white/10 text-zinc-500 px-3 py-1 rounded-full font-black uppercase tracking-widest italic">Live Stream</span>
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(212,175,55,0.05)' }}
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                                    itemStyle={{ color: '#d4af37', fontWeight: 'black' }}
                                />
                                <Bar dataKey="valor" radius={[12, 12, 0, 0]}>
                                    {revenueData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 5 ? '#d4af37' : '#27272a'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* TOP PERFORMERS */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="lg:col-span-4 bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/80 rounded-[40px] p-10 shadow-2xl"
                >
                    <h3 className="text-xl font-serif font-black text-white mb-10 uppercase">High Performers</h3>
                    <div className="space-y-6">
                        {topPerformers.map((performer, idx) => (
                            <div key={idx} className="flex items-center justify-between p-5 bg-black/40 border border-zinc-900 rounded-[32px] group hover:border-[#d4af37]/30 transition-all cursor-pointer" onClick={() => navigate('/team')}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-[#d4af37] font-black italic border border-zinc-800 shadow-inner group-hover:border-[#d4af37]/50 transition-all">
                                        {performer.avatar}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-[#d4af37] transition-all">{performer.name}</p>
                                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1">{performer.services} Atendimentos</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-white italic">R$ {performer.revenue}</p>
                                    <div className="flex gap-0.5 mt-1 justify-end">
                                        {[1, 2, 3].map(i => <Star key={i} size={8} className="text-[#d4af37] fill-[#d4af37]" />)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => navigate('/team')} className="w-full mt-10 py-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white hover:border-zinc-500 transition-all flex items-center justify-center gap-3">
                        Full Leaderboard <TrendingUp size={14} />
                    </button>
                </motion.div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ActionCard title="Novo Agendamento" icon={<Calendar size={20} />} color="bg-emerald-500" onClick={() => navigate('/agenda')} />
                <ActionCard title="Registrar Venda" icon={<Zap size={20} />} color="bg-[#d4af37]" onClick={() => navigate('/shop')} />
                <ActionCard title="Abrir Concierge" icon={<Users size={20} />} color="bg-blue-500" onClick={() => navigate('/messages')} />
            </div>
        </div>
    );
}

function KpiCard({ title, value, trend, icon, onClick }: { title: string, value: string, trend: string, icon: React.ReactNode, onClick?: () => void }) {
    return (
        <motion.div
            whileHover={{ y: -8 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 p-8 rounded-[32px] group transition-all duration-300 shadow-xl relative overflow-hidden ${onClick ? 'cursor-pointer hover:border-[#d4af37]/40' : ''}`}
        >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                {icon}
            </div>
            <div className="flex justify-between items-start mb-6">
                <div className="bg-black/50 p-4 rounded-2xl border border-zinc-800 group-hover:border-[#d4af37]/40 transition-all text-[#d4af37]">
                    {icon}
                </div>
                <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full italic">{trend}</span>
            </div>
            <div>
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{title}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-white tracking-tighter italic">{value}</p>
                    {onClick && <TrendingUp size={12} className="text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
            </div>
        </motion.div>
    );
}

function ActionCard({ title, icon, color, onClick }: { title: string, icon: any, color: string, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="p-8 bg-zinc-900/20 border border-zinc-900 rounded-[32px] flex items-center gap-6 hover:bg-zinc-900/40 hover:border-[#d4af37]/30 transition-all group shadow-xl w-full text-left"
        >
            <div className={`p-4 rounded-2xl ${color} text-black group-hover:scale-110 transition-transform shadow-lg`}>
                {icon}
            </div>
            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest group-hover:text-white transition-colors">{title}</span>
        </button>
    );
}
