
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Clock, DollarSign, X } from 'lucide-react';

// Types
interface Service {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('services');
    const [services, setServices] = useState<Service[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form state
    const [newService, setNewService] = useState({ name: '', price: '' });
    // Split duration state for better UX
    const [durationHours, setDurationHours] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('30');

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveService = async () => {
        // Validation
        if (!newService.name || !newService.price) return;

        // Calculate total minutes
        const h = parseInt(durationHours) || 0;
        const m = parseInt(durationMinutes) || 0;
        const totalMinutes = (h * 60) + m;

        if (totalMinutes === 0) {
            alert("A duração deve ser maior que 0.");
            return;
        }

        try {
            const { error } = await supabase.from('services').insert([{
                name: newService.name,
                price: parseFloat(newService.price.toString().replace(',', '.')), // Handle comma decimals if user types them
                duration_minutes: totalMinutes
            }]);

            if (error) throw error;

            setShowModal(false);
            setNewService({ name: '', price: '' });
            setDurationHours('');
            setDurationMinutes('30');
            fetchServices();
        } catch (error) {
            console.error('Error saving service:', error);
            alert('Erro ao salvar serviço');
        }
    };

    const handleDeleteService = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

        try {
            const { error } = await supabase.from('services').delete().eq('id', id);
            if (error) throw error;
            fetchServices();
        } catch (error) {
            console.error('Error deleting service:', error);
        }
    };

    return (
        <div className="space-y-8 pb-32 p-6">
            {/* Header */}
            <header>
                <h1 className="text-3xl font-serif font-black text-white tracking-tighter uppercase drop-shadow-2xl mb-1">
                    Configurações
                </h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Gestão do Sistema</p>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-zinc-800 pb-1">
                <button
                    onClick={() => setActiveTab('services')}
                    className={`pb-3 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'services' ? 'text-[#d4af37] border-b-2 border-[#d4af37]' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                    Serviços
                </button>
                {/* Add more tabs here later if needed */}
            </div>

            {/* Content */}
            {activeTab === 'services' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Catálogo de Serviços</h2>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-[#d4af37] text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#b5952f] transition-colors shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] hover:scale-105 active:scale-95"
                        >
                            <Plus size={18} /> Novo Serviço
                        </button>
                    </div>

                    {/* List */}
                    <div className="grid gap-4">
                        {loading ? <p className="text-zinc-500 italic">Carregando serviços...</p> : services.length === 0 ? <p className="text-zinc-600 italic">Nenhum serviço cadastrado.</p> : services.map(service => (
                            <motion.div
                                key={service.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between group hover:border-[#d4af37]/30 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-[#d4af37] font-black group-hover:bg-[#d4af37] group-hover:text-black transition-colors">
                                        {service.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white uppercase tracking-tight">{service.name}</h3>
                                        <div className="flex gap-4 mt-1 text-xs font-medium text-zinc-400">
                                            <span className="flex items-center gap-1"><Clock size={12} /> {service.duration_minutes} min</span>
                                            <span className="flex items-center gap-1 text-[#d4af37]"><DollarSign size={12} /> R$ {service.price.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteService(service.id)}
                                    className="p-3 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                    title="Excluir Serviço"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md space-y-8 shadow-2xl relative"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-serif font-black text-white italic">Novo Serviço</h3>
                                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nome do Serviço</label>
                                    <input
                                        type="text"
                                        value={newService.name}
                                        onChange={e => setNewService({ ...newService, name: e.target.value })}
                                        className="w-full bg-black/50 border border-zinc-800 rounded-xl p-4 text-white text-sm font-medium focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none transition-all"
                                        placeholder="Ex: Corte Cabelo"
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Preço (R$)</label>
                                        <input
                                            type="number"
                                            value={newService.price}
                                            onChange={e => setNewService({ ...newService, price: e.target.value })}
                                            className="w-full bg-black/50 border border-zinc-800 rounded-xl p-4 text-white text-sm font-medium focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Duração</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={durationHours}
                                                    onChange={e => setDurationHours(e.target.value)}
                                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl p-4 text-white text-sm font-medium focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none transition-all text-center"
                                                    placeholder="0"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600 uppercase">H</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={durationMinutes}
                                                    onChange={e => setDurationMinutes(e.target.value)}
                                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl p-4 text-white text-sm font-medium focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none transition-all text-center"
                                                    placeholder="0"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600 uppercase">MIN</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-zinc-800/20 rounded-lg p-3 border border-dashed border-zinc-800 text-center">
                                    <span className="text-zinc-500 text-xs font-medium">
                                        Tempo Total: <span className="text-[#d4af37] font-bold">{(parseInt(durationHours) || 0) * 60 + (parseInt(durationMinutes) || 0)} minutos</span>
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveService}
                                className="w-full bg-[#d4af37] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-[#b5952f] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                            >
                                Salvar Serviço
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
