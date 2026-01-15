import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { format, addDays, startOfWeek, isSameDay, parseISO, isSameMonth, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Scissors as ScissorsIcon, Trash2, MessageCircle, Clock, CalendarClock, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

// NOVA TABELA DE PREÇOS - CARTEL 96
// NOVA TABELA DE PREÇOS - CARTEL 96
// NOTE: These IDs are used for fallback/display only. 
// REAL UUIDs come from the database now.
const HARDCODED_SERVICES_FALLBACK = [
    { id: 'degrade', nome: 'Corte Degradê', preco: 45, duration: 45 },
    { id: 'tesoura', nome: 'Corte na Tesoura', preco: 45, duration: 45 },
    { id: 'social', nome: 'Corte Social', preco: 40, duration: 30 },
    { id: 'raspado', nome: 'Raspado (Máquina)', preco: 30, duration: 30 },
    { id: 'barba', nome: 'Barba', preco: 40, duration: 30 },
    { id: 'custom', nome: 'Outro / Personalizado (Digitar)', preco: 0, duration: 60 }
];

// --- TYPES ---
interface Appointment {
    id: any;
    cliente_nome: string;
    cliente_telefone?: string;
    servico_id?: any;
    servico_nome: string;
    data_horario: string;
    barbeiro_id: any;
    barbeiro_nome?: string; // Optional for multi-view
    status: 'agendado' | 'atendimento' | 'finalizado' | 'cancelado' | 'noshow';
    valor_total: number;
}

// --- MEMOIZED COMPONENTS ---

const TimeSlot = React.memo(({
    time,
    date,
    children,
    onDrop,
    onClick
}: {
    time: string;
    date: Date;
    children?: React.ReactNode;
    onDrop: (date: Date, time: string, droppedId: string) => void;
    onClick: () => void;
}) => {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => setIsOver(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        const droppedId = e.dataTransfer.getData("text/plain");
        if (droppedId) {
            onDrop(date, time, droppedId);
        }
    };

    return (
        <div
            // GRID FIX: Added cursor-pointer relative z-10
            className={`relative transition-all duration-300 border-b border-zinc-900/40 cursor-pointer z-10 ${isOver ? 'bg-[#d4af37]/20 shadow-[inset_0_0_20px_rgba(212,175,55,0.3)]' : 'hover:bg-zinc-900/20'}`}
            style={{ minHeight: '100px' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={onClick}
        >
            {children}
            {isOver && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-[#d4af37] font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">
                        SOLTAR PARA REAGENDAR
                    </div>
                </div>
            )}
        </div>
    );
});

const AppointmentCard = React.memo(({
    appt,
    onClick,
    onDragStart,
    className,
    showBarber
}: {
    appt: Appointment;
    onClick: (e: React.MouseEvent) => void;
    onDragStart: (e: React.DragEvent, id: any) => void;
    className?: string; // Custom class support
    showBarber?: boolean;
}) => {
    return (
        <motion.div
            layoutId={appt.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`z-10 cursor-grab active:cursor-grabbing ${className || 'absolute inset-2'}`}
            draggable
            onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, appt.id)}
            onClick={onClick}
            whileHover={{ scale: 1.02, zIndex: 20 }}
            whileDrag={{ opacity: 0.5, scale: 0.95 }}
        >
            <div className={`h-full w-full rounded-2xl p-4 flex flex-col justify-center border shadow-xl backdrop-blur-md transition-all ${appt.status === 'atendimento' ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-zinc-950 text-stone-200 border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'}`}>
                <div className="flex justify-between items-start">
                    <div className="text-sm font-black uppercase truncate tracking-tight">{appt.cliente_nome}</div>
                    {appt.status === 'agendado' && <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />}
                </div>
                <div className="text-[10px] opacity-60 font-bold uppercase flex items-center gap-2 mt-1">
                    <ScissorsIcon size={12} /> {appt.servico_nome}
                </div>
                {showBarber && appt.barbeiro_nome && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-[9px] font-black uppercase tracking-wider opacity-80 text-[#d4af37]">
                        {appt.barbeiro_nome}
                    </div>
                )}
            </div>
        </motion.div>
    );
});

// --- MAIN COMPONENT ---

export default function Agenda() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    const [activeManagement, setActiveManagement] = useState<Appointment | null>(null);
    const [selectedSlotData, setSelectedSlotData] = useState<Appointment[] | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        id: null as any,
        cliente_nome: '',
        cliente_telefone: '',
        servico_id: '',
        barbeiro_id: '',
        data_horario: ''
    });
    // Custom Service State
    const [customDescription, setCustomDescription] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    // Auth
    const { profile } = useAuth();
    const [availableServices, setAvailableServices] = useState<any[]>([]);
    const [barbers, setBarbers] = useState<any[]>([]);

    const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
    const [isSaving, setIsSaving] = useState(false);

    // Initialize Filter based on Role
    useEffect(() => {
        if (profile) {
            if (profile?.cargo === 'barbeiro') {
                setSelectedBarberId(profile.id);
            }
            // Owners default to 'all' or keep existing selection
        }
    }, [profile]);

    // Initial Data Fetch
    const fetchData = useCallback(async (date: Date) => {
        const start = startOfMonth(date).toISOString();
        const end = endOfMonth(date).toISOString();

        console.log("Fetching for Barber:", selectedBarberId);

        // 1. Fetch from Supabase
        let query = supabase
            .from('agendamentos')
            .select(`
                *,
                servico_nome,
                servicos (
                    *
                )
            `)
            .gte('data_horario', start)
            .lte('data_horario', end);

        // Apply Filter if not 'all'
        // FIX: Ensure filter is applied if ID is valid and not 'all'
        if (selectedBarberId && selectedBarberId !== 'all') {
            console.log("🔍 Filtering by Barber ID:", selectedBarberId);
            query = query.eq('barbeiro_id', selectedBarberId);
        }

        const { data, error } = await query;

        let mergedAppointments: Appointment[] = [];

        // 2. Load from LocalStorage (Source of Truth for Demo)
        const localData = localStorage.getItem('demo_appointments');
        const localAppointments: Appointment[] = localData ? JSON.parse(localData) : [];

        if (!error && data) {
            console.log("🐛 DEBUG DATA SOURCE: Data from Supabase:", data);
            const serverAppointments = data.map((d: any) => {
                // LÓGICA DE PRIORIDADE DE EXIBIÇÃO:
                // 1º: Tenta ler o nome gravado no banco (para personalizados e novos agendamentos e históricos)
                // 2º: Se não tiver, tenta achar pelo ID na lista fixa (para compatibilidade antiga ou fallback)
                // 3º: Se falhar tudo, mostra um texto padrão 'Serviço Extra'.

                const dbName = d.servico_nome;
                const relationName = d.servicos?.nome || d.servicos?.titulo || d.servicos?.label || d.servicos?.name;
                // Check both servico_id and servico for the ID
                const staticId = d.servico_id || d.servico;
                const staticName = HARDCODED_SERVICES_FALLBACK.find(s => s.id === staticId)?.nome;

                const serviceName = dbName || relationName || staticName || 'Serviço Extra';

                return {
                    ...d,
                    servico_nome: serviceName
                };
            });

            // Merge Strategy: Keep local items that are NOT in server (by ID) + Server items
            mergedAppointments = [
                ...serverAppointments,
                ...localAppointments.filter(local => !serverAppointments.find((server: any) => server.id === local.id))
            ];
        } else {
            console.error("Error fetching appointments:", error);
            // Fallback
            mergedAppointments = localAppointments;
        }

        setAppointments(mergedAppointments);
    }, [selectedBarberId]);

    useEffect(() => {
        fetchData(currentDate);
    }, [currentDate.getMonth(), currentDate.getFullYear(), fetchData, selectedBarberId]);




    useEffect(() => {
        const fetchServices = async () => {
            const { data, error } = await supabase.from('servicos').select('*');
            if (data && data.length > 0) {
                console.log("📦 LOADED SERVICES (DB):", data);
                // Append 'custom' option if needed, using a special ID key for custom behavior logic
                // For now, let's assume 'custom' needs to be handled.
                // If the DB doesn't have a 'custom' entry, we manually add a UI-only option.
                // We'll give it a fake UUID-like string or handle 'custom' specifically in submit.

                // Check if 'custom' is in DB or we need to append
                setAvailableServices([...data, { id: 'custom', nome: 'Outro / Personalizado', preco: 0 }]);
            } else {
                // Fallback if DB is empty
                console.log("⚠️ No services in DB, using fallback");
                setAvailableServices(HARDCODED_SERVICES_FALLBACK);
            }
            if (error) console.error("Error fetching services:", error);
        };
        fetchServices();

        const fetchBarbers = async () => {
            const { data } = await supabase.from('perfis').select('*').in('cargo', ['barbeiro', 'admin', 'dono']); // Fetch all who can receive appointments
            if (data) {
                console.log("✂️ LOADED BARBERS (DB):", data);
                setBarbers(data);
            }
        };
        fetchBarbers();
    }, []);

    // Helpers
    const showToast = (msg: string) => {
        // setNotification(msg);
        console.log("Toast:", msg);
        // setTimeout(() => setNotification(null), 3000);
    };

    const timeSlots = useMemo(() => Array.from({ length: 14 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`), []);

    // --- ACTIONS ---

    const handleDragStart = useCallback((e: React.DragEvent, id: any) => {
        e.dataTransfer.setData("text/plain", id);
        e.dataTransfer.effectAllowed = "move";
    }, []);

    const processDrop = useCallback(async (date: Date, time: string, droppedId: string) => {
        const appt = appointments.find(a => a.id == droppedId);
        if (!appt) return;

        const [hour, minute] = time.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hour, minute, 0, 0);
        const isoDate = newDate.toISOString();

        // Optimistic Update
        const updatedAppointments = appointments.map(a => a.id == droppedId ? { ...a, data_horario: isoDate } : a);
        setAppointments(updatedAppointments);
        localStorage.setItem('demo_appointments', JSON.stringify(updatedAppointments));
        showToast("Horário atualizado com sucesso");
        await supabase.from('agendamentos').update({ data_horario: isoDate }).eq('id', droppedId);
    }, [appointments]);

    const handleDelete = async (id: any) => {
        const updated = appointments.filter(a => a.id !== id);
        setAppointments(updated);
        localStorage.setItem('demo_appointments', JSON.stringify(updated));
        setActiveManagement(null);
        showToast("Agendamento excluído");
        await supabase.from('agendamentos').delete().eq('id', id);
    };

    const handleEdit = (appt: Appointment) => {
        // 1. Defina os dados do formulário
        setFormData({
            id: appt.id,
            cliente_nome: appt.cliente_nome,
            cliente_telefone: appt.cliente_telefone || '',
            servico_id: appt.servico_id || availableServices.find(s => s.nome === appt.servico_nome)?.id || '',
            barbeiro_id: appt.barbeiro_id,
            data_horario: appt.data_horario
        });

        // 2. Feche o Modal de Detalhes
        setActiveManagement(null);
        setSelectedSlotData(null); // Fecha também o modal de lista se estiver aberto

        // 3. Abra o Formulário Principal (Drawer/Modal)
        setIsFormOpen(true);

        showToast("📅 Editando Agendamento");
    };





    const handleSlotClick = useCallback((date: Date, time: string) => {
        const [hour, minute] = time.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hour, minute, 0, 0);

        // Conflict Check
        const myConflict = appointments.find(a =>
            a.barbeiro_id === profile?.id &&
            isSameDay(parseISO(a.data_horario), newDate) &&
            format(parseISO(a.data_horario), "HH:mm") === time
        );

        if (myConflict) {
            showToast("⚠️ Você já tem agendamento neste horário.");
            return;
        }

        // Open Form
        setFormData({
            id: null,
            cliente_nome: '',
            cliente_telefone: '',
            servico_id: availableServices[0]?.id || '',
            barbeiro_id: profile?.id,
            data_horario: newDate.toISOString()
        });
        setIsFormOpen(true);
    }, [appointments, profile, availableServices]);

    const handleSaveForm = async () => {
        if (!formData.cliente_nome || !formData.cliente_telefone || !formData.servico_id) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        setIsSaving(true);
        showToast(formData.id ? "Atualizando..." : "Salvando...");

        try {
            // 1. Determina o valor e nome
            let finalServiceLabel = '';
            let finalPrice = 0;
            if (formData.servico_id === 'custom') {
                finalServiceLabel = customDescription || 'Serviço Extra';
                finalPrice = parseFloat(customPrice) || 0;
            } else {
                const selectedObj = availableServices.find(s => s.id === formData.servico_id);
                finalServiceLabel = selectedObj ? selectedObj.nome : 'Serviço';
                finalPrice = selectedObj ? selectedObj.preco : 0;
            }

            const payload = {
                data_horario: formData.data_horario,
                barbeiro_id: formData.barbeiro_id,
                cliente_nome: formData.cliente_nome.toUpperCase(),
                cliente_telefone: formData.cliente_telefone,
                servico_id: formData.servico_id === 'custom' ? null : formData.servico_id,
                servico_nome: finalServiceLabel,
                preco: finalPrice, // Usando coluna 'preco' conforme solicitado
                status: 'agendado'
            };

            // IF CUSTOM, we might need to handle differently depending on DB schema. 
            // Attempting to send custom name/price. If DB relies on servico_id FK, this might need schema adjustment.
            // For now, following user instruction to save with customDescription.

            let result;
            if (formData.id) {
                // UPDATE
                result = await supabase.from('agendamentos').update(payload).eq('id', formData.id).select();
            } else {
                // INSERT
                result = await supabase.from('agendamentos').insert(payload).select();
            }

            const { error } = result;

            if (error) {
                console.error("❌ SUPABASE ERROR:", error);
                alert(`Erro ao salvar: ${error.message}`);
            } else {
                console.log("✅ SUCCESS");
                showToast(formData.id ? "Agendamento Atualizado!" : "Agendamento Criado!");
                fetchData(currentDate);
                setIsFormOpen(false);
            }
        } catch (err) {
            console.error("error", err);
            alert("Erro ao salvar.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFabClick = useCallback(() => {
        const now = new Date();
        const currentHour = now.getHours();
        // Default to next full hour
        const nextTime = `${String(currentHour + 1).padStart(2, '0')}:00`;
        handleSlotClick(currentDate, nextTime);
    }, [currentDate, handleSlotClick]);

    // LISTEN FOR BOTTOM NAV ACTION
    useEffect(() => {
        const handleNewAppointment = () => {
            handleFabClick();
        };
        window.addEventListener('open-new-appointment', handleNewAppointment);
        return () => window.removeEventListener('open-new-appointment', handleNewAppointment);
    }, [handleFabClick]);

    return (
        <div className="h-screen bg-black text-white flex overflow-hidden">
            <Sidebar perfil={{ nome: 'DEMO USER', cargo: 'barbeiro' }} />

            <main className={`flex-1 flex flex-col h-full relative overflow-hidden transition-opacity duration-200 ${isSaving ? 'opacity-50 pointer-events-none cursor-wait' : ''}`}>


                <header className="sticky top-0 px-3 md:px-8 py-2 md:py-6 flex items-center justify-between shrink-0 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900 z-50">
                    <div>
                        <h1 className="text-lg md:text-2xl font-serif font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            CARTEL 96 <span className="hidden md:inline text-[#d4af37] opacity-60 text-xs font-sans tracking-[0.3em] font-normal border-l border-zinc-800 pl-3">GESTÃO</span>
                        </h1>
                    </div>
                    <div className="flex gap-2 md:gap-4">
                        <div className="flex bg-zinc-900/50 rounded-lg md:rounded-xl p-1 border border-zinc-800 items-center">
                            <button onClick={() => setCurrentDate(d => addDays(d, -1))} className="p-2 md:p-4 hover:text-white text-zinc-500 transition-colors bg-transparent"><ChevronLeft size={16} className="md:w-5 md:h-5" /></button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-3 md:px-6 py-1.5 md:py-3 text-[10px] md:text-xs font-black uppercase text-zinc-400 hover:text-[#d4af37] transition-colors tracking-widest">HOJE</button>
                            <button onClick={() => setCurrentDate(d => addDays(d, 1))} className="p-2 md:p-4 hover:text-white text-zinc-500 transition-colors bg-transparent"><ChevronRight size={16} className="md:w-5 md:h-5" /></button>
                        </div>
                        {/* BARBER FILTER - VISIBLE ONLY TO OWNER */}
                        {(profile?.cargo === 'dono' || profile?.cargo === 'admin') && (
                            <div className="hidden md:flex bg-zinc-900/50 rounded-xl p-1 border border-zinc-800 items-center px-2">
                                <select
                                    value={selectedBarberId}
                                    onChange={(e) => setSelectedBarberId(e.target.value)}
                                    className="bg-transparent text-[10px] font-black uppercase text-zinc-400 focus:text-[#d4af37] outline-none cursor-pointer tracking-widest [&>option]:bg-zinc-900"
                                >
                                    <option value="all">Todos Profissionais</option>
                                    {barbers.map(b => (
                                        <option key={b.id} value={b.id}>{b.nome}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex bg-zinc-900/50 rounded-lg md:rounded-xl p-1 border border-zinc-800">
                            <button onClick={() => setViewMode('day')} className={`px-3 md:px-6 py-1.5 md:py-3 rounded-md md:rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'day' ? 'bg-[#d4af37] text-black shadow-lg scale-105' : 'text-zinc-500 hover:bg-zinc-800'}`}>DIA</button>
                            <button onClick={() => setViewMode('week')} className={`px-3 md:px-6 py-1.5 md:py-3 rounded-md md:rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-[#d4af37] text-black shadow-lg scale-105' : 'text-zinc-500 hover:bg-zinc-800'}`}>SEM</button>
                            <button onClick={() => setViewMode('month')} className={`hidden md:block px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-[#d4af37] text-black shadow-lg scale-105' : 'text-zinc-500 hover:bg-zinc-800'}`}>MÊS</button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative w-full min-h-[80vh] block visible">
                    {(() => {
                        switch (viewMode) {
                            case 'day':
                                return (
                                    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-20">
                                        <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900 p-4 text-center">
                                            <p className="text-[#d4af37] text-[10px] font-black uppercase tracking-[0.5em] mb-1">{format(currentDate, "EEEE", { locale: ptBR })}</p>
                                            <h2 className="text-4xl font-serif font-black text-white">{format(currentDate, "dd", { locale: ptBR })}</h2>
                                        </div>
                                        <div className="flex-1">
                                            {timeSlots.map(time => {
                                                const slotAppts = appointments.filter(a =>
                                                    isSameDay(parseISO(a.data_horario), currentDate) &&
                                                    format(parseISO(a.data_horario), "HH:00") === time &&
                                                    (selectedBarberId === 'all' || a.barbeiro_id === selectedBarberId)
                                                );
                                                return (
                                                    <div key={time} className="grid grid-cols-[65px_1fr] md:grid-cols-[100px_1fr]">
                                                        <div className="flex items-center justify-center border-r border-zinc-900 text-[11px] font-serif italic text-zinc-600">{time}</div>
                                                        <TimeSlot
                                                            time={time}
                                                            date={currentDate}
                                                            onClick={() => handleSlotClick(currentDate, time)}
                                                            onDrop={processDrop}
                                                        >
                                                            {/* MULTI-TENANCY RENDER */}
                                                            <div className="flex flex-row flex-wrap gap-2 p-2 w-full h-full pointer-events-none">
                                                                {/* pointer-events-none on container so clicks pass to TimeSlot if empty space, but Card has pointer-events-auto */}
                                                                {slotAppts.map(appt => (
                                                                    <div key={appt.id} className="relative flex-1 min-w-[150px] h-[80px] pointer-events-auto">
                                                                        <AppointmentCard
                                                                            appt={appt}
                                                                            onClick={(e) => { e.stopPropagation(); setActiveManagement(appt); }}
                                                                            onDragStart={handleDragStart}
                                                                            className="absolute inset-0" // Fill the wrapper
                                                                            showBarber={selectedBarberId === 'all'}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </TimeSlot>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            case 'week':
                                return (
                                    <div key="week-view" className="flex-1 w-full min-h-[80vh] flex flex-col overflow-y-auto overflow-x-auto">
                                        {/* Week Header */}
                                        <div className="grid border-b border-zinc-900 bg-zinc-950 sticky top-0 z-40 min-w-[800px] md:min-w-0" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
                                            <div className="h-16 border-r border-zinc-900" />
                                            {Array.from({ length: 7 }).map((_, i) => {
                                                const day = addDays(startOfWeek(currentDate, { weekStartsOn: 0 }), i);
                                                const isToday = isSameDay(day, new Date());
                                                return (
                                                    <div
                                                        key={i}
                                                        onClick={() => {
                                                            setCurrentDate(day);
                                                            setViewMode('day');
                                                        }}
                                                        className="h-16 flex flex-col items-center justify-center border-r border-zinc-900/50 bg-zinc-900/10 cursor-pointer hover:bg-white/5 transition-colors"
                                                    >
                                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{format(day, 'EEE', { locale: ptBR })}</span>
                                                        <span className={`text-xl font-serif font-black ${isToday ? 'text-[#d4af37]' : 'text-zinc-500'}`}>{format(day, 'dd')}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Week Grid Content */}
                                        <div className="grid w-full min-w-[800px] md:min-w-0" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
                                            {/* Time Column (Left) */}
                                            <div className="flex flex-col">
                                                {timeSlots.map(time => (
                                                    <div key={time} className="h-[100px] flex items-center justify-center border-b border-r border-zinc-900/50 text-[10px] font-serif italic text-zinc-700 bg-zinc-950/50">
                                                        {time}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Days Columns */}
                                            {Array.from({ length: 7 }).map((_, colIndex) => {
                                                const day = addDays(startOfWeek(currentDate, { weekStartsOn: 0 }), colIndex);
                                                return (
                                                    <div key={colIndex} className="flex flex-col border-r border-zinc-900/30">
                                                        {timeSlots.map(time => {
                                                            // Find appointments for this Slot (FILTER instead of FIND)
                                                            const slotAppts = appointments.filter(a =>
                                                                isSameDay(parseISO(a.data_horario), day) &&
                                                                format(parseISO(a.data_horario), "HH:00") === time &&
                                                                (selectedBarberId === 'all' || a.barbeiro_id === selectedBarberId)
                                                            );

                                                            return (
                                                                <div key={time} className="h-auto min-h-[100px] border-b border-zinc-900/30 relative bg-zinc-950/20 hover:bg-zinc-900/40 transition-colors flex flex-col">
                                                                    {/* Slot Container */}
                                                                    <TimeSlot
                                                                        time={time}
                                                                        date={day}
                                                                        onClick={() => handleSlotClick(day, time)}
                                                                        onDrop={processDrop}
                                                                    >
                                                                        <div className="flex flex-col gap-1 w-full p-1 relative h-full">
                                                                            {/* EMERGENCY FIX: Simple Slice, No Modal */}
                                                                            {slotAppts.slice(0, 1).map(appt => (
                                                                                <div key={appt.id} className="relative w-full h-[70px] pointer-events-auto">
                                                                                    <AppointmentCard
                                                                                        appt={appt}
                                                                                        onClick={(e) => { e.stopPropagation(); setActiveManagement(appt); }}
                                                                                        onDragStart={handleDragStart}
                                                                                        className="absolute inset-0"
                                                                                        showBarber={selectedBarberId === 'all'}
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                            {slotAppts.length > 1 && (
                                                                                <div
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setSelectedSlotData(slotAppts);
                                                                                    }}
                                                                                    className="absolute bottom-1 right-1 z-20 text-[9px] text-zinc-500 font-black cursor-pointer hover:text-[#d4af37] transition-colors bg-zinc-950/80 px-1 rounded"
                                                                                >
                                                                                    +{slotAppts.length - 1} mais
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </TimeSlot>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                );
                            case 'month':
                                return (
                                    <div key="month-view" className="h-full overflow-y-auto scrollbar-hide p-8 min-h-[600px]">
                                        <div className="grid grid-cols-7 gap-1">
                                            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
                                                <div key={d} className="text-center text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] py-4">{d}</div>
                                            ))}
                                            {Array.from({ length: 35 }).map((_, i) => {
                                                const day = addDays(startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }), i);
                                                const isCurMonth = isSameMonth(day, currentDate);

                                                // STRICT DATE FILTERING (YYYY-MM-DD)
                                                // We compare the exact date string 'YYYY-MM-DD' to avoid "ghost" appointments from other months/years
                                                const cellDateStr = format(day, 'yyyy-MM-dd');
                                                const hasAppts = appointments.filter(a => {
                                                    const apptDate = parseISO(a.data_horario);
                                                    return format(apptDate, 'yyyy-MM-dd') === cellDateStr &&
                                                        (selectedBarberId === 'all' || a.barbeiro_id === selectedBarberId);
                                                });

                                                return (
                                                    <div
                                                        key={i}
                                                        onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                                                        className={`h-32 border border-zinc-900/50 rounded-xl p-3 bg-zinc-900/10 hover:bg-zinc-900/30 transition-colors cursor-pointer ${!isCurMonth && 'opacity-20'}`}
                                                        onDragOver={(e) => e.preventDefault()}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            const droppedId = e.dataTransfer.getData("text/plain");
                                                            if (droppedId) {
                                                                const originalAppt = appointments.find(a => a.id == droppedId);
                                                                const originalTime = originalAppt ? format(parseISO(originalAppt.data_horario), 'HH:mm') : '09:00';
                                                                processDrop(day, originalTime, droppedId);
                                                            }
                                                        }}
                                                    >
                                                        <span className={`text-lg font-black ${isSameDay(day, new Date()) ? 'text-[#d4af37]' : 'text-zinc-500'}`}>{format(day, 'dd')}</span>
                                                        <div className="mt-2 space-y-1">
                                                            {hasAppts.slice(0, 2).map(a => (
                                                                <div
                                                                    key={`${a.id}-${cellDateStr}`} // Unique key: ID + Date
                                                                    draggable
                                                                    onDragStart={(e) => handleDragStart(e, a.id)}
                                                                    className="text-[9px] bg-[#d4af37]/10 text-[#d4af37] px-2 py-1 rounded-md font-bold uppercase truncate cursor-grab active:cursor-grabbing"
                                                                >
                                                                    {a.cliente_nome}
                                                                </div>
                                                            ))}
                                                            {hasAppts.length > 2 && <div className="text-[8px] text-zinc-600 font-black pl-1">+{hasAppts.length - 2}</div>}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                );
                            default:
                                return null;
                        }
                    })()}
                </div>

                {/* FAB REMOVED - MOVED TO BOTTOM NAV */}
            </main >

            {selectedSlotData && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm' onClick={() => setSelectedSlotData(null)}>
                    <div className='bg-zinc-900 border border-[#d4af37] p-6 rounded-2xl w-96 max-h-[80vh] overflow-y-auto shadow-2xl' onClick={e => e.stopPropagation()}>
                        <h3 className='text-[#d4af37] text-xl font-serif font-black mb-4 uppercase tracking-wider'>Agendamentos do Horário</h3>
                        <div className='space-y-3'>
                            {selectedSlotData.map(item => (
                                <div
                                    key={item.id}
                                    className='bg-zinc-800/50 p-4 rounded-xl border border-white/5 hover:bg-zinc-800 transition-colors cursor-pointer'
                                    onClick={() => {
                                        setActiveManagement(item);
                                        setSelectedSlotData(null);
                                    }}
                                >
                                    <p className='font-bold text-white uppercase text-sm'>{item.cliente_nome}</p>
                                    <p className='text-xs text-[#d4af37] mt-1'>{item.servico_nome}</p>
                                    <p className='text-[10px] text-zinc-500 mt-2 font-mono'>{item.barbeiro_nome || 'Barbeiro'}</p>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setSelectedSlotData(null)} className='mt-6 w-full bg-red-500/10 text-red-500 py-3 rounded-xl hover:bg-red-500/20 font-black uppercase text-xs tracking-widest transition-colors'>Fechar</button>
                    </div>
                </div>
            )}

            {activeManagement && (
                <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm' onClick={() => setActiveManagement(null)}>
                    <div className='bg-zinc-950 border border-[#d4af37] p-8 rounded-2xl w-full max-w-md shadow-2xl relative' onClick={e => e.stopPropagation()}>

                        {/* CABEÇALHO COM AÇÕES RÁPIDAS */}
                        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                            {/* NOME E STATUS */}
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tighter">
                                    {activeManagement?.cliente_nome || 'Cliente'}
                                </h2>
                                <p className="text-xs text-[#d4af37] font-bold uppercase tracking-widest mt-1">
                                    {activeManagement?.status || 'Confirmado'}
                                </p>
                            </div>

                            {/* BARRA DE ÍCONES (AÇÕES) */}
                            <div className="flex items-center gap-3">
                                {/* 1. WHATSAPP */}
                                {activeManagement?.cliente_telefone && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`https://wa.me/55${activeManagement.cliente_telefone?.replace(/\D/g, '')}`, '_blank');
                                        }}
                                        className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/30 flex items-center justify-center transition-all"
                                        title="Chamar no WhatsApp"
                                    >
                                        <MessageCircle size={20} />
                                    </button>
                                )}
                                {/* 2. REAGENDAR (Abre o modal de edição) */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(activeManagement);
                                    }}
                                    className="w-10 h-10 rounded-full bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37] hover:text-black border border-[#d4af37]/30 flex items-center justify-center transition-all"
                                    title="Editar / Reagendar"
                                >
                                    <CalendarClock size={20} />
                                </button>
                                {/* 3. EXCLUIR */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (activeManagement?.id && confirm("Tem certeza que deseja cancelar este agendamento?")) {
                                            handleDelete(activeManagement.id);
                                        }
                                    }}
                                    className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 flex items-center justify-center transition-all"
                                    title="Cancelar Agendamento"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>

                        {/* INFO GRID */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Serviço</p>
                                <p className="text-sm font-bold text-white uppercase">{activeManagement?.servico_nome}</p>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Profissional</p>
                                <p className="text-sm font-bold text-white uppercase">{activeManagement?.barbeiro_nome || 'Barbeiro'}</p>
                            </div>
                            <div className="col-span-2 bg-zinc-900/50 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                                <div className="p-2 bg-[#d4af37]/10 rounded-lg text-[#d4af37]">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Data e Horário</p>
                                    <p className="text-lg font-serif font-white">
                                        {activeManagement?.data_horario && format(parseISO(activeManagement.data_horario), "dd 'de' MMMM", { locale: ptBR })} <span className="text-zinc-600 mx-2">|</span> {activeManagement?.data_horario && format(parseISO(activeManagement.data_horario), "HH:mm")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ACTIONS REMOVED (Moved to Toolbar) */}

                        {/* CLOSE BUTTON */}
                        <button
                            onClick={() => setActiveManagement(null)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>

                    </div>
                </div>
            )}

            {/* NEW APPOINTMENT FORM MODAL */}
            {isFormOpen && (
                <div className='fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/90 backdrop-blur-sm' onClick={() => setIsFormOpen(false)}>
                    <div className='bg-zinc-950 border-t md:border border-[#d4af37] p-6 md:p-8 rounded-t-[32px] md:rounded-2xl w-full md:max-w-md shadow-2xl relative h-[90vh] md:h-auto flex flex-col md:block overflow-hidden transition-transform duration-300 transform translate-y-0' onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-serif font-black text-white uppercase mb-1">
                                {formData.id ? "Editar Agendamento" : "Novo Agendamento"}
                            </h2>
                            <p className="text-zinc-500 text-xs uppercase tracking-widest">
                                {formData.data_horario && format(parseISO(formData.data_horario), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1 block">Nome do Cliente</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white font-bold uppercase focus:border-[#d4af37] outline-none transition-colors"
                                    value={formData.cliente_nome}
                                    onChange={e => setFormData({ ...formData, cliente_nome: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1 block">Telefone</label>
                                <input
                                    type="tel"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white font-bold uppercase focus:border-[#d4af37] outline-none transition-colors"
                                    value={formData.cliente_telefone}
                                    onChange={e => setFormData({ ...formData, cliente_telefone: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1 block">Serviço</label>
                                <select
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white font-bold uppercase focus:border-[#d4af37] outline-none transition-colors"
                                    value={formData.servico_id}
                                    onChange={e => setFormData({ ...formData, servico_id: e.target.value })}
                                >
                                    {availableServices.map(s => (
                                        <option key={s.id} value={s.id}>{s.nome} - R$ {s.preco}</option>
                                    ))}
                                </select>
                            </div>

                            {/* --- CAMPOS PARA SERVIÇO PERSONALIZADO --- */}
                            {formData.servico_id === 'custom' && (
                                <div className="mt-3 p-3 bg-zinc-900 border border-zinc-700 rounded-lg animate-in slide-in-from-top-2">
                                    <p className="text-[#d4af37] text-xs font-bold uppercase mb-3 flex items-center gap-2">
                                        ✏️ Detalhes do Serviço Extra
                                    </p>

                                    <div className="grid grid-cols-3 gap-3">
                                        {/* CAMPO DE DESCRIÇÃO (Ocupa 2/3) */}
                                        <div className="col-span-2">
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold">Descrição / Obs</label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Luzes, Sobrancelha..."
                                                value={customDescription}
                                                onChange={(e) => setCustomDescription(e.target.value)}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white text-sm focus:border-[#d4af37] outline-none"
                                            />
                                        </div>
                                        {/* CAMPO DE VALOR (Ocupa 1/3) */}
                                        <div className="col-span-1">
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold">Valor (R$)</label>
                                            <input
                                                type="number"
                                                placeholder="0,00"
                                                value={customPrice}
                                                onChange={(e) => setCustomPrice(e.target.value)}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-[#d4af37] font-bold text-sm focus:border-[#d4af37] outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* DATE TIME EDITOR - ONLY IF EDITING OR RESCHEDULING */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1 block">Data</label>
                                    <input
                                        type="date"
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white font-bold uppercase focus:border-[#d4af37] outline-none"
                                        value={formData.data_horario ? format(parseISO(formData.data_horario), 'yyyy-MM-dd') : ''}
                                        onChange={e => {
                                            const oldDate = parseISO(formData.data_horario);
                                            const newD = parseISO(e.target.value);
                                            // Preserve time
                                            newD.setHours(oldDate.getHours(), oldDate.getMinutes());
                                            setFormData({ ...formData, data_horario: newD.toISOString() });
                                        }}
                                    />
                                </div>


                                {/* --- FEEDBACK VISUAL DE MODIFICAÇÃO (ANTES vs DEPOIS) --- */}
                                <div className="col-span-2 my-2 transition-all duration-300">
                                    {(() => {
                                        const originalAppt = formData.id ? appointments.find(a => a.id === formData.id) : null;
                                        const isChanged = originalAppt && formData.data_horario && !isSameDay(parseISO(formData.data_horario), parseISO(originalAppt.data_horario));

                                        return isChanged ? (
                                            <div className="bg-green-500/10 border-2 border-green-500 rounded-lg p-3 text-center animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                                                <p className="text-green-500 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
                                                    <span className="line-through opacity-50 text-zinc-400">
                                                        {format(parseISO(originalAppt!.data_horario), "dd 'de' MMM", { locale: ptBR })}
                                                    </span>
                                                    <span>➜</span>
                                                    <span>MUDANDO PARA</span>
                                                </p>
                                                <p className="text-white font-black text-xl uppercase">
                                                    {format(parseISO(formData.data_horario), "EEEE", { locale: ptBR })}
                                                </p>
                                                <p className="text-green-400 text-sm font-bold">
                                                    {format(parseISO(formData.data_horario), "dd 'de' MMMM", { locale: ptBR })}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className={`p-3 rounded-lg text-center border ${formData.id ? 'bg-zinc-900 border-zinc-800 opacity-60' : 'bg-zinc-900 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.1)]'}`}>
                                                <p className={`text-[10px] uppercase tracking-[0.2em] mb-1 ${formData.id ? 'text-zinc-500' : 'text-[#d4af37]'}`}>
                                                    {formData.id ? 'DATA ATUAL (SEM ALTERAÇÃO)' : 'DATA SELECIONADA'}
                                                </p>
                                                <p className={`font-black text-xl uppercase leading-none ${formData.id ? 'text-zinc-400' : 'text-[#d4af37]'}`}>
                                                    {formData.data_horario ? format(parseISO(formData.data_horario), "EEEE", { locale: ptBR }) : '---'}
                                                </p>
                                                <p className={`text-sm font-medium mt-1 ${formData.id ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                    {formData.data_horario ? format(parseISO(formData.data_horario), "dd 'de' MMMM", { locale: ptBR }) : 'Selecione a data'}
                                                </p>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1 block">Horário</label>
                                    <select
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white font-bold uppercase focus:border-[#d4af37] outline-none"
                                        value={formData.data_horario ? format(parseISO(formData.data_horario), 'HH:mm') : ''}
                                        onChange={e => {
                                            const oldDate = parseISO(formData.data_horario);
                                            const [h, m] = e.target.value.split(':').map(Number);
                                            const newD = new Date(oldDate);
                                            newD.setHours(h, m);
                                            setFormData({ ...formData, data_horario: newD.toISOString() });
                                        }}
                                    >
                                        {Array.from({ length: 14 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`).map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                        </div>

                        <div className="mt-auto md:mt-8 grid grid-cols-2 gap-3 pt-4 border-t border-zinc-900 md:border-none">
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="h-16 md:h-14 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-2xl md:rounded-xl flex items-center justify-center font-black text-sm md:text-xs uppercase tracking-widest transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveForm}
                                className="h-16 md:h-14 bg-[#d4af37] hover:bg-[#b5952f] text-black rounded-2xl md:rounded-xl flex items-center justify-center font-black text-sm md:text-xs uppercase tracking-widest transition-colors shadow-lg shadow-[#d4af37]/20"
                            >
                                {formData.id ? "Atualizar" : "Confirmar"}
                            </button>
                        </div>

                        <button
                            onClick={() => setIsFormOpen(false)}
                            className="absolute top-6 right-6 p-4 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-white transition-colors md:hidden"
                        >
                            <X size={20} />
                        </button>
                        <button
                            onClick={() => setIsFormOpen(false)}
                            className="hidden md:flex absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-900 items-center justify-center text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

        </div >
    );
}