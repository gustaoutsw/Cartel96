import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, DollarSign, Scissors, TrendingUp, Loader2, ArrowUpRight, ArrowDownRight, Eye, EyeOff, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, AreaChart, Area } from 'recharts';
import { startOfMonth, endOfMonth, format, startOfDay, endOfDay, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- INTERFACES ---
interface DashboardStats {
    totalRevenue: number;
    totalAppointments: number;
    averageTicket: number;
}

interface BarberPerformance {
    name: string;
    revenue: number;
    count: number;
}

interface ServiceDistribution {
    name: string;
    value: number;
}

interface RecentAppointment {
    id: string;
    client_name: string;
    price: number;
    start_time: string;
    professional: string;
}

interface CashFlowData {
    date: string;
    value: number;
}

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({ totalRevenue: 0, totalAppointments: 0, averageTicket: 0 });
    const [chartData, setChartData] = useState<BarberPerformance[]>([]);
    const [serviceData, setServiceData] = useState<ServiceDistribution[]>([]);
    const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
    const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('month');
    const [privacyMode, setPrivacyMode] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, [timeRange]);

    const fetchDashboardData = async () => {
        setLoading(true);
        const now = new Date();
        let start = startOfMonth(now).toISOString();
        let end = endOfMonth(now).toISOString();

        // Lógica de Filtro de Data
        if (timeRange === 'today') {
            start = startOfDay(now).toISOString();
            end = endOfDay(now).toISOString();
        } else if (timeRange === 'week') {
            start = startOfWeek(now, { locale: ptBR }).toISOString();
            end = endOfWeek(now, { locale: ptBR }).toISOString();
        }

        try {
            // --- BUSCA NO BANCO (Tabela 'appointments') ---
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .gte('start_time', start)
                .lte('start_time', end)
                .neq('status', 'cancelado'); // Ignora cancelados

            if (error) throw error;

            if (data) {
                // 1. Calcular KPIs Principais
                const totalRev = data.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
                const totalCount = data.length;
                const avg = totalCount > 0 ? totalRev / totalCount : 0;

                setStats({
                    totalRevenue: totalRev,
                    totalAppointments: totalCount,
                    averageTicket: avg
                });

                // 2. Gráfico: Performance por Barbeiro (Agrupamento)
                const barberMap = new Map<string, { revenue: number, count: number }>();
                data.forEach(appt => {
                    const name = appt.professional || 'Sem Nome';
                    const current = barberMap.get(name) || { revenue: 0, count: 0 };
                    barberMap.set(name, {
                        revenue: current.revenue + (Number(appt.price) || 0),
                        count: current.count + 1
                    });
                });

                const chart = Array.from(barberMap.entries()).map(([name, val]) => ({
                    name: name.split(' ')[0], // Pega só o primeiro nome
                    revenue: val.revenue,
                    count: val.count
                })).sort((a, b) => b.revenue - a.revenue);

                setChartData(chart);

                // 3. Gráfico: Distribuição de Serviços
                const serviceMap = new Map<string, number>();
                data.forEach(appt => {
                    // Usa service_name se existir, senão usa um placeholder
                    const sName = (appt as any).service_name || 'Corte/Barba';
                    serviceMap.set(sName, (serviceMap.get(sName) || 0) + 1);
                });

                const serviceChart = Array.from(serviceMap.entries())
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5); // Top 5
                setServiceData(serviceChart);

                // 4. Gráfico de Área: Fluxo de Caixa (Evolução Temporal)
                let intervalStart = now;
                let intervalEnd = now;

                if (timeRange === 'week') {
                    intervalStart = startOfWeek(now, { locale: ptBR });
                    intervalEnd = endOfWeek(now, { locale: ptBR });
                } else if (timeRange === 'month') {
                    intervalStart = startOfMonth(now);
                    intervalEnd = endOfMonth(now);
                } else {
                    intervalStart = startOfDay(now);
                    intervalEnd = endOfDay(now);
                }

                const daysInInterval = eachDayOfInterval({ start: intervalStart, end: intervalEnd });

                const cashChart = daysInInterval.map(day => {
                    const dayTotal = data
                        .filter(d => isSameDay(parseISO(d.start_time), day))
                        .reduce((sum, curr) => sum + (Number(curr.price) || 0), 0);

                    return {
                        date: format(day, 'dd/MMM', { locale: ptBR }),
                        value: dayTotal
                    };
                });
                setCashFlowData(cashChart);

                // 5. Lista Recente
                const sortedRecent = [...data]
                    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                    .slice(0, 6)
                    .map(item => ({
                        id: item.id,
                        client_name: item.client_name || 'Cliente',
                        price: item.price,
                        start_time: item.start_time,
                        professional: item.professional
                    }));
                setRecentAppointments(sortedRecent);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => {
        if (privacyMode) return '••••••';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const COLORS = ['#d4af37', '#f8fafc', '#475569', '#3f3f46', '#18181b'];

    return (
        <div className="h-full flex flex-col p-4 md:p-8 overflow-y-auto custom-scrollbar min-h-screen bg-zinc-950">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#d4af37]/10 rounded-2xl border border-[#d4af37]/20">
                        <LayoutDashboard className="text-[#d4af37]" size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif font-black text-white uppercase tracking-tighter drop-shadow-xl">
                            Dashboard
                        </h1>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] mt-1">
                            {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
                        </p>
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="flex items-center gap-3 self-start md:self-auto">
                    <div className="flex bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800 backdrop-blur-md shadow-2xl">
                        {(['today', 'week', 'month'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === range ? 'bg-[#d4af37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                            >
                                {range === 'today' ? 'Hoje' : range === 'week' ? 'Semana' : 'Mês'}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setPrivacyMode(!privacyMode)}
                        className="p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-[#d4af37] transition-all border border-zinc-800 hover:border-[#d4af37]/50 shadow-lg"
                        title={privacyMode ? "Mostrar valores" : "Ocultar valores"}
                    >
                        {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 h-[60vh]">
                    <Loader2 size={40} className="animate-spin mb-4 text-[#d4af37]" />
                    <span className="uppercase tracking-widest text-xs font-bold animate-pulse">Carregando métricas...</span>
                </div>
            ) : (
                <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full pb-20">

                    {/* KPI CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: 'Faturamento', value: stats.totalRevenue, icon: DollarSign, sub: 'Neste período', isMoney: true, trend: 12 },
                            { title: 'Agendamentos', value: stats.totalAppointments, icon: Scissors, sub: 'Realizados', isMoney: false, trend: 5 },
                            { title: 'Ticket Médio', value: stats.averageTicket, icon: TrendingUp, sub: 'Por cliente', isMoney: true, trend: -2 }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 relative overflow-hidden group hover:-translate-y-1 hover:border-[#d4af37]/30 transition-all duration-500 shadow-2xl">
                                <div className="absolute -top-10 -right-10 p-10 transform group-hover:scale-110 transition-transform duration-700 opacity-50">
                                    <div className="w-32 h-32 bg-[#d4af37]/10 rounded-full blur-3xl"></div>
                                </div>
                                <div className="absolute top-6 right-6 p-3 bg-black/40 rounded-2xl border border-white/5 text-[#d4af37]">
                                    <item.icon size={24} />
                                </div>

                                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{item.title}</p>
                                <h2 className="text-3xl md:text-5xl font-serif font-black text-white tracking-tighter mb-2">
                                    {item.isMoney ? formatCurrency(item.value) : item.value}
                                </h2>

                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 rounded text-[10px] font-black flex items-center gap-1 uppercase tracking-wider ${item.trend > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                        {item.trend > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                        {Math.abs(item.trend)}%
                                    </span>
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase">{item.sub}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CASH FLOW EVOLUTION (AREA CHART) */}
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-3">
                                <div className="w-1 h-6 bg-[#10b981] rounded-full"></div>
                                Evolução de Faturamento
                            </h3>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={15} fontWeight={700} />
                                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => privacyMode ? '•••' : `R$${value}`} />
                                    <Tooltip
                                        cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-black/90 border border-emerald-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-md">
                                                        <p className="text-zinc-400 text-[10px] uppercase font-bold mb-1 tracking-widest">{label}</p>
                                                        <p className="text-emerald-400 font-black font-serif text-xl">
                                                            {formatCurrency(Number(payload[0].value))}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fill="url(#emeraldGradient)" animationDuration={1500} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* CHART: PERFORMANCE */}
                        <div className="lg:col-span-2 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 shadow-2xl">
                            <h3 className="text-white font-black uppercase tracking-widest text-sm mb-8 flex items-center gap-3">
                                <div className="w-1 h-6 bg-[#d4af37] rounded-full"></div>
                                Ranking Profissionais
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={40}>
                                        <defs>
                                            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#d4af37" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#8a6e15" stopOpacity={0.8} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                        <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={15} fontWeight={700} />
                                        <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => privacyMode ? '•••' : `R$${value}`} />
                                        <Tooltip
                                            cursor={{ fill: '#ffffff', opacity: 0.05 }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-black/90 border border-[#d4af37]/30 rounded-xl p-4 shadow-2xl backdrop-blur-md">
                                                            <p className="text-zinc-400 text-[10px] uppercase font-bold mb-1 tracking-widest">{label}</p>
                                                            <p className="text-[#d4af37] font-black font-serif text-xl">
                                                                {formatCurrency(Number(payload[0].value))}
                                                            </p>
                                                            <p className="text-zinc-500 text-[10px] mt-1 font-bold uppercase">
                                                                {payload[0].payload.count} cortes
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]} animationDuration={1500} fill="url(#goldGradient)">
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fillOpacity={1} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* CHART: SERVICES (DONUT) */}
                        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 flex flex-col shadow-2xl">
                            <h3 className="text-white font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-3">
                                <div className="w-1 h-6 bg-zinc-500 rounded-full"></div>
                                Mix de Serviços
                            </h3>
                            <div className="flex-1 w-full h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={serviceData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {serviceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#d4af37', fontWeight: 'bold' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#71717a' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* RECENT LIST */}
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 flex flex-col shadow-2xl">
                        <h3 className="text-white font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-3">
                            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                            Últimos Atendimentos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recentAppointments.length === 0 ? (
                                <p className="col-span-full text-zinc-600 text-xs text-center py-10 font-bold uppercase tracking-widest">Nenhum atendimento neste período.</p>
                            ) : (
                                recentAppointments.map((appt) => (
                                    <div key={appt.id} className="flex items-center justify-between p-4 bg-black/20 hover:bg-zinc-800/50 rounded-2xl transition-all group border border-transparent hover:border-[#d4af37]/20">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-[#d4af37] transition-all text-[#d4af37] font-black text-xs">
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <p className="text-zinc-200 font-bold text-xs group-hover:text-white transition-colors uppercase tracking-wide">{appt.client_name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-zinc-600 text-[9px] uppercase font-bold flex items-center gap-1">
                                                        {format(new Date(appt.start_time), 'dd MMM', { locale: ptBR })}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                                    <span className="text-zinc-500 text-[9px] uppercase font-bold">
                                                        {appt.professional}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-[#d4af37] font-mono text-xs font-bold bg-[#d4af37]/5 px-3 py-1.5 rounded-lg border border-[#d4af37]/10 group-hover:bg-[#d4af37] group-hover:text-black transition-all">
                                            {formatCurrency(Number(appt.price) || 0)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}