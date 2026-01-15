import { motion, AnimatePresence } from 'framer-motion';

import { DollarSign, CheckCircle, Smartphone, X, Scissors, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { format, subDays, isSameDay, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { BARBERS } from '../constants/barbers';

// --- TYPES ---
interface Service {
    id: number;
    description: string;
    value: number;
    date: Date;
    status: 'completed' | 'pending';
}

interface Barber {
    id: number;
    name: string;
    specialty: string;
    avatar: string;
    status: 'online' | 'offline';
    commissionRate: number; // 0.4, 0.5 etc
    monthlyGoal: number;
    services: Service[];
}

// --- MOCK SERVICES GENERATOR FOR NEW BARBERS ---
// In real app, this would be fetched from 'apppointments' table joined with 'barbers'
const generateServices = (count: number): Service[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: i,
        description: Math.random() > 0.5 ? 'Corte Degradê' : 'Barba & Bigode',
        value: Math.random() > 0.5 ? 60 : 45,
        date: subDays(new Date(), Math.floor(Math.random() * 30)),
        status: Math.random() > 0.1 ? 'completed' : 'pending' // 90% completed
    }));
};

type Period = 'today' | 'week' | 'month';

export default function Team() {
    const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [period, setPeriod] = useState<Period>('month'); // Default to month



    // ... (existing imports)

    useEffect(() => {
        const fetchTeamData = async () => {
            const { data: profiles, error: profileError } = await supabase.from('perfis').select('*').eq('cargo', 'barber');

            if (profileError) {
                console.error("Error fetching team:", profileError);
                // Continue to fallback
            }

            // Mock barbers for Step 3 using CONSTANT
            const finalProfiles = (!profiles || profiles.length === 0) ? BARBERS.map(b => ({
                id: b.id,
                nome: b.name,
                cargo: 'barber',
                especialidade: b.specialty,
                comissao_pct: (b.commissionRate || 0.5) * 100
            })) : profiles;

            const barberIds = finalProfiles.map(p => p.id);

            const { data: appointments } = await supabase
                .from('agendamentos')
                .select('*')
                .in('barbeiro_id', barberIds)
                .eq('status', 'finalizado');

            const mappedBarbers: Barber[] = finalProfiles.map((p: any) => {
                const barberApps = appointments?.filter(a => a.barbeiro_id === p.id) || [];
                const services: Service[] = barberApps.map((a: any) => ({
                    id: a.id,
                    description: a.servico_nome || 'Corte',
                    value: a.valor_total || 0,
                    date: new Date(a.data_horario),
                    status: 'completed'
                }));

                // Inject mock services if none exist for Step 3 demonstration
                const finalServices = services.length > 0 ? services : generateServices(10);

                return {
                    id: p.id,
                    name: p.nome,
                    specialty: p.especialidade || "Barbeiro Master",
                    avatar: p.nome.substring(0, 2).toUpperCase(),
                    status: 'online',
                    commissionRate: (p.comissao_pct || 50) / 100,
                    monthlyGoal: p.meta_mensal || 5000,
                    services: finalServices
                };
            });

            setBarbers(mappedBarbers);
        };
        fetchTeamData();
    }, []);

    // --- LOGIC ---
    const getFilteredServices = (services: Service[]) => {
        const today = new Date();
        return services.filter(s => {
            if (s.status !== 'completed') return false;
            if (period === 'today') return isSameDay(new Date(s.date), today);
            if (period === 'week') return isWithinInterval(new Date(s.date), { start: startOfWeek(today), end: endOfWeek(today) });
            if (period === 'month') return isWithinInterval(new Date(s.date), { start: startOfMonth(today), end: endOfMonth(today) });
            return true;
        });
    };

    const getBarberStats = (barber: Barber) => {
        const services = barber.services || [];
        const filtered = getFilteredServices(services);
        const gross = filtered.reduce((acc, curr) => acc + curr.value, 0);
        const commission = gross * (barber.commissionRate || 0.5);
        const count = filtered.length;
        const ticket = count > 0 ? gross / count : 0;
        const goalProgress = Math.min((gross / (barber.monthlyGoal || 5000)) * 100, 100);

        // Sparkline Data (Last 7 Days)
        const sparklineData = Array.from({ length: 7 }).map((_, i) => {
            const d = subDays(new Date(), 6 - i);
            const val = services
                .filter(s => isSameDay(new Date(s.date), d) && s.status === 'completed')
                .reduce((acc, curr) => acc + curr.value, 0);
            return { day: i, value: val };
        });

        return { gross, commission, count, ticket, goalProgress, sparklineData, filtered };
    };

    const totalPayroll = useMemo(() => {
        return barbers.reduce((acc, b) => acc + getBarberStats(b).commission, 0);
    }, [period, barbers]);

    const handleSendPayslip = (barber: Barber, amount: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const msg = `Olá ${barber.name}, seu fechamento (${period}) na Cartel 96 deu R$ ${amount.toFixed(2)}. Confira os detalhes no seu app!`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-stone-200 font-sans selection:bg-[#d4af37]/30 flex relative overflow-hidden">
            {/* Sidebar removed (Global) */}

            <main className="flex-1 p-4 lg:p-8 relative overflow-y-auto h-screen scrollbar-hide flex flex-col">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-serif font-black text-white tracking-tighter drop-shadow-2xl mb-1">
                            EQUIPE <span className="text-[#d4af37]">&</span> COMISSÕES
                        </h1>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">Gestão Financeira e Performance</p>
                    </div>

                    <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl">
                        {[
                            { id: 'today', label: 'Hoje' },
                            { id: 'week', label: 'Esta Semana' },
                            { id: 'month', label: 'Este Mês' }
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPeriod(p.id as Period)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${period === p.id ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20' : 'text-zinc-500 hover:text-white'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* TOTAL SUMMARY CARD */}
                <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-[#d4af37]/10 border border-zinc-800 p-6 rounded-3xl mb-8 flex justify-between items-center relative overflow-hidden group">
                    {/* Gloss effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                    <div>
                        <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                            <DollarSign size={14} className="text-[#d4af37]" /> Total a Pagar ({period === 'today' ? 'Hoje' : period === 'week' ? 'Semana' : 'Mês'})
                        </p>
                        <h2 className="text-4xl font-black text-white">R$ {totalPayroll.toFixed(2)}</h2>
                    </div>
                    <button className="bg-[#d4af37] hover:bg-[#b08d55] text-black font-black uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2">
                        <CheckCircle size={18} /> Fechar Caixa
                    </button>
                </div>

                {/* BARBER GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
                    {barbers.map(barber => {
                        const stats = getBarberStats(barber);
                        return (
                            <motion.div
                                key={barber.id}
                                layout
                                onClick={() => setSelectedBarber(barber)}
                                className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800 hover:border-[#d4af37]/30 p-6 relative group cursor-pointer transition-all hover:-translate-y-1"
                            >
                                {/* Header */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-[#d4af37] font-black text-xl border-2 border-[#d4af37]/30">
                                            {barber.avatar}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-950 ${barber.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{barber.name}</h3>
                                        <p className="text-[#d4af37] text-xs font-bold uppercase tracking-wide">{barber.specialty}</p>
                                    </div>
                                    <div className="ml-auto bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800 text-[10px] font-mono text-zinc-400">
                                        {(barber.commissionRate * 100)}%
                                    </div>
                                </div>

                                {/* Financials */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-black/30 p-3 rounded-xl border border-zinc-800/50">
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Bruto</p>
                                        <p className="text-lg font-bold text-zinc-300">R$ {stats.gross.toFixed(0)}</p>
                                    </div>
                                    <div className="bg-[#d4af37]/10 p-3 rounded-xl border border-[#d4af37]/20">
                                        <p className="text-[10px] text-[#d4af37] uppercase font-bold">Comissão</p>
                                        <p className="text-xl font-black text-[#d4af37]">R$ {stats.commission.toFixed(0)}</p>
                                    </div>
                                </div>

                                {/* Sparkline & Goal */}
                                <div className="space-y-4">
                                    <div className="h-16 w-full opacity-50">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={stats.sparklineData}>
                                                <defs>
                                                    <linearGradient id={`grad${barber.id}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <Area type="monotone" dataKey="value" stroke="#d4af37" strokeWidth={2} fill={`url(#grad${barber.id})`} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                                            <span className="text-zinc-500">Meta Mensal</span>
                                            <span className={stats.goalProgress >= 100 ? 'text-[#d4af37]' : 'text-zinc-400'}>{stats.goalProgress.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${stats.goalProgress >= 100 ? 'bg-[#d4af37] shadow-[0_0_10px_#d4af37]' : 'bg-zinc-600'}`}
                                                style={{ width: `${stats.goalProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <button
                                    onClick={(e) => handleSendPayslip(barber, stats.commission, e)}
                                    className="w-full mt-6 py-3 rounded-xl border border-zinc-700 hover:border-[#d4af37] hover:bg-[#d4af37]/10 text-zinc-400 hover:text-[#d4af37] transition-all text-xs font-bold flex items-center justify-center gap-2 group-hover:bg-zinc-800"
                                >
                                    <Smartphone size={14} /> Enviar Comprovante
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

            </main>

            {/* DETAIL DRAWER */}
            <AnimatePresence>
                {selectedBarber && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedBarber(null)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-[#d4af37]/30 z-50 shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-zinc-900 bg-zinc-900/50">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-[#d4af37] font-black text-xl border border-[#d4af37]/30">
                                            {selectedBarber.avatar}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-serif font-black text-white">{selectedBarber.name}</h2>
                                            <p className="text-zinc-500 text-xs font-bold uppercase">{selectedBarber.specialty}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedBarber(null)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><X size={20} className="text-zinc-500" /></button>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-zinc-900 p-2 rounded-lg text-center">
                                        <p className="text-[9px] text-zinc-500 uppercase">Serviços</p>
                                        <p className="text-sm font-bold text-white">{getBarberStats(selectedBarber).count}</p>
                                    </div>
                                    <div className="bg-zinc-900 p-2 rounded-lg text-center">
                                        <p className="text-[9px] text-zinc-500 uppercase">Ticket M.</p>
                                        <p className="text-sm font-bold text-white">R$ {getBarberStats(selectedBarber).ticket.toFixed(0)}</p>
                                    </div>
                                    <div className="bg-[#d4af37]/10 p-2 rounded-lg text-center border border-[#d4af37]/20">
                                        <p className="text-[9px] text-[#d4af37] uppercase">Total Com.</p>
                                        <p className="text-sm font-bold text-[#d4af37]">R$ {getBarberStats(selectedBarber).commission.toFixed(0)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Award size={14} /> Histórico de Serviços ({period})
                                </h3>

                                <div className="space-y-3">
                                    {getBarberStats(selectedBarber).filtered.length === 0 ? (
                                        <p className="text-zinc-600 text-sm text-center py-10">Nenhum serviço neste período.</p>
                                    ) : (
                                        getBarberStats(selectedBarber).filtered.map(service => (
                                            <div key={service.id} className="flex item-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-900 hover:border-zinc-700 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center text-zinc-500">
                                                        <Scissors size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-zinc-300">{service.description}</p>
                                                        <p className="text-[10px] text-zinc-600">{format(new Date(service.date), 'dd/MM/yyyy')}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-white">R$ {service.value.toFixed(2)}</p>
                                                    <p className="text-[10px] text-emerald-500">Concluído</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
