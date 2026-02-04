import { useState, useMemo, useEffect } from 'react';
import { Search, AlertCircle, User, ArrowUpRight, Calendar, DollarSign, MessageSquare, Loader2, RefreshCw } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

type ClientStatus = 'qualificado' | 'agendado' | 'risco' | 'vip' | 'novo';

interface ClientCRM {
    id: string;
    nome: string;
    telefone: string;
    ultimoServico: string;
    dataUltimaVisita: string;
    valorGasto: number;
    totalVisitas: number;
    status: ClientStatus;
}

export default function Clients() {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<'todos' | ClientStatus>('todos');
    const [clients, setClients] = useState<ClientCRM[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        // Busca todos os agendamentos que não foram cancelados
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('*')
            .neq('status', 'cancelado')
            .order('start_time', { ascending: false });

        if (error) {
            console.error('Erro ao buscar clientes:', error);
            setLoading(false);
            return;
        }

        if (appointments) {
            // --- ALGORITMO DE AGREGACÃO CRM ---
            const clientMap = new Map<string, ClientCRM>();

            appointments.forEach(appt => {
                // Normaliza o nome para evitar duplicatas (ex: "Gustavo" e "gustavo")
                const key = appt.client_name.trim();

                if (!clientMap.has(key)) {
                    // Inicializa o cliente se não existir
                    clientMap.set(key, {
                        id: key, // Usamos o nome como ID temporário
                        nome: appt.client_name,
                        telefone: appt.client_phone || 'Sem contato',
                        ultimoServico: appt.service_name,
                        dataUltimaVisita: appt.start_time,
                        valorGasto: 0,
                        totalVisitas: 0,
                        status: 'novo' // Status padrão inicial
                    });
                }

                const client = clientMap.get(key)!;
                client.valorGasto += Number(appt.price) || 0;
                client.totalVisitas += 1;

                // Mantém a data mais recente
                if (new Date(appt.start_time) > new Date(client.dataUltimaVisita)) {
                    client.dataUltimaVisita = appt.start_time;
                    client.ultimoServico = appt.service_name;
                }
            });

            // --- CÁLCULO DE STATUS INTELIGENTE ---
            const processedClients = Array.from(clientMap.values()).map(client => {
                const daysSinceLastVisit = differenceInDays(new Date(), new Date(client.dataUltimaVisita));

                let status: ClientStatus = 'qualificado';

                if (client.valorGasto > 400) {
                    status = 'vip'; // Gastou muito = VIP
                } else if (daysSinceLastVisit > 45) {
                    status = 'risco'; // Sumiu há 45 dias = Risco
                } else if (client.totalVisitas === 1 && daysSinceLastVisit < 30) {
                    status = 'novo'; // Veio só uma vez recentemente = Novo
                }

                return { ...client, status };
            });

            setClients(processedClients);
        }
        setLoading(false);
    };

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const matchesSearch = client.nome.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = activeFilter === 'todos' || client.status === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [searchTerm, activeFilter, clients]);

    const getStatusStyle = (status: ClientStatus) => {
        switch (status) {
            case 'vip': return 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20';
            case 'risco': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'novo': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
        }
    };

    return (
        <div className="space-y-10 pb-20 h-full overflow-y-auto custom-scrollbar p-6 bg-[#09090b]">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black text-white tracking-tighter uppercase drop-shadow-2xl">
                        Base de <span className="text-[#d4af37]">Clientes</span>
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Intelligence Matrix</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchClients} className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:text-[#d4af37] text-zinc-500 transition-all">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="px-6 py-3 bg-[#d4af37] text-black rounded-2xl font-serif font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl">
                        Exportar CSV
                    </button>
                </div>
            </header>

            {/* FILTERS & SEARCH */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input
                        placeholder="Pesquisar cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white focus:border-[#d4af37]/50 outline-none transition-all placeholder:text-zinc-700 shadow-inner"
                    />
                </div>
                <div className="lg:col-span-3 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                    {['todos', 'vip', 'risco', 'novo'].map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f as any)}
                            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all border whitespace-nowrap ${activeFilter === f ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-lg shadow-[#d4af37]/20' : 'bg-transparent text-zinc-600 border-zinc-800 hover:text-zinc-400'}`}
                        >
                            {f === 'todos' ? 'Base Completa' : f}
                        </button>
                    ))}
                </div>
            </div>

            {/* CLIENT GRID */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 size={40} className="animate-spin text-[#d4af37]" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredClients.map(client => (
                        <div key={client.id} className="p-8 rounded-[40px] border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-[#d4af37]/30 group relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <User size={80} />
                            </div>

                            <div className="flex justify-between items-start mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center text-[#d4af37] font-serif font-black text-xl shadow-inner group-hover:border-[#d4af37]/50 transition-all uppercase">
                                    {client.nome.substring(0, 1)}
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(client.status)}`}>
                                    {client.status}
                                </span>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-xl font-serif font-black text-white uppercase tracking-tight group-hover:text-[#d4af37] transition-all truncate">{client.nome}</h3>
                                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                                    <MessageSquare size={12} /> {client.telefone}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/50 pt-8">
                                <div>
                                    <p className="text-zinc-700 text-[9px] font-black uppercase tracking-widest mb-1">Total LTV</p>
                                    <p className="text-white font-black text-lg tracking-tighter flex items-center gap-1">
                                        <DollarSign size={14} className="text-emerald-500" /> {client.valorGasto.toFixed(2)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-zinc-700 text-[9px] font-black uppercase tracking-widest mb-1">Última Visita</p>
                                    <p className="text-white font-black text-sm uppercase italic">
                                        {format(parseISO(client.dataUltimaVisita), "MMM yyyy", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-8">
                                <button className="flex-1 py-3 bg-zinc-950/80 border border-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:text-white hover:border-[#d4af37]/30 transition-all flex items-center justify-center gap-2">
                                    <Calendar size={12} /> Histórico
                                </button>
                                <button
                                    className="p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                                    onClick={() => window.open(`https://wa.me/55${client.telefone.replace(/\D/g, '')}`, '_blank')}
                                >
                                    <ArrowUpRight size={18} />
                                </button>
                            </div>

                            {client.status === 'risco' && (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-transparent opacity-40" />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && filteredClients.length === 0 && (
                <div className="py-40 flex flex-col items-center justify-center text-zinc-800">
                    <AlertCircle size={80} className="opacity-10 mb-6" />
                    <p className="font-serif font-black text-xl uppercase tracking-widest opacity-20">Nenhum cliente encontrado</p>
                </div>
            )}
        </div>
    );
}