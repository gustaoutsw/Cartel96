import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const performanceData = [
    { name: 'Sem 1', novosClientes: 12 },
    { name: 'Sem 2', novosClientes: 18 },
    { name: 'Sem 3', novosClientes: 15 },
    { name: 'Sem 4', novosClientes: 28 },
    { name: 'Sem 5', novosClientes: 35 },
    { name: 'Sem 6', novosClientes: 42 },
];

const budgetData = [
    { name: 'Reels', value: 600 },
    { name: 'Stories', value: 300 },
    { name: 'Feed', value: 100 },
];

const COLORS = ['#d4af37', '#b08d55', '#3f3f46'];

export default function AdsDashboard() {
    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col gap-2">
                <h1 className="text-4xl font-serif font-black text-white tracking-tighter uppercase drop-shadow-2xl">
                    Ads <span className="text-[#d4af37]">Performance</span>
                </h1>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Campaign Analytics & Growth</p>
            </header>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <KpiCard title="Investimento" value="R$ 1.250" trend="+12%" isPositive={true} icon={<DollarSign size={20} />} />
                <KpiCard title="Alcance Brut" value="15.4k" trend="+8.5%" isPositive={true} icon={<Users size={20} />} />
                <KpiCard title="CPC Médio" value="R$ 0,45" trend="-2%" isPositive={true} icon={<DollarSign size={20} />} />
                <KpiCard title="ROAS Real" value="5.2x" trend="+0.8" isPositive={true} icon={<TrendingUp size={20} />} />
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/80 rounded-[40px] p-10 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-40 bg-[#d4af37]/5 rounded-full blur-[100px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
                    <h3 className="text-xl font-serif font-black text-white mb-10 flex items-center justify-between">
                        Crescimento do Público
                        <span className="text-[10px] bg-white/5 border border-white/10 text-zinc-500 px-3 py-1 rounded-full font-black uppercase tracking-widest italic">Live Stream</span>
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} strokeOpacity={0.2} />
                                <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                                    itemStyle={{ color: '#d4af37', fontWeight: 'black' }}
                                    labelStyle={{ color: '#52525b', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}
                                />
                                <Area type="monotone" dataKey="novosClientes" stroke="#d4af37" strokeWidth={4} fillOpacity={1} fill="url(#colorGrowth)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/80 rounded-[40px] p-10 flex flex-col items-center justify-center shadow-2xl">
                    <h3 className="text-xl font-serif font-black text-white mb-2 w-full text-left uppercase">Allocation</h3>
                    <p className="text-zinc-500 text-[10px] font-black w-full text-left mb-10 uppercase tracking-[0.2em]">Otimização de Verba</p>
                    <div className="h-[250px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={budgetData} cx="50%" cy="50%" innerRadius={75} outerRadius={100} paddingAngle={10} dataKey="value" stroke="none">
                                    {budgetData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-white tracking-tighter italic">100%</span>
                            <span className="text-[9px] text-[#d4af37] font-black uppercase tracking-widest mt-1">Status OK</span>
                        </div>
                    </div>
                    <div className="w-full mt-10 space-y-4">
                        {budgetData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentcolor]" style={{ backgroundColor: COLORS[index], color: COLORS[index] }} />
                                    <span className="text-[11px] text-zinc-400 font-black uppercase tracking-widest">{entry.name}</span>
                                </div>
                                <span className="text-[11px] text-white font-black">{Math.round((entry.value / 1000) * 100)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, trend, isPositive, icon }: { title: string, value: string, trend: string, isPositive: boolean, icon: any }) {
    return (
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 p-8 rounded-[32px] group hover:-translate-y-2 transition-all duration-300 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                {icon}
            </div>
            <div className="flex justify-between items-start mb-6">
                <div className="bg-black/50 p-4 rounded-2xl border border-zinc-800 group-hover:border-[#d4af37]/40 transition-all text-[#d4af37] shadow-inner">
                    {icon}
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase italic ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {trend}
                </div>
            </div>
            <div className="relative z-10">
                <h3 className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{title}</h3>
                <p className="text-3xl font-black text-white tracking-tighter italic">{value}</p>
            </div>
        </div>
    );
}
