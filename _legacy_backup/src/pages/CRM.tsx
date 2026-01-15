import { useState, useMemo } from 'react';
import { Search, AlertCircle, User, ArrowUpRight, Calendar, DollarSign, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

type ClientStatus = 'qualificado' | 'agendado' | 'risco' | 'vip' | 'novo';

interface ClientCRM {
    id: number;
    nome: string;
    telefone: string;
    ultimoServico: string;
    dataUltimaVisita: string;
    valorGasto: number;
    status: ClientStatus;
}

const CRM_DATA: ClientCRM[] = [
    { id: 1, nome: "Ricardo Oliveira", telefone: "(11) 99999-9999", ultimoServico: "Corte / Barba", dataUltimaVisita: "2023-12-15", valorGasto: 1450.00, status: 'vip' },
    { id: 2, nome: "Fabio Santos", telefone: "(11) 98888-8888", ultimoServico: "Degradê", dataUltimaVisita: "2023-11-20", valorGasto: 350.00, status: 'risco' },
    { id: 3, nome: "Marcos Lima", telefone: "(11) 97777-7777", ultimoServico: "Barba Royal", dataUltimaVisita: "2023-12-28", valorGasto: 120.00, status: 'novo' },
    { id: 4, nome: "André Souza", telefone: "(11) 96666-6666", ultimoServico: "Limpeza Pele", dataUltimaVisita: "2023-12-10", valorGasto: 890.00, status: 'vip' },
    { id: 5, nome: "Julio Cesar", telefone: "(11) 95555-5555", ultimoServico: "Corte Social", dataUltimaVisita: "2023-10-05", valorGasto: 45.00, status: 'risco' },
];

export default function CRM() {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<'todos' | ClientStatus>('todos');

    const filteredClients = useMemo(() => {
        return CRM_DATA.filter(client => {
            const matchesSearch = client.nome.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = activeFilter === 'todos' || client.status === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [searchTerm, activeFilter]);

    const getStatusStyle = (status: ClientStatus) => {
        switch (status) {
            case 'vip': return 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20';
            case 'risco': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'novo': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black text-white tracking-tighter uppercase drop-shadow-2xl">
                        Intelligence <span className="text-[#d4af37]">CRM</span>
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Client Base & Loyalty Matrix</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-6 py-3 bg-[#d4af37] text-black rounded-2xl font-serif font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl">
                        Export Full Base
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
                <div className="lg:col-span-3 flex gap-2 overflow-x-auto scrollbar-hide">
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredClients.map(client => (
                    <div key={client.id} className="p-8 rounded-[40px] border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-[#d4af37]/30 group relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <User size={80} />
                        </div>

                        <div className="flex justify-between items-start mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center text-[#d4af37] font-serif font-black text-xl shadow-inner group-hover:border-[#d4af37]/50 transition-all">
                                {client.nome.substring(0, 1)}
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(client.status)}`}>
                                {client.status}
                            </span>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-serif font-black text-white uppercase tracking-tight group-hover:text-[#d4af37] transition-all">{client.nome}</h3>
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
                                    {format(new Date(client.dataUltimaVisita), "MMM yyyy")}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-8">
                            <button className="flex-1 py-3 bg-zinc-950/80 border border-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:text-white hover:border-[#d4af37]/30 transition-all flex items-center justify-center gap-2">
                                <Calendar size={12} /> Agenda
                            </button>
                            <button className="p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                                <ArrowUpRight size={18} />
                            </button>
                        </div>

                        {client.status === 'risco' && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-transparent opacity-40" />
                        )}
                    </div>
                ))}
            </div>

            {/* EMPTY STATE */}
            {filteredClients.length === 0 && (
                <div className="py-40 flex flex-col items-center justify-center text-zinc-800">
                    <AlertCircle size={80} className="opacity-10 mb-6" />
                    <p className="font-serif font-black text-xl uppercase tracking-widest opacity-20">No Client Data Found</p>
                </div>
            )}
        </div>
    );
}
