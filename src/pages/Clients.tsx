import { useState, useEffect } from 'react';
import { Search, Plus, Phone, Trash2, Edit2, User, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

interface Client {
    id?: string; // ID from 'clients' table (optional if only from appointments)
    name: string;
    phone: string;
    total_appointments: number;
    last_visit: string | null;
    source: 'registered' | 'history';
}

export default function Clients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchClientsData();
    }, []);

    const fetchClientsData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Registered Clients
            const { data: registeredData, error: regError } = await supabase
                .from('clientes')
                .select('*');

            if (regError) throw regError;

            // 2. Fetch Appointments for History Aggregation
            // Optimization: We could use specific date ranges or limits, but for now fetching all for accurate history
            const { data: appointmentsData, error: apptError } = await supabase
                .from('agendamentos')
                .select('cliente_nome, cliente_telefone, data_horario');

            if (apptError) throw apptError;

            // 3. Process & Merge Data
            const clientMap = new Map<string, Client>();

            // A. Process Appointments (History)
            appointmentsData?.forEach(appt => {
                const phone = appt.cliente_telefone || 'SEM_TELEFONE';
                // Clean phone slightly for matching if needed, but assuming consistency for now

                const existing = clientMap.get(phone);

                if (existing) {
                    existing.total_appointments += 1;
                    if (appt.data_horario > (existing.last_visit || '')) {
                        existing.last_visit = appt.data_horario;
                    }
                    // Keep most recent name if needed, or rely on registered
                } else {
                    clientMap.set(phone, {
                        name: appt.cliente_nome,
                        phone: phone,
                        total_appointments: 1,
                        last_visit: appt.data_horario,
                        source: 'history'
                    });
                }
            });

            // B. Process Registered Clients (Overlay)
            registeredData?.forEach((reg: any) => {
                const phone = reg.telefone;
                const name = reg.nome;

                const existing = clientMap.get(phone);
                if (existing) {
                    existing.id = reg.id;
                    existing.name = name; // Authoritative name
                    existing.source = 'registered';
                } else {
                    clientMap.set(phone, {
                        id: reg.id,
                        name: name,
                        phone: phone,
                        total_appointments: 0,
                        last_visit: null,
                        source: 'registered'
                    });
                }
            });

            // Convert to Array & Remove 'SEM_TELEFONE' junk if any
            const mergedList = Array.from(clientMap.values()).filter(c => c.phone !== 'SEM_TELEFONE');

            // Sort by Name
            mergedList.sort((a, b) => a.name.localeCompare(b.name));

            setClients(mergedList);

        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (phone: string, id?: string) => {
        if (!confirm('Tem certeza que deseja remover este cliente? O histórico de agendamentos será mantido, mas o cadastro será removido.')) return;

        // If it's a registered client, delete from DB
        if (id) {
            const { error } = await supabase.from('clientes').delete().eq('id', id);
            if (error) {
                alert('Erro ao excluir do banco de dados');
                return;
            }
        }

        // Use optimistic update for UI
        setClients(prev => prev.filter(c => c.phone !== phone));
    };

    const handleWhatsApp = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    return (
        <div className="h-full flex flex-col bg-zinc-950 p-4 md:p-8 overflow-hidden">
            {/* Header */}
            <div className="shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <User className="text-[#d4af37]" size={32} />
                        Clientes
                    </h1>
                    <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">
                        Gerenciamento & Histórico
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar nome ou telefone..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-[#d4af37] transition-colors"
                        />
                    </div>
                    <button className="bg-[#d4af37] text-black px-4 py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-[#ffe180] transition-colors flex items-center gap-2 shadow-lg shadow-[#d4af37]/20">
                        <Plus size={16} /> <span className="hidden md:inline">Novo Cliente</span>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-zinc-800 bg-zinc-900 shadow-md">
                                <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Cliente</th>
                                <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Telefone</th>
                                <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Agendamentos</th>
                                <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Última Visita</th>
                                <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-zinc-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 size={24} className="animate-spin" />
                                            <span className="text-xs uppercase tracking-widest">Carregando carteira de clientes...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-zinc-500 text-sm">
                                        Nenhum cliente encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map((client, idx) => (
                                    <motion.tr
                                        key={client.id || client.phone}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="hover:bg-zinc-900/50 group transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-[#d4af37] font-bold border border-zinc-700">
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-zinc-200">{client.name}</div>
                                                    {client.source === 'registered' && (
                                                        <div className="text-[9px] text-[#d4af37] uppercase tracking-widest font-black flex items-center gap-1">
                                                            <User size={8} /> Cadastrado
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleWhatsApp(client.phone)}
                                                className="flex items-center gap-2 text-zinc-400 hover:text-green-500 transition-colors text-sm font-mono group/phone"
                                            >
                                                <Phone size={14} />
                                                <span className="group-hover/phone:underline">{client.phone}</span>
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300">
                                                {client.total_appointments}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-zinc-400">
                                            {client.last_visit
                                                ? new Date(client.last_visit).toLocaleDateString()
                                                : <span className="text-zinc-600">-</span>
                                            }
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(client.phone, client.id)}
                                                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
