import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, DollarSign, Scissors, TrendingUp, Loader2, Calendar, ArrowUpRight, ArrowDownRight, Eye, EyeOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, AreaChart, Area } from 'recharts';
import { startOfMonth, endOfMonth, format, startOfDay, endOfDay, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    cliente_nome: string;
    valor_total: number;
    data_horario: string;
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

        if (timeRange === 'today') {
            start = startOfDay(now).toISOString();
            end = endOfDay(now).toISOString();
        } else if (timeRange === 'week') {
            start = startOfWeek(now, { locale: ptBR }).toISOString();
            end = endOfWeek(now, { locale: ptBR }).toISOString();
        }

        try {
            // Build query with filters
            let query = supabase
                .from('agendamentos')
                .select('*')
                .gte('data_horario', start)
                .lte('data_horario', end)
                .in('status', ['finalizado', 'concluido']);

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                // 1. Calculate Stats
                const totalRev = data.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);
                const totalCount = data.length;
                const avg = totalCount > 0 ? totalRev / totalCount : 0;

                setStats({
                    totalRevenue: totalRev,
                    totalAppointments: totalCount,
                    averageTicket: avg
                });

                // 2. Aggregate Chart Data (By Barber)
                const barberMap = new Map<string, { revenue: number, count: number }>();
                data.forEach(appt => {
                    const name = appt.barbeiro_nome || 'Desconhecido';
                    const current = barberMap.get(name) || { revenue: 0, count: 0 };
                    barberMap.set(name, {
                        revenue: current.revenue + (Number(appt.valor_total) || 0),
                        count: current.count + 1
                    });
                });

                const chart = Array.from(barberMap.entries()).map(([name, val]) => ({
                    name: name.split(' ')[0], // First name only for chart
                    revenue: val.revenue,
                    count: val.count
                })).sort((a, b) => b.revenue - a.revenue);

                setChartData(chart);

                // 3. Service Distribution
                const serviceMap = new Map<string, number>();
                data.forEach(appt => {
                    const sName = appt.servico_nome || 'Outros';
                    serviceMap.set(sName, (serviceMap.get(sName) || 0) + 1);
                });
                const serviceChart = Array.from(serviceMap.entries())
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5); // Top 5
                setServiceData(serviceChart);

                // 4. Cash Flow Evolution (Area Chart)
                let intervalStart = now;
                let intervalEnd = now;

                if (timeRange === 'week') {
                    intervalStart = startOfWeek(now, { locale: ptBR });
                    intervalEnd = endOfWeek(now, { locale: ptBR });
                } else if (timeRange === 'month') {
                    intervalStart = startOfMonth(now);
                    intervalEnd = endOfMonth(now);
                } else {
                    // For today, just show today
                    intervalStart = startOfDay(now);
                    intervalEnd = endOfDay(now);
                }

                const daysInInterval = eachDayOfInterval({ start: intervalStart, end: intervalEnd });

                const cashChart = daysInInterval.map(day => {
                    const dayTotal = data
                        .filter(d => isSameDay(new Date(d.data_horario), day))
                        .reduce((sum, curr) => sum + (Number(curr.valor_total) || 0), 0);

                    return {
                        date: format(day, 'dd/MMM', { locale: ptBR }),
                        value: dayTotal
                    };
                });
                setCashFlowData(cashChart);

                // 5. Recent (Local sort)
                const sortedRecent = [...data].sort((a, b) => new Date(b.data_horario).getTime() - new Date(a.data_horario).getTime()).slice(0, 6);
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

    const COLORS = ['#fbbf24', '#f8fafc', '#475569', '#3f3f46', '#18181b'];

    return (
        <div className="h-full flex flex-col bg-zinc-950 p-4 md:p-8 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shrink-0">
                <div className="flex items-center gap-3">
                    <LayoutDashboard className="text-[#d4af37]" size={32} />
                    <div>
                        <h1 className="text-3xl font-serif font-black text-white uppercase tracking-tighter">
                            Dashboard
                        </h1>
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">
                            {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
                        </p>
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="flex items-center gap-2 self-start md:self-auto">
                    <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
                        {(['today', 'week', 'month'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${timeRange === range ? 'bg-[#d4af37] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                            >
                                {range === 'today' ? 'Hoje' : range === 'week' ? 'Semana' : 'Mês'}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setPrivacyMode(!privacyMode)}
                        className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[#d4af37] transition-all border border-zinc-700 hover:border-[#d4af37]/50"
                        title={privacyMode ? "Mostrar valores" : "Ocultar valores"}
                    >
                        {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                    <Loader2 size={32} className="animate-spin mb-4 text-[#d4af37]" />
                    <span className="uppercase tracking-widest text-xs">Carregando métricas...</span>
                </div>
            ) : (
                <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">

                    {/* KPI CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { title: 'Faturamento', value: stats.totalRevenue, icon: DollarSign, sub: 'Neste período', isMoney: true, trend: 12 },
                            { title: 'Agendamentos', value: stats.totalAppointments, icon: Scissors, sub: 'Realizados', isMoney: false, trend: 5 },
                            { title: 'Ticket Médio', value: stats.averageTicket, icon: TrendingUp, sub: 'Por cliente', isMoney: true, trend: -2 }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 hover:border-yellow-500/50 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)] transition-all duration-300">
                                <div className="absolute top-0 right-0 p-4 transform group-hover:scale-110 transition-transform duration-500">
                                    <item.icon size={100} className="text-yellow-500/20 group-hover:text-yellow-500/30 transition-colors" />
                                </div>
                                <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">{item.title}</p>
                                <h2 className="text-3xl md:text-4xl font-serif font-black text-white">
                                    {item.isMoney ? formatCurrency(item.value) : item.value}
                                </h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-[10px] font-bold flex items-center gap-1 ${item.trend > 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                                        {item.trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        {Math.abs(item.trend)}%
                                    </span>
                                    <span className="text-[10px] text-zinc-400 font-mono">vs período anterior</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CASH FLOW EVOLUTION (AREA CHART) */}
                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-6 flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-400" /> Evolução de Faturamento
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.1} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#52525b"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                        minTickGap={30}
                                        fontWeight={600}
                                    />
                                    <YAxis
                                        stroke="#52525b"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => privacyMode ? '•••' : `R$${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '5 5' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-zinc-950 border border-emerald-500/30 rounded-lg p-3 shadow-xl">
                                                        <p className="text-zinc-400 text-[10px] uppercase font-bold mb-1">{label}</p>
                                                        <p className="text-emerald-400 font-black font-serif text-lg">
                                                            {formatCurrency(Number(payload[0].value))}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fill="url(#emeraldGradient)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* CHART: PERFORMANCE */}
                        <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                            <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-6 flex items-center gap-2">
                                <TrendingUp size={16} className="text-[#d4af37]" /> Performance por Profissional
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={60}>
                                        <defs>
                                            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#FDBA74" stopOpacity={0.9} />
                                                <stop offset="95%" stopColor="#ca8a04" stopOpacity={0.6} />
                                            </linearGradient>
                                            <linearGradient id="silverGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.9} />
                                                <stop offset="95%" stopColor="#475569" stopOpacity={0.6} />
                                            </linearGradient>
                                            <linearGradient id="bronzeGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#fdba74" stopOpacity={0.9} />
                                                <stop offset="95%" stopColor="#9a3412" stopOpacity={0.6} />
                                            </linearGradient>
                                            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.9} />
                                                <stop offset="95%" stopColor="#0f172a" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.05} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#52525b"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                            fontWeight={700}
                                        />
                                        <YAxis
                                            stroke="#52525b"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => privacyMode ? '•••' : `R$${value}`}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#27272a', opacity: 0.4 }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-zinc-950 border border-[#d4af37]/30 rounded-lg p-3 shadow-xl">
                                                            <p className="text-zinc-400 text-[10px] uppercase font-bold mb-1">{label}</p>
                                                            <p className="text-[#d4af37] font-black font-serif text-lg">
                                                                {formatCurrency(Number(payload[0].value))}
                                                            </p>
                                                            <p className="text-zinc-500 text-[10px] mt-1">
                                                                {payload[0].payload.count} atendimentos
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="revenue" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1500}>
                                            {chartData.map((entry, index) => {
                                                const name = entry.name.toLowerCase();
                                                let fillUrl = 'url(#silverGradient)';

                                                if (name.includes('bruna')) fillUrl = 'url(#goldGradient)';
                                                else if (name.includes('luiz')) fillUrl = 'url(#silverGradient)';
                                                else if (name.includes('antonio')) fillUrl = 'url(#bronzeGradient)';
                                                else if (name.includes('william')) fillUrl = 'url(#blueGradient)';

                                                return <Cell key={`cell-${index}`} fill={fillUrl} />;
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* CHART: SERVICES (DONUT) */}
                        <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 flex flex-col">
                            <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-6 flex items-center gap-2">
                                <Scissors size={16} className="text-[#d4af37]" /> Serviços
                            </h3>
                            <div className="flex-1 w-full h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={serviceData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {serviceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#d4af37' }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            content={({ payload }) => (
                                                <div className="flex justify-center gap-4 flex-wrap">
                                                    {payload?.map((entry, index) => (
                                                        <div key={`item-${index}`} className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                            <span className="text-[10px] text-zinc-400 uppercase font-bold">{entry.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* RECENT LIST (Full Width) */}
                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 flex flex-col">
                        <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-6 flex items-center gap-2">
                            <Calendar size={16} className="text-zinc-500" /> Histórico Recente
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recentAppointments.length === 0 ? (
                                <p className="col-span-full text-zinc-600 text-xs text-center py-4">Sem dados recentes.</p>
                            ) : (
                                recentAppointments.map((appt) => (
                                    <div key={appt.id} className="flex items-center justify-between p-3 hover:bg-zinc-800/30 rounded-xl transition-colors group border border-zinc-800/30">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 group-hover:border-[#d4af37]/30 transition-colors">
                                                <span className="text-[#d4af37] font-black text-xs">
                                                    {appt.cliente_nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-zinc-200 font-bold text-xs group-hover:text-white transition-colors">{appt.cliente_nome}</p>
                                                <p className="text-zinc-600 text-[10px] uppercase font-bold flex items-center gap-2">
                                                    {format(new Date(appt.data_horario), 'dd MMM', { locale: ptBR })}
                                                    <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                                    {format(new Date(appt.data_horario), 'HH:mm')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-[#d4af37] font-mono text-xs font-bold bg-[#d4af37]/10 px-2 py-1 rounded-lg border border-[#d4af37]/20">
                                            {formatCurrency(Number(appt.valor_total) || 0)}
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

