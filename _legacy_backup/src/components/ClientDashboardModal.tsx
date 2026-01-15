import { X, Phone, MessageSquare, Calendar, Award, TrendingUp, History, ShoppingBag } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { format } from 'date-fns';

interface ClientDashboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientNome: string;
}

// MOCK DATA
const PREFERENCES_DATA = [
    { name: 'Degradê', value: 60, color: '#d4af37' },
    { name: 'Barba', value: 30, color: '#10b981' },
    { name: 'Sobrancelha', value: 10, color: '#3f3f46' },
];

const LTV_DATA = [
    { month: 'Jan', valor: 150 },
    { month: 'Fev', valor: 220 },
    { month: 'Mar', valor: 180 },
    { month: 'Abr', valor: 300 },
    { month: 'Mai', valor: 250 },
    { month: 'Jun', valor: 350 },
];

const PRODUCTS_HISTORY = [
    { id: 1, name: 'Pomada Matte', date: '2023-12-10' },
    { id: 2, name: 'Óleo de Barba', date: '2023-11-05' },
    { id: 3, name: 'Shampoo Anti-caspa', date: '2023-09-20' },
];

export default function ClientDashboardModal({ isOpen, onClose, clientNome }: ClientDashboardModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
            <div className="bg-zinc-950 w-full max-w-2xl max-h-[90vh] rounded-[2rem] border border-[#d4af37]/20 shadow-2xl flex flex-col overflow-hidden relative">
                {/* Header VIP */}
                <div className="relative p-6 bg-gradient-to-r from-zinc-900 via-zinc-900 to-[#d4af37]/5 border-b border-zinc-800">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-black/50 rounded-full hover:bg-zinc-800 transition-colors border border-zinc-800">
                        <X size={20} className="text-zinc-400" />
                    </button>
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-[#d4af37] flex items-center justify-center overflow-hidden">
                                <span className="text-2xl font-bold text-[#d4af37]">{clientNome.substring(0, 2).toUpperCase()}</span>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-[#d4af37] text-black text-[10px] font-black px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                                <Award size={10} /> VIP
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">{clientNome}</h2>
                            <p className="text-zinc-500 text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Cliente Ativo • Última visita há 15 dias
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-zinc-900/50 p-5 rounded-3xl border border-zinc-800/50">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <TrendingUp size={16} className="text-[#d4af37]" /> Preferências
                            </h3>
                            <div className="h-[140px] flex items-center justify-between">
                                <div className="h-full w-[140px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={PREFERENCES_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value" stroke="none">
                                                {PREFERENCES_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2 flex-1 pl-2">
                                    {PREFERENCES_DATA.map((item) => (
                                        <div key={item.name} className="flex items-center gap-2 text-xs">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-zinc-300">{item.name}</span>
                                            <span className="text-zinc-500 ml-auto">{item.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="bg-zinc-900/50 p-5 rounded-3xl border border-zinc-800/50 flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Award size={16} className="text-[#d4af37]" /> Nível Black
                                </h3>
                                <div className="mt-4 mb-2">
                                    <div className="flex justify-between text-xs text-zinc-500 mb-1"><span>7 visitas</span><span>Próx: Nível Gold</span></div>
                                    <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 w-[70%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">Faltam 3 cortes para ganhar um produto grátis.</p>
                            </div>
                            <div className="bg-[#d4af37]/10 border border-[#d4af37]/20 p-3 rounded-xl mt-4 flex items-center gap-3">
                                <div className="p-2 bg-[#d4af37] rounded-lg text-black font-bold text-xs">PROMO</div>
                                <span className="text-xs text-[#d4af37] font-semibold">20% OFF na próxima pomada</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-900/50 p-5 rounded-3xl border border-zinc-800/50 relative overflow-hidden">
                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div>
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">LTV (Total Gasto)</h3>
                                <p className="text-3xl font-black text-white mt-1">R$ 1.450,00</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-zinc-500 uppercase">Ticket Médio</p>
                                <p className="text-xl font-bold text-emerald-400">R$ 68,00</p>
                            </div>
                        </div>
                        <div className="h-[100px] w-full -mb-2 relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={LTV_DATA}>
                                    <defs>
                                        <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} itemStyle={{ color: '#fff' }} />
                                    <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorValor)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-zinc-900/50 p-5 rounded-3xl border border-zinc-800/50">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ShoppingBag size={16} className="text-[#d4af37]" /> Histórico de Produtos
                        </h3>
                        <div className="space-y-3">
                            {PRODUCTS_HISTORY.map((prod) => (
                                <div key={prod.id} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                                            <History size={16} className="text-zinc-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-200">{prod.name}</p>
                                            <p className="text-[10px] text-zinc-500">Comprado em {format(new Date(prod.date), 'dd/MM/yyyy')}</p>
                                        </div>
                                    </div>
                                    <button className="text-xs font-bold text-[#d4af37] border border-[#d4af37]/30 px-3 py-1.5 rounded-lg hover:bg-[#d4af37] hover:text-black transition-all">SUGERIR</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-zinc-950 border-t border-zinc-800 grid grid-cols-3 gap-3">
                    <button className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white border border-transparent hover:border-zinc-700 group">
                        <MessageSquare size={20} className="group-hover:text-[#25D366] transition-colors" />
                        <span className="text-[10px] font-bold">WhatsApp</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white border border-transparent hover:border-zinc-700 group">
                        <Phone size={20} className="group-hover:text-blue-500 transition-colors" />
                        <span className="text-[10px] font-bold">Ligar</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#b8962e] text-black shadow-lg">
                        <Calendar size={20} className="text-black" />
                        <span className="text-[10px] font-black">Iniciar</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
