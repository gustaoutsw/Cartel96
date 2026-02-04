import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, Scissors, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Cores da Cartel
const COLORS = ['#d4af37', '#b08d55', '#3f3f46', '#fbbf24'];

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({ revenue: 0, appointments: 0, ticket: 0 });
    const [dailyData, setDailyData] = useState<any[]>([]);
    const [prosData, setProsData] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    async function fetchDashboardData() {
        setLoading(true);
        const now = new Date();
        const start = startOfMonth(now).toISOString();
        const end = endOfMonth(now).toISOString();

        // 1. Busca Agendamentos do Mês Atual
        const { data: appts, error } = await supabase
            .from('appointments')
            .select('price, start_time, professional, status')
            .gte('start_time', start)
            .lte('start_time', end)
            .neq('status', 'cancelado'); // Ignora cancelados

        if (error) {
            console.error('Erro ao carregar dashboard:', error);
            setLoading(false);
            return;
        }

        if (appts) {
            // --- CÁLCULO DE KPIS ---
            const totalRevenue = appts.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
            const totalCount = appts.length;
            const avgTicket = totalCount > 0 ? totalRevenue / totalCount : 0;

            setKpis({
                revenue: totalRevenue,
                appointments: totalCount,
                ticket: avgTicket
            });

            // --- GRÁFICO DIÁRIO (Evolução) ---
            const daysInMonth = eachDayOfInterval({ start: startOfMonth(now), end: new Date() }); // Até hoje ou fim do mês
            const chartData = daysInMonth.map(day => {
                // Soma o valor de todos os agendamentos daquele dia
                const dayValue = appts
                    .filter(a => isSameDay(parseISO(a.start_time), day))
                    .reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

                return {
                    name: format(day, 'dd'),
                    faturamento: dayValue
                };
            });
            setDailyData(chartData);

            // --- PERFORMANCE POR PROFISSIONAL ---
            const proMap: Record<string, number> = {};
            appts.forEach(a => {
                const name = a.professional || 'Indefinido';
                proMap[name] = (proMap[name] || 0) + 1; // Contagem de cortes
            });

            const proChart = Object.keys(proMap).map(key => ({
                name: key,
                agendamentos: proMap[key]
            })).sort((a, b) => b.agendamentos - a.agendamentos);

            setProsData(proChart);
        }
        setLoading(false);
    }

    return (
        <div className="space-y-10 pb-20 p-8 min-h-screen bg-[#09090b] text-white">
            <header className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-serif font-black text-white tracking-tighter uppercase drop-shadow-2xl">
                            Dashboard <span className="text-[#d4af37]">Financeiro</span>
                        </h1>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">
                            {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                    </div>
                    <button onClick={fetchDashboardData} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">
                        {loading ? <Loader2 className="animate-spin text-[#d4af37]" /> : <TrendingUp className="text-[#d4af37]" />}
                    </button>
                </div>
            </header>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard
                    title="Faturamento"
                    value={kpis.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    icon={<DollarSign size={24} />}
                    loading={loading}
                />
                <KpiCard
                    title="Agendamentos"
                    value={kpis.appointments.toString()}
                    icon={<Scissors size={24} />}
                    loading={loading}
                />
                <KpiCard
                    title="Ticket Médio"
                    value={kpis.ticket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    icon={<TrendingUp size={24} />}
                    loading={loading}
                />
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* GRÁFICO DE ÁREA (FATURAMENTO) */}
                <div className="lg:col-span-2 bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/80 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="text-[#d4af37]" size={20} /> Evolução de Faturamento
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                                    formatter={(value: number) => [`R$ ${value}`, 'Faturamento']}
                                />
                                <Area type="monotone" dataKey="faturamento" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* GRÁFICO DE BARRAS (PROFISSIONAIS) */}
                <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/80 rounded-[32px] p-8 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Scissors className="text-[#d4af37]" size={20} /> Top Profissionais
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={prosData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#fff" width={80} fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#27272a' }}
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                                />
                                <Bar dataKey="agendamentos" radius={[0, 4, 4, 0]}>
                                    {prosData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Componente Cartão KPI Simples
function KpiCard({ title, value, icon, loading }: { title: string, value: string, icon: any, loading: boolean }) {
    return (
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 p-6 rounded-[24px] hover:border-[#d4af37]/30 transition-all shadow-lg group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-black/50 rounded-xl text-[#d4af37] border border-zinc-800 group-hover:text-white group-hover:bg-[#d4af37] transition-colors">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
                {loading ? (
                    <div className="h-8 w-24 bg-zinc-800 animate-pulse rounded"></div>
                ) : (
                    <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
                )}
            </div>
        </div>
    );
}