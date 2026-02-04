import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Clock, DollarSign, X, User, Scissors, Key, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Types
interface Service {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
    professional: string | null;
}

interface Professional {
    id: string;
    nome: string;
    cargo: string;
    user_id: string | null; // Para saber se já tem login
}

export default function SettingsPage() {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<'services' | 'team'>('services');

    // Data States
    const [services, setServices] = useState<Service[]>([]);
    const [team, setTeam] = useState<Professional[]>([]);

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Loading States
    const [loading, setLoading] = useState(true);
    const [creatingLogin, setCreatingLogin] = useState(false);

    // Forms State
    const [newService, setNewService] = useState({ name: '', price: '', professional: '' });
    const [newMember, setNewMember] = useState({ nome: '', cargo: 'barbeiro' });
    const [newLogin, setNewLogin] = useState({ email: '', password: '', memberId: '' });

    // Duration
    const [durationHours, setDurationHours] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('30');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: servicesData } = await supabase.from('services').select('*').order('created_at', { ascending: false });
            const { data: teamData } = await supabase.from('perfis').select('*').order('nome');

            if (servicesData) setServices(servicesData);
            if (teamData) setTeam(teamData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- INTEGRACAO COM N8N PARA CRIAR LOGIN ---
    const handleCreateLogin = async () => {
        if (!newLogin.email || !newLogin.password) return alert("Preencha email e senha");

        setCreatingLogin(true);
        try {
            // Chama o n8n para criar o usuário no Supabase Auth e vincular ao perfil
            // IMPORTANTE: Mantenha a URL do seu webhook do n8n correta aqui
            const response = await fetch('https://n8n.ascendpanel.com.br/webhook/criar-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newLogin.email,
                    password: newLogin.password,
                    member_id: newLogin.memberId
                })
            });

            if (response.ok) {
                alert("Acesso criado com sucesso!");
                setShowLoginModal(false);
                setNewLogin({ email: '', password: '', memberId: '' });
                fetchData(); // Recarrega para mostrar que já tem login
            } else {
                alert("Erro ao criar login. Verifique se o email já existe ou se o n8n está ativo.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão com o servidor de automação.");
        } finally {
            setCreatingLogin(false);
        }
    };

    const openLoginModal = (member: Professional) => {
        setNewLogin({ email: '', password: '', memberId: member.id });
        setShowLoginModal(true);
    }

    // --- FUNCOES PADRAO (SALVAR/DELETAR) ---
    const handleSaveService = async () => {
        if (!newService.name || !newService.price) return;
        const h = parseInt(durationHours) || 0;
        const m = parseInt(durationMinutes) || 0;
        const totalMinutes = (h * 60) + m;

        try {
            await supabase.from('services').insert([{
                name: newService.name,
                price: parseFloat(newService.price.toString().replace(',', '.')),
                duration_minutes: totalMinutes,
                professional: newService.professional || null
            }]);
            closeModal();
            fetchData();
        } catch (error) { alert('Erro ao salvar serviço'); }
    };

    const handleSaveMember = async () => {
        if (!newMember.nome) return;
        try {
            // Agora o user_id vai como NULL automaticamente pelo banco, sem erro
            await supabase.from('perfis').insert([{ nome: newMember.nome, cargo: newMember.cargo }]);
            closeModal();
            fetchData();
        } catch (error: any) { alert('Erro: ' + error.message); }
    };

    const handleDelete = async (table: 'services' | 'perfis', id: string) => {
        if (!confirm('Tem certeza?')) return;
        await supabase.from(table).delete().eq('id', id);
        fetchData();
    };

    const closeModal = () => {
        setShowModal(false);
        setNewService({ name: '', price: '', professional: '' });
        setNewMember({ nome: '', cargo: 'barbeiro' });
    };

    return (
        <div className="space-y-8 pb-32 p-6">
            <header>
                <h1 className="text-3xl font-serif font-black text-white tracking-tighter uppercase drop-shadow-2xl mb-1">Configurações</h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Gestão do Sistema</p>
            </header>

            <div className="flex gap-6 border-b border-zinc-800 pb-1">
                <button onClick={() => setActiveTab('services')} className={`pb-3 text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${activeTab === 'services' ? 'text-[#d4af37] border-b-2 border-[#d4af37]' : 'text-zinc-600 hover:text-zinc-400'}`}>
                    <Scissors size={16} /> Serviços
                </button>
                <button onClick={() => setActiveTab('team')} className={`pb-3 text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${activeTab === 'team' ? 'text-[#d4af37] border-b-2 border-[#d4af37]' : 'text-zinc-600 hover:text-zinc-400'}`}>
                    <User size={16} /> Equipe
                </button>
            </div>

            {/* ABA SERVIÇOS */}
            {activeTab === 'services' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Catálogo</h2>
                        <button onClick={() => setShowModal(true)} className="bg-[#d4af37] text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#b5952f]">
                            <Plus size={18} /> Novo Serviço
                        </button>
                    </div>
                    <div className="grid gap-4">
                        {loading ? <p className="text-zinc-500">Carregando...</p> : services.map(service => (
                            <div key={service.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between group hover:border-[#d4af37]/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-[#d4af37] font-black">
                                        {service.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white uppercase">{service.name}</h3>
                                        <div className="flex gap-4 mt-1 text-xs text-zinc-400">
                                            <span className="flex items-center gap-1"><Clock size={12} /> {service.duration_minutes} min</span>
                                            <span className="flex items-center gap-1 text-[#d4af37]"><DollarSign size={12} /> R$ {service.price.toFixed(2)}</span>
                                            <span className="bg-zinc-800 px-2 rounded text-[10px] uppercase">{service.professional || 'Todos'}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete('services', service.id)} className="p-3 text-zinc-600 hover:text-red-500"><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ABA EQUIPE */}
            {activeTab === 'team' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Membros</h2>
                        <button onClick={() => setShowModal(true)} className="bg-[#d4af37] text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#b5952f]">
                            <Plus size={18} /> Novo Membro
                        </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {loading ? <p className="text-zinc-500">Carregando...</p> : team.map(member => (
                            <div key={member.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between hover:border-[#d4af37]/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-[#d4af37] font-black">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white uppercase text-lg">{member.nome}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-xs font-bold bg-[#d4af37]/10 text-[#d4af37] px-2 py-1 rounded uppercase">{member.cargo}</span>
                                            {member.user_id ? (
                                                <span className="text-xs font-bold bg-green-500/10 text-green-500 px-2 py-1 rounded uppercase flex items-center gap-1"><CheckCircle2 size={10} /> Acesso OK</span>
                                            ) : (
                                                <button onClick={() => openLoginModal(member)} className="text-xs font-bold bg-zinc-800 text-zinc-400 hover:text-white px-2 py-1 rounded uppercase flex items-center gap-1 hover:bg-zinc-700 transition-colors">
                                                    <Key size={10} /> Criar Acesso
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete('perfis', member.id)} className="p-3 text-zinc-600 hover:text-red-500"><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL CRIAÇÃO (Serviço/Membro) */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md space-y-6 shadow-2xl relative">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-serif font-black text-white italic">{activeTab === 'services' ? 'Novo Serviço' : 'Novo Profissional'}</h3>
                                <button onClick={closeModal} className="text-zinc-500 hover:text-white"><X size={24} /></button>
                            </div>

                            {activeTab === 'services' ? (
                                <div className="space-y-4">
                                    <input value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} placeholder="Nome (ex: Corte)" className="w-full bg-black/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-[#d4af37] outline-none" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="number" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} placeholder="Preço (R$)" className="w-full bg-black/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-[#d4af37] outline-none" />
                                        <select value={newService.professional} onChange={e => setNewService({ ...newService, professional: e.target.value })} className="w-full bg-black/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-[#d4af37] outline-none">
                                            <option value="">Todos</option>
                                            {team.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                                        </select>
                                    </div>

                                    {/* Duração */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase">Duração (H : MIN)</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="number" value={durationHours} onChange={e => setDurationHours(e.target.value)} placeholder="0 H" className="w-full bg-black/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-[#d4af37] outline-none text-center" />
                                            <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} placeholder="0 Min" className="w-full bg-black/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-[#d4af37] outline-none text-center" />
                                        </div>
                                    </div>

                                    <button onClick={handleSaveService} className="w-full bg-[#d4af37] text-black font-black uppercase py-4 rounded-xl hover:bg-[#b5952f]">Salvar Serviço</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <input value={newMember.nome} onChange={e => setNewMember({ ...newMember, nome: e.target.value })} placeholder="Nome Completo" className="w-full bg-black/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-[#d4af37] outline-none" />
                                    <select value={newMember.cargo} onChange={e => setNewMember({ ...newMember, cargo: e.target.value })} className="w-full bg-black/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-[#d4af37] outline-none">
                                        <option value="barbeiro">Barbeiro</option>
                                        <option value="trancista">Trancista</option>
                                        <option value="recepcao">Recepção</option>
                                        <option value="dono">Dono</option>
                                    </select>
                                    <button onClick={handleSaveMember} className="w-full bg-[#d4af37] text-black font-black uppercase py-4 rounded-xl hover:bg-[#b5952f]">Salvar Membro</button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL CRIAR LOGIN */}
            <AnimatePresence>
                {showLoginModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md space-y-6 shadow-2xl relative">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-serif font-black text-white italic">Criar Acesso</h3>
                                <button onClick={() => setShowLoginModal(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
                            </div>
                            <div className="space-y-4">
                                <p className="text-zinc-500 text-sm">Defina o email e senha para este membro fazer login.</p>
                                <input type="email" value={newLogin.email} onChange={e => setNewLogin({ ...newLogin, email: e.target.value })} placeholder="Email de Acesso" className="w-full bg-black/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-[#d4af37] outline-none" />
                                <input type="password" value={newLogin.password} onChange={e => setNewLogin({ ...newLogin, password: e.target.value })} placeholder="Senha Provisória" className="w-full bg-black/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-[#d4af37] outline-none" />
                                <button onClick={handleCreateLogin} disabled={creatingLogin} className="w-full bg-[#d4af37] text-black font-black uppercase py-4 rounded-xl hover:bg-[#b5952f] flex items-center justify-center gap-2">
                                    {creatingLogin ? <Loader2 className="animate-spin" /> : <><Key size={18} /> Gerar Login</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}