import { useState, useMemo, useEffect } from 'react';
import { Search, AlertCircle, User, MessageSquare, Loader2, RefreshCw, X, Clock, Scissors, Phone, ArrowRight } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

type ClientStatus = 'qualificado' | 'agendado' | 'risco' | 'vip' | 'novo';

interface AppointmentHistory {
    id: string;
    date: string;
    service: string;
    price: number;
    professional: string;
}

interface ClientCRM {
    id: string;
    nome: string;
    telefone: string;
    ultimoServico: string;
    dataUltimaVisita: string;
    valorGasto: number;
    totalVisitas: number;
    status: ClientStatus;
    history: AppointmentHistory[];
}

export default function Clients() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<'todos' | ClientStatus>('todos');
    const [clients, setClients] = useState<ClientCRM[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState<ClientCRM | null>(null);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('*')
            .neq('status', 'cancelado')
            .order('start_time', { ascending: false });

        if (error) {
            console.error('Erro:', error);
            setLoading(false);
            return;
        }

        if (appointments) {
            const clientMap = new Map<string, ClientCRM>();

            appointments.forEach(appt => {
                const rawPhone = appt.client_phone || '';
                const key = `${appt.client_name.trim()}-${rawPhone}`;

                const historyItem: AppointmentHistory = {
                    id: appt.id,
                    date: appt.start_time,
                    service: appt.service_name,
                    price: Number(appt.price) || 0,
                    professional: appt.professional || 'Barbeiro'
                };

                if (!clientMap.has(key)) {
                    clientMap.set(key, {
                        id: key,
                        nome: appt.client_name,
                        telefone: rawPhone || 'Sem número',
                        ultimoServico: appt.service_name,
                        dataUltimaVisita: appt.start_time,
                        valorGasto: 0,
                        totalVisitas: 0,
                        status: 'novo',
                        history: []
                    });
                }

                const client = clientMap.get(key)!;
                client.valorGasto += Number(appt.price) || 0;
                client.totalVisitas += 1;
                client.history.push(historyItem);

                if (new Date(appt.start_time) > new Date(client.dataUltimaVisita)) {
                    client.dataUltimaVisita = appt.start_time;
                    client.ultimoServico = appt.service_name;
                }
            });

            const processedClients = Array.from(clientMap.values()).map(client => {
                const daysSinceLastVisit = differenceInDays(new Date(), new Date(client.dataUltimaVisita));
                let status: ClientStatus = 'qualificado';

                // Lógica Ajustada: Novo tem prioridade de visualização se tiver poucas visitas
                if (client.totalVisitas <= 2 && daysSinceLastVisit < 30) {
                    status = 'novo';
                }
                else if (client.valorGasto > 400) {
                    status = 'vip';
                }
                else if (daysSinceLastVisit > 45) {
                    status = 'risco';
                }

                client.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                return { ...client, status };
            });

            processedClients.sort((a, b) => new Date(b.dataUltimaVisita).getTime() - new Date(a.dataUltimaVisita).getTime());
            setClients(processedClients);
        }
        setLoading(false);
    };

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const matchesSearch = client.nome.toLowerCase().includes(searchTerm.toLowerCase()) || client.telefone.includes(searchTerm);
            const matchesFilter = activeFilter === 'todos' || client.status === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [searchTerm, activeFilter, clients]);

    const getStatusStyle = (status: ClientStatus) => {
        switch (status) {
            case 'vip': return 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20 shadow-[0_0_10px_rgba(212,175,55,0.1)]';
            case 'risco': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'novo': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'; // Mudei novo para Azul pra destacar
            default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
        }
    };

    // --- AÇÃO SEGURA: Sempre vai para o Inbox ---
    const handleGoToInbox = () => {
        navigate('/inbox');
    };

    return (
        <div className="h-full flex flex-col bg-zinc-950 p-6 overflow-hidden relative">
            {/* Header */}
            <div className="shrink-0 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <User className="text-[#d4af37]" size={32} />
                        Carteira de Clientes
                    </h1>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">
                        {clients.length} Clientes Identificados
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchClients}
                        className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:text-[#d4af37] text-zinc-500 transition-all hover:border-[#d4af37]/30"
                        title="Atualizar Lista"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="shrink-0 flex flex-col lg:flex-row gap-6 mb-8">
                <div className="lg:w-1/3 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#d4af37] transition-colors" size={18} />
                    <input
                        placeholder="Buscar por nome ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white focus:border-[#d4af37]/50 outline-none transition-all placeholder:text-zinc-700"
                    />
                </div>
                <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide items-center">
                    {['todos', 'vip', 'risco', 'novo'].map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f as any)}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border whitespace-nowrap ${activeFilter === f ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-lg shadow-[#d4af37]/20 scale-105' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'}`}
                        >
                            {f === 'todos' ? 'Todos' : f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-full gap-4">
                        <Loader2 size={40} className="animate-spin text-[#d4af37]" />
                        <span className="text-zinc-500 text-xs uppercase tracking-widest animate-pulse">Processando dados...</span>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-800">
                        <AlertCircle size={80} className="opacity-10 mb-6" />
                        <p className="font-serif font-black text-xl uppercase tracking-widest opacity-20">Nenhum cliente encontrado</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredClients.map((client, idx) => (
                            <motion.div
                                key={client.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-6 rounded-[32px] border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm hover:border-[#d4af37]/30 hover:bg-zinc-900/60 transition-all duration-300 group relative overflow-hidden"
                            >
                                {/* Faixa de Risco */}
                                {client.status === 'risco' && (
                                    <div className="absolute top-0 left-0 w-1 h-full bg-red-600/50" />
                                )}

                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[#d4af37] font-serif font-black text-lg shadow-inner uppercase">
                                            {client.nome.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white leading-tight truncate max-w-[150px]">{client.nome}</h3>
                                            <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(client.status)}`}>
                                                {client.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleGoToInbox}
                                            className="p-2.5 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-xl transition-colors"
                                            title="Mensagem"
                                        >
                                            <MessageSquare size={16} />
                                        </button>

                                        <button
                                            onClick={() => setSelectedClient(client)}
                                            className="p-2.5 bg-zinc-800 text-zinc-400 hover:text-[#d4af37] hover:bg-zinc-700 rounded-xl transition-colors"
                                            title="Histórico"
                                        >
                                            <Clock size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-4 border-t border-zinc-800/50 border-b border-zinc-800/50 mb-4">
                                    <div>
                                        <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mb-1">Total Investido</p>
                                        <p className="text-white font-black text-lg tracking-tighter flex items-center gap-1">
                                            <span className="text-[#d4af37] text-xs">R$</span> {client.valorGasto.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mb-1">Última Visita</p>
                                        <p className="text-zinc-300 font-bold text-sm uppercase">
                                            {format(parseISO(client.dataUltimaVisita), "dd MMM yy", { locale: ptBR }).replace('.', '')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                    <span className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-900">
                                        <Scissors size={12} /> {client.totalVisitas} Cortes
                                    </span>

                                    {/* Link Telefone -> Inbox */}
                                    <button onClick={handleGoToInbox} className="flex items-center gap-1 hover:text-white transition-colors">
                                        <Phone size={12} /> {client.telefone} <ArrowRight size={10} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL DE HISTÓRICO CORRIGIDO (Z-INDEX ALTO) */}
            <AnimatePresence>
                {selectedClient && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] relative"
                        >
                            <div className="p-6 border-b border-zinc-800 bg-zinc-950 rounded-t-3xl flex justify-between items-center shrink-0">
                                <div>
                                    <h3 className="text-xl font-serif font-black text-white italic">{selectedClient.nome}</h3>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Histórico Completo</p>
                                </div>
                                <button
                                    onClick={() => setSelectedClient(null)}
                                    className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-3">
                                {selectedClient.history.length === 0 ? (
                                    <p className="text-center text-zinc-500 py-8">Nenhum histórico detalhado disponível.</p>
                                ) : (
                                    selectedClient.history.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-zinc-800/50 hover:border-[#d4af37]/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-zinc-900 rounded-xl text-[#d4af37] border border-zinc-800">
                                                    <Scissors size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-sm">{item.service}</p>
                                                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                                                        {format(parseISO(item.date), "dd 'de' MMMM • HH:mm", { locale: ptBR })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[#d4af37] font-black text-sm">R$ {item.price.toFixed(2)}</p>
                                                <p className="text-zinc-600 text-[9px] font-bold uppercase">{item.professional}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-6 bg-zinc-950 border-t border-zinc-800 rounded-b-3xl flex justify-between items-center shrink-0">
                                <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Total Investido</span>
                                <span className="text-2xl font-serif font-black text-white">R$ {selectedClient.valorGasto.toFixed(2)}</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}