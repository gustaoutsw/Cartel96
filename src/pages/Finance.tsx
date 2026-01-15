import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { TrendingUp, TrendingDown, Plus, Wallet, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

// --- ANIMATED COUNTER COMPONENT ---
function Counter({ value, prefix = "R$ " }: { value: number, prefix?: string }) {
    const spring = useSpring(0, { bounce: 0, duration: 1000 });
    const display = useTransform(spring, (current) => `${prefix}${current.toFixed(2)}`);

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span className="tabular-nums">{display}</motion.span>;
}

// --- MOCK DATA GENERATORS ---
const generateChartData = (days: number, multiplier: number) => {
    return Array.from({ length: days }).map((_, i) => ({
        day: i + 1,
        income: (Math.floor(Math.random() * 3000) + 1000) * multiplier,
        expenses: (Math.floor(Math.random() * 1500) + 500) * multiplier,
    }));
};

const MOCK_COMMISSIONS = 12450.00;

const MOCK_TRANSACTIONS = [
    { id: 1, title: 'Aluguel Unidade I', category: 'Fixo', date: new Date(), value: -3500, type: 'expense' },
    { id: 2, title: 'Conta de Luz', category: 'Fixo', date: new Date(), value: -850, type: 'expense' },
    { id: 3, title: 'Reposição Pomadas', category: 'Suprimentos', date: new Date(), value: -1200, type: 'expense' },
    { id: 4, title: 'Serviço: Corte Master', category: 'Serviço', date: new Date(), value: 85, type: 'income' },
    { id: 5, title: 'Venda: Kit Barba Royal', category: 'Vendas', date: new Date(), value: 150, type: 'income' },
];

export default function Finance() {
    const [period, setPeriod] = useState('Mês Atual');
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        const fetchTransactions = async () => {
            const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false }).limit(20);
            if (!data || data.length === 0) {
                setTransactions(MOCK_TRANSACTIONS);
            } else {
                setTransactions(data);
            }
        };
        fetchTransactions();
    }, []);

    // DYNAMIC DATA BASED ON PERIOD
    const { chartData, income, fixedCosts, commissions } = useMemo(() => {
        let days = 30;
        let mult = 1;

        if (period === 'Trimestre') { days = 12; mult = 3; }
        if (period === 'Ano') { days = 12; mult = 12; }

        return {
            chartData: generateChartData(days, mult),
            income: 45890.00 * mult,
            fixedCosts: 5400.00 * mult,
            commissions: MOCK_COMMISSIONS * mult
        };
    }, [period]);

    const totalExpenses = fixedCosts + commissions;
    const netProfit = income - totalExpenses;
    const profitMargin = (netProfit / income) * 100;

    return (
        <div className="min-h-screen bg-zinc-950 text-stone-200 font-sans selection:bg-[#d4af37]/30 flex relative overflow-hidden">
            <main className="flex-1 p-4 lg:p-8 relative overflow-y-auto h-screen scrollbar-hide flex flex-col">

                {/* HEADER */}
                <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md pb-4 pt-2 -mx-4 px-4 md:mx-0 md:px-0 md:pt-0 mb-8 border-b border-zinc-900 md:border-none">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <h1 className="text-2xl md:text-4xl font-serif font-black text-white tracking-tighter drop-shadow-2xl mb-1 uppercase">
                                FINANCEIRO <span className="text-[#d4af37]">MASTER</span>
                            </h1>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">Gestão de Ativos & Lucratividade</p>
                        </div>

                        <div className="flex gap-4 w-full md:w-auto">
                            <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl flex-1 md:flex-none">
                                {['Mês Atual', 'Trimestre', 'Ano'].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={`flex-1 md:flex-none px-4 md:px-6 py-4 md:py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${period === p ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20' : 'text-zinc-500 hover:text-white'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setIsExpenseModalOpen(true)}
                                className="bg-[#d4af37] hover:bg-[#b08d55] text-black p-3 md:px-5 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center shrink-0 w-14"
                            >
                                <Plus size={24} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* ENTRADAS */}
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={`income-${period}`}
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                            className="bg-zinc-900/40 backdrop-blur-md rounded-3xl p-6 border border-zinc-800 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp size={48} className="text-emerald-500" />
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><ArrowUpRight size={20} /></div>
                                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Entradas (Bruto)</span>
                            </div>
                            <div className="text-3xl font-black text-white mb-1">
                                <Counter value={income} />
                            </div>
                            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden mt-4">
                                <div className="h-full bg-emerald-500 w-[100%] rounded-full shadow-[0_0_10px_#10b981]" />
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* SAÍDAS */}
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={`expense-${period}`}
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                            className="bg-zinc-900/40 backdrop-blur-md rounded-3xl p-6 border border-zinc-800 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingDown size={48} className="text-red-500" />
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><ArrowDownRight size={20} /></div>
                                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Saídas (Custos)</span>
                            </div>
                            <div className="text-3xl font-black text-white mb-1">
                                <Counter value={totalExpenses} />
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-2 lowercase">Inclui <span className="text-zinc-300">R$ {commissions.toFixed(2)}</span> em comissões.</p>
                            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden mt-2">
                                <div className="h-full bg-red-500 rounded-full shadow-[0_0_10px_#ef4444]" style={{ width: `${Math.min((totalExpenses / income) * 100, 100)}%` }} />
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* LUCRO LÍQUIDO */}
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={`profit-${period}`}
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                            className="bg-zinc-900/40 backdrop-blur-md rounded-3xl p-6 border border-[#d4af37]/20 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent pointer-events-none" />
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-[#d4af37]/10 rounded-lg text-[#d4af37]"><Wallet size={20} /></div>
                                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Lucro Líquido Real</span>
                            </div>
                            <div className={`text-4xl font-black mb-1 ${netProfit >= 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}>
                                <Counter value={netProfit} />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Margem:</span>
                                <span className={`text-xs font-black px-2 py-0.5 rounded ${netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {profitMargin.toFixed(1)}%
                                </span>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">

                    {/* CHART SECTION */}
                    <motion.div className="bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-zinc-800 p-6 h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-serif font-bold text-white flex items-center gap-2">
                                <PieChart size={18} className="text-[#d4af37]" /> Fluxo de Caixa ({period})
                            </h3>
                        </div>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis dataKey="day" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                        formatter={(value: any) => `R$ ${Number(value || 0).toFixed(2)}`}
                                    />
                                    <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                                    <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* TRANSACTIONS LIST */}
                    <motion.div className="bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-zinc-800 p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-serif font-bold text-white flex items-center gap-2">
                                <Wallet size={18} className="text-[#d4af37]" /> Últimas Movimentações
                            </h3>
                            <button className="text-[10px] text-zinc-500 hover:text-white uppercase font-bold tracking-wider">Ver Tudo</button>
                        </div>

                        <div className="space-y-4 overflow-y-auto max-h-[300px] scrollbar-hide">
                            {transactions.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-800 group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-zinc-200">{tx.title}</p>
                                            <p className="text-[10px] text-zinc-500 uppercase">{tx.category} • {format(new Date(tx.date), 'dd/MM')}</p>
                                        </div>
                                    </div>
                                    <span className={`font-mono font-bold text-sm ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {tx.value > 0 ? '+' : ''}R$ {Math.abs(tx.value).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                </div>

            </main>

            {/* EXPENSE MODAL */}
            <AnimatePresence>
                {isExpenseModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsExpenseModalOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="fixed left-1/2 top-1/2 -track-x-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-950 border border-[#d4af37]/30 rounded-3xl p-8 z-[110] shadow-2xl"
                        >
                            <h2 className="text-2xl font-serif font-black text-white mb-6 uppercase">Lançar Despesa</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-2 tracking-widest">Descrição</label>
                                    <input type="text" placeholder="Ex: Conta de Luz" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-[#d4af37] outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-2 tracking-widest">Valor (R$)</label>
                                    <input type="number" placeholder="0.00" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-[#d4af37] outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-2 tracking-widest">Categoria</label>
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-2 rounded-lg bg-zinc-800 text-[10px] font-bold uppercase hover:bg-[#d4af37] hover:text-black transition-colors">Fixo</button>
                                        <button className="flex-1 py-2 rounded-lg bg-zinc-800 text-[10px] font-bold uppercase hover:bg-[#d4af37] hover:text-black transition-colors">Variável</button>
                                        <button className="flex-1 py-2 rounded-lg bg-zinc-800 text-[10px] font-bold uppercase hover:bg-[#d4af37] hover:text-black transition-colors">Pessoal</button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setIsExpenseModalOpen(false)} className="flex-1 py-3 text-zinc-500 hover:text-white font-bold text-[10px] uppercase tracking-widest">Cancelar</button>
                                <button onClick={() => setIsExpenseModalOpen(false)} className="flex-1 py-3 rounded-lg bg-[#d4af37] text-black font-black text-[10px] uppercase hover:bg-[#b08d55] transition-colors shadow-lg tracking-widest">Confirmar</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
}
