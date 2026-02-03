import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addDays, startOfWeek, isSameDay, parseISO, startOfMonth, endOfMonth, addMinutes, setHours, setMinutes, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Scissors as ScissorsIcon, Clock, Filter, Loader2, Trash2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

import { N8N_WEBHOOK_URL } from '../constants/api';

// --- CONSTANTS ---
const START_HOUR = 8;
const END_HOUR = 22; // Extended to 21:00 (Last block starts at 21)
const PIXELS_PER_HOUR = 80;
const GRID_HEIGHT = (END_HOUR - START_HOUR) * PIXELS_PER_HOUR;

// Helper Normalizer
const normalize = (str: any) => str ? str.toString().toLowerCase().trim() : "";

// --- TYPES ---
interface Service {
    id: string;
    nome: string;
    preco: number;
    duration: number; // minutes
}

interface Appointment {
    id: any;
    cliente_nome: string;
    cliente_telefone?: string;
    servico_id?: any;
    servico_nome: string;
    data_horario: string;
    professional?: string; // Correct DB Column
    status: 'agendado' | 'atendimento' | 'finalizado' | 'cancelado' | 'noshow';
    price: number;
    duration_minutes: number;
}

// --- MEMOIZED COMPONENTS ---

const AppointmentCard = React.memo(({
    appt,
    onClick,
    onDragStart,
    style,
    className
}: {
    appt: Appointment;
    onClick: (e: React.MouseEvent) => void;
    onDragStart: (e: React.DragEvent, id: any) => void;
    style?: React.CSSProperties;
    className?: string;
}) => {
    return (
        <motion.div
            layoutId={appt.id.toString()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`cursor-pointer absolute z-10 hover:z-20 transition-all ${className}`}
            style={style}
            draggable
            onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, appt.id)}
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileDrag={{ opacity: 0.5, scale: 0.95 }}
        >
            <div className={`h-full w-full rounded-l-md rounded-r-xl p-2 flex flex-col justify-start shadow-xl backdrop-blur-md border-l-4 overflow-hidden relative ${appt.status === 'atendimento' ? 'bg-[#d4af37] text-black border-black' : 'bg-[#d4af37]/20 border-[#d4af37] text-zinc-100'}`} style={{ boxSizing: 'border-box' }}>
                {/* Background shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                <div className="flex justify-between items-start relative z-10">
                    <div className="text-[10px] md:text-xs font-black uppercase truncate tracking-tight drop-shadow-md leading-tight">{appt.cliente_nome}</div>
                    {appt.status === 'agendado' && <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse shrink-0 ml-1 shadow-[0_0_10px_#d4af37]" />}
                </div>

                <div className={`text-[9px] font-bold uppercase flex items-center gap-1 mt-0.5 truncate opacity-90 ${appt.status === 'atendimento' ? 'text-black/70' : 'text-zinc-400'}`}>
                    <ScissorsIcon size={10} /> {appt.servico_nome}
                </div>

                <div className={`flex items-center gap-1 mt-auto pt-1 text-[9px] font-mono opacity-80 ${appt.status === 'atendimento' ? 'text-black/60' : 'text-[#d4af37]'}`}>
                    <span className="mr-auto font-black">R$ {appt.price}</span>
                    <Clock size={10} />
                    {format(parseISO(appt.data_horario), 'HH:mm')} -
                    {format(addMinutes(parseISO(appt.data_horario), appt.duration_minutes), 'HH:mm')}
                </div>
            </div>
        </motion.div>
    );
});

// --- MAIN COMPONENT ---

export default function Agenda() {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());

    // State ViewMode
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        id: null as any,
        cliente_nome: '',
        cliente_telefone: '',
        servico_id: '',
        professional: '', // UPDATED: Matches DB column
        price: 0, // Ensure it's number
        data_horario: '',
        duration: 30 // Default duration in minutes
    });

    // Custom Service State
    const [customDescription, setCustomDescription] = useState('');

    // Auth & Resources
    const { profile } = useAuth();
    const [availableServices, setAvailableServices] = useState<Service[]>([]);

    // NEW: Professional Name Filter - Defaults to match user profile if possible, else 'Todos'
    const [selectedProfessional, setSelectedProfessional] = useState<string>('Todos');

    const [isSaving, setIsSaving] = useState(false);
    const [nowLine, setNowLine] = useState(0);

    // Initial Filters & Data Load
    useEffect(() => {
        const init = async () => {
            // Load Services
            const { data: servicesData } = await supabase.from('services').select('*').order('created_at', { ascending: false });
            if (servicesData) {
                const mapped = servicesData.map((s: any) => ({
                    id: s.id,
                    nome: s.name,
                    preco: s.price,
                    duration: s.duration_minutes
                }));
                // Ensure unique custom field
                setAvailableServices([...mapped, { id: 'custom', nome: 'Outro / Personalizado', preco: 0, duration: 60 }]);
            }
        };
        init();
    }, []);

    // Set initial filter based on profile
    useEffect(() => {
        if (profile) {
            if (profile.nome.includes('Luis')) setSelectedProfessional('Luis');
            else if (profile.nome.includes('Bruna')) setSelectedProfessional('Bruna');
            else if (profile.nome.includes('William')) setSelectedProfessional('William');
            else if (profile.nome.includes('Antonio')) setSelectedProfessional('Antonio');
        }
    }, [profile]);

    // Update "Current Time" Line Position
    useEffect(() => {
        const updateLine = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            if (hours >= START_HOUR && hours < END_HOUR) {
                const minutesFromStart = (hours - START_HOUR) * 60 + minutes;
                setNowLine((minutesFromStart / 60) * PIXELS_PER_HOUR);
            } else {
                setNowLine(-1);
            }
        };
        updateLine();
        const interval = setInterval(updateLine, 60000); // Every minute
        return () => clearInterval(interval);
    }, []);

    // Data Fetching
    const fetchData = useCallback(async (date: Date) => {
        setIsLoading(true);
        const start = startOfMonth(date).toISOString();
        const end = endOfMonth(date).toISOString();

        // Query 'appointments'
        let query = supabase
            .from('appointments')
            .select(`
                *,
                services (
                    name,
                    duration_minutes
                )
            `)
            .gte('start_time', start)
            .lte('start_time', end);

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching appointments:", error);
            setIsLoading(false);
            return;
        }

        if (data) {
            const mappedData: Appointment[] = data.map((d: any) => {
                const serviceName = d.services?.name || 'Serviço';
                const duration = d.services?.duration_minutes || 30;

                // Calculate duration from start/end if available, else fallback
                let derivedDuration = duration;
                if (d.start_time && d.end_time) {
                    derivedDuration = differenceInMinutes(parseISO(d.end_time), parseISO(d.start_time));
                }

                return {
                    id: d.id,
                    cliente_nome: d.client_name || 'Anônimo',
                    cliente_telefone: d.client_phone,
                    servico_id: d.service_id,
                    servico_nome: serviceName,
                    data_horario: d.start_time,
                    professional: d.professional, // Map direct DB column
                    status: d.status || 'agendado',
                    price: d.price || 0,
                    duration_minutes: derivedDuration
                };
            });
            setAppointments(mappedData);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData(currentDate);
    }, [currentDate.getMonth(), currentDate.getFullYear(), fetchData]);


    // --- FILTER LOGIC (STRICT) ---
    const filteredAppointments = useMemo(() => {

        return appointments.filter(app => {
            if (selectedProfessional === 'Todos') return true;

            // Normalize and compare direct field
            const appProf = normalize(app.professional);
            const selProf = normalize(selectedProfessional);

            return appProf === selProf;
        });
    }, [appointments, selectedProfessional]);


    // --- HANDLERS ---

    const handleGridClick = (e: React.MouseEvent<HTMLDivElement>, dayDate?: Date) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ClickY = e.clientY - rect.top;

        const hoursFromStart = ClickY / PIXELS_PER_HOUR;
        const totalMinutes = hoursFromStart * 60;

        const clickedHour = START_HOUR + Math.floor(totalMinutes / 60);
        const clickedMinutes = Math.floor(totalMinutes % 60);

        const roundedMinutes = Math.round(clickedMinutes / 15) * 15;

        // If dayDate passed (Week View), use it. Else use currentDate (Day View).
        const targetDate = dayDate ? new Date(dayDate) : new Date(currentDate);
        targetDate.setHours(clickedHour, roundedMinutes, 0, 0);

        handleOpenForm(targetDate);
    };

    const handleOpenForm = (dateObj: Date, appt?: Appointment) => {
        if (appt) {
            // EDIT MODE
            setFormData({
                id: appt.id,
                cliente_nome: appt.cliente_nome,
                cliente_telefone: appt.cliente_telefone || '',
                servico_id: appt.servico_id || availableServices.find(s => s.nome === appt.servico_nome)?.id || '',
                professional: appt.professional || '', // Bind professional name
                price: appt.price || 0,
                data_horario: appt.data_horario,
                duration: appt.duration_minutes || 30
            });
        } else {
            // NEW MODE
            // Pre-select professional name
            let preSelectedProf = '';
            if (selectedProfessional !== 'Todos') {
                preSelectedProf = selectedProfessional;
            } else if (profile?.nome) {
                // Try to match profile name to one of the options
                if (normalize(profile.nome).includes('luis')) preSelectedProf = 'Luis';
                if (normalize(profile.nome).includes('bruna')) preSelectedProf = 'Bruna';
                if (normalize(profile.nome).includes('william')) preSelectedProf = 'William';
                if (normalize(profile.nome).includes('antonio')) preSelectedProf = 'Antonio';
            }

            setFormData({
                id: null,
                cliente_nome: '',
                cliente_telefone: '',
                servico_id: availableServices.length > 0 ? availableServices[0].id : '',
                professional: preSelectedProf,
                price: availableServices.length > 0 ? availableServices[0].preco : 0,
                data_horario: dateObj.toISOString(),
                duration: 30
            });
        }
        setIsFormOpen(true);
    };

    const handleServiceChange = (serviceId: string) => {
        const service = availableServices.find(s => s.id === serviceId);
        const newDuration = service ? service.duration : (serviceId === 'custom' ? 60 : 30);
        const newPrice = service ? service.preco : 0;

        setFormData(prev => ({
            ...prev,
            servico_id: serviceId,
            duration: newDuration,
            price: newPrice
        }));
    };

    const handleSaveForm = async () => {
        if (!formData.cliente_nome || !formData.servico_id || !formData.professional) {
            alert("Preencha nome, serviço e escolha o profissional.");
            return;
        }
        setIsSaving(true);
        try {
            let finalServiceLabel = '';
            let finalPrice = 0;
            // Use manual duration
            let durationMinutes = parseInt(String(formData.duration)) || 30;

            if (formData.servico_id === 'custom') {
                finalServiceLabel = customDescription || 'Serviço Extra';
            } else {
                const selectedObj = availableServices.find(s => s.id === formData.servico_id);
                finalServiceLabel = selectedObj ? selectedObj.nome : 'Serviço';
            }

            // Price from form data overrides service default
            // User requested: price: parseFloat(formData.price || 0)
            finalPrice = formData.price ? parseFloat(String(formData.price)) : 0;

            const startTime = parseISO(formData.data_horario);
            const endTime = addMinutes(startTime, durationMinutes);

            // PAYLOAD FIXED: Using 'professional' (string) and 'price' (number)
            const payload = {
                client_name: formData.cliente_nome.toUpperCase(),
                client_phone: formData.cliente_telefone,
                service_id: formData.servico_id === 'custom' ? null : formData.servico_id,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                price: finalPrice,
                status: 'agendado',
                professional: formData.professional
            };

            let resultError = null;
            if (formData.id) {
                const { error } = await supabase.from('appointments').update(payload).eq('id', formData.id);
                resultError = error;
            } else {
                const { error } = await supabase.from('appointments').insert([payload]);
                resultError = error;
            }

            if (resultError) throw resultError;

            if (formData.cliente_telefone) {
                await supabase.from('clientes').upsert(
                    { nome: formData.cliente_nome, telefone: formData.cliente_telefone },
                    { onConflict: 'telefone' }
                );
            }

            // --- N8N WEBHOOK DISPATCH (Fire & Forget) ---
            try {
                const webhookPayload = {
                    client_name: formData.cliente_nome,
                    client_phone: formData.cliente_telefone,
                    start_time: startTime.toISOString(),
                    service_name: finalServiceLabel,
                    professional_name: formData.professional
                };

                // No await - Fire and forget
                fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(webhookPayload)
                }).catch(err => console.error("N8N Webhook Error (Fetch):", err));

            } catch (err) {
                console.error("N8N Webhook Error (Block):", err);
            }
            // ---------------------------------------------

            // Simple Alert or Toast replacement
            alert("Agendamento salvo!");
            fetchData(currentDate);
            setIsFormOpen(false);

        } catch (err: any) {
            console.error("Erro:", err);
            alert("ERRO: " + (err.message || JSON.stringify(err)));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!formData.id) return;
        if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;

        setIsSaving(true);
        try {
            const { error } = await supabase.from('appointments').delete().eq('id', formData.id);
            if (error) throw error;

            alert("Agendamento excluído.");
            fetchData(currentDate);
            setIsFormOpen(false);
        } catch (err: any) {
            console.error("Erro ao excluir:", err);
            alert("Erro ao excluir agendamento.");
        } finally {
            setIsSaving(false);
        }
    };

    const processDrop = async (e: React.DragEvent, targetDate?: Date) => {
        e.preventDefault();
        const droppedId = e.dataTransfer.getData("text/plain");
        if (!droppedId) return;

        const originalAppt = appointments.find(a => a.id == droppedId);
        if (!originalAppt) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const scrollTop = e.currentTarget.scrollTop || 0;
        const ClientY = e.clientY - rect.top + scrollTop;
        const hoursFromStart = ClientY / PIXELS_PER_HOUR;
        const totalMinutes = hoursFromStart * 60;
        const newHour = START_HOUR + Math.floor(totalMinutes / 60);
        const newMinute = Math.round((totalMinutes % 60) / 15) * 15;

        const newStartTime = targetDate ? new Date(targetDate) : new Date(currentDate);
        newStartTime.setHours(newHour, newMinute, 0, 0);
        const newEndTime = addMinutes(newStartTime, originalAppt.duration_minutes);

        // Optimistic Update
        setAppointments(prev => prev.map(a => a.id == droppedId ? { ...a, data_horario: newStartTime.toISOString() } : a));

        const { error } = await supabase.from('appointments').update({
            start_time: newStartTime.toISOString(),
            end_time: newEndTime.toISOString()
        }).eq('id', droppedId);

        if (error) {
            alert("Erro ao mover.");
            fetchData(currentDate);
        }
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDragStart = (e: React.DragEvent, id: any) => {
        e.dataTransfer.setData("text/plain", id);
    };


    // Generate Week Days
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    return (
        <div className="flex flex-col min-h-screen relative overflow-hidden bg-zinc-950">
            {/* --- HEADER --- */}
            <header className="sticky top-0 px-4 py-3 flex flex-col md:flex-row items-center justify-between bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900 z-30 gap-4 md:gap-0">
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
                    <h1 className="text-xl font-serif font-black text-white uppercase tracking-tighter md:hidden">CARTEL 96</h1>
                    <div className="h-4 w-[1px] bg-zinc-800 mx-2 md:hidden"></div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentDate(d => addDays(d, viewMode === 'week' ? -7 : -1))} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400"><ChevronLeft size={16} /></button>
                        <div className="flex items-baseline gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => document.getElementById('date-picker')?.showPicker()}>
                            <span className="text-lg font-bold text-white uppercase whitespace-nowrap">
                                {viewMode === 'day'
                                    ? format(currentDate, "dd 'de' MMM", { locale: ptBR })
                                    : `Semana ${format(weekStart, "dd", { locale: ptBR })} - ${format(addDays(weekStart, 6), "dd MMM", { locale: ptBR })}`
                                }
                            </span>
                            <input id="date-picker" type="date" className="w-0 h-0 opacity-0 absolute" onChange={(e) => setCurrentDate(parseISO(e.target.value))} />
                        </div>
                        <button onClick={() => setCurrentDate(d => addDays(d, viewMode === 'week' ? 7 : 1))} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400"><ChevronRight size={16} /></button>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-2 md:pb-0 scrollbar-hide">

                    {/* PROFESSIONAL SELECTOR (FIXED) */}
                    <div className="relative flex-shrink-0">
                        <select
                            value={selectedProfessional}
                            onChange={(e) => setSelectedProfessional(e.target.value)}
                            className="appearance-none bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 pl-4 pr-10 text-xs font-bold uppercase tracking-wider text-zinc-300 outline-none focus:border-[#d4af37] focus:text-white transition-all cursor-pointer hover:bg-zinc-800"
                        >
                            <option value="Todos">Todos os Profissionais</option>
                            <option value="Bruna">Agenda da Bruna</option>
                            <option value="Luis">Agenda do Luis</option>
                            <option value="William">Agenda do William</option>
                            <option value="Antonio">Agenda do Antonio</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                            <Filter size={12} fill="currentColor" />
                        </div>
                    </div>

                    <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 flex-shrink-0">
                        <button onClick={() => setViewMode('day')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'day' ? 'bg-[#d4af37] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Dia</button>
                        <button onClick={() => setViewMode('week')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'week' ? 'bg-[#d4af37] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Semana</button>
                    </div>

                    <button onClick={() => handleOpenForm(new Date())} className="bg-[#d4af37] text-black px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 whitespace-nowrap flex-shrink-0">
                        <Plus size={14} /> Novo
                    </button>
                </div>
            </header>

            {/* --- BODY --- */}

            {viewMode === 'day' ? (
                // --- DAY VIEW ---
                <div className="flex-1 p-4 overflow-hidden flex flex-col">
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl flex-1 overflow-y-auto custom-scrollbar relative flex h-full" style={{ maxHeight: 'calc(100vh - 100px)' }}>

                        {/* LEFT COLUMN */}
                        <div className="w-16 flex-shrink-0 border-r border-zinc-800/50 bg-zinc-950/30 sticky left-0 z-30 pointer-events-none">
                            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
                                const hour = START_HOUR + i;
                                return (
                                    <div key={hour} className="h-20 border-b border-zinc-800/10 flex items-start justify-center pt-2 relative">
                                        <span className="text-xs font-mono font-bold text-zinc-500 absolute -top-3 bg-zinc-950 px-1 rounded">{String(hour).padStart(2, '0')}:00</span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* RIGHT GRID */}
                        <div className="flex-1 relative min-w-[300px]" style={{ height: `${GRID_HEIGHT}px` }} onDragOver={handleDragOver} onDrop={(e) => processDrop(e, currentDate)}>
                            {isLoading && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                    <Loader2 className="animate-spin text-[#d4af37]" />
                                </div>
                            )}

                            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                                <div key={i} className="h-20 w-full border-b border-zinc-800/40 box-border hover:bg-white/5 transition-colors" style={{ top: `${i * 80}px`, position: 'absolute' }} />
                            ))}

                            <div className="absolute inset-0 z-0 cursor-crosshair" onClick={(e) => handleGridClick(e, currentDate)} />

                            {nowLine >= 0 && isSameDay(currentDate, new Date()) && (
                                <div className="absolute w-full border-t-2 border-red-500/70 z-30 pointer-events-none flex items-center" style={{ top: `${nowLine}px` }}>
                                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                                </div>
                            )}

                            {filteredAppointments.filter(a => isSameDay(parseISO(a.data_horario), currentDate)).map(appt => {
                                const startDate = parseISO(appt.data_horario);
                                const startH = startDate.getHours();
                                const startM = startDate.getMinutes();
                                if (startH < START_HOUR || startH >= END_HOUR) return null;
                                const topPx = ((startH - START_HOUR) * 60 + startM) / 60 * 80;
                                const heightPx = (appt.duration_minutes / 60) * 80;

                                return (
                                    <AppointmentCard
                                        key={appt.id}
                                        appt={appt}
                                        style={{ top: `${topPx}px`, height: `${heightPx}px`, left: '10px', right: '10px' }}
                                        onClick={(e) => { e.stopPropagation(); handleOpenForm(new Date(), appt); }}
                                        onDragStart={handleDragStart}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                // --- WEEK VIEW ---
                <div className="flex-1 p-2 md:p-4 overflow-hidden flex flex-col">
                    <div className="rounded-xl flex-1 overflow-y-auto custom-scrollbar relative flex flex-col h-full bg-zinc-900/30 border border-zinc-800">
                        {/* Headers */}
                        <div className="flex border-b border-zinc-800 sticky top-0 z-40 bg-zinc-950">
                            <div className="w-12 md:w-16 flex-shrink-0 border-r border-zinc-800/50 bg-zinc-950/30" />
                            <div className="flex-1 grid grid-cols-7 divide-x divide-zinc-800/50">
                                {weekDays.map(day => {
                                    const isToday = isSameDay(day, new Date());
                                    return (
                                        <div key={day.toISOString()} className={`py-4 flex flex-col items-center justify-center ${isToday ? 'bg-[#d4af37]/10' : ''}`}>
                                            <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider ${isToday ? 'text-[#d4af37]' : 'text-zinc-500'}`}>{format(day, 'EEE', { locale: ptBR })}</span>
                                            <div className={`mt-1 w-8 h-8 flex items-center justify-center rounded-full text-sm md:text-base font-bold ${isToday ? 'bg-[#d4af37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-white'}`}>
                                                {format(day, 'dd')}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Week Grid */}
                        <div className="flex relative" style={{ height: `${GRID_HEIGHT}px` }}>
                            <div className="w-12 md:w-16 flex-shrink-0 border-r border-zinc-800/50 bg-zinc-950/30 sticky left-0 z-30">
                                {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
                                    const hour = START_HOUR + i;
                                    return (
                                        <div key={hour} className="h-20 border-b border-zinc-800/10 flex items-start justify-center pt-2 relative">
                                            <span className="text-[10px] md:text-xs font-mono font-bold text-zinc-500 absolute -top-3 bg-zinc-950 px-1 rounded">{String(hour).padStart(2, '0')}:00</span>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="flex-1 grid grid-cols-7 divide-x divide-zinc-800/50 relative">
                                {weekDays.map(day => (
                                    <div
                                        key={day.toISOString()}
                                        className="relative h-full group transition-colors hover:bg-white/[0.02]"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => processDrop(e, day)}
                                        onClick={(e) => handleGridClick(e, day)}
                                        style={{ minWidth: '0' }}
                                    >
                                        {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                                            <div key={i} className="h-20 w-full border-b border-zinc-800/20 box-border pointer-events-none" style={{ top: `${i * 80}px`, position: 'absolute' }} />
                                        ))}

                                        {nowLine >= 0 && isSameDay(day, new Date()) && (
                                            <div className="absolute w-full border-t-2 border-red-500/70 z-30 pointer-events-none flex items-center" style={{ top: `${nowLine}px` }}>
                                                <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                                            </div>
                                        )}

                                        {filteredAppointments.filter(a => isSameDay(parseISO(a.data_horario), day)).map(appt => {
                                            const startDate = parseISO(appt.data_horario);
                                            const startH = startDate.getHours();
                                            const startM = startDate.getMinutes();
                                            if (startH < START_HOUR || startH >= END_HOUR) return null;
                                            const topPx = ((startH - START_HOUR) * 60 + startM) / 60 * 80;
                                            const heightPx = (appt.duration_minutes / 60) * 80;

                                            return (
                                                <AppointmentCard
                                                    key={appt.id}
                                                    appt={appt}
                                                    className="mx-0.5 md:mx-1"
                                                    style={{ top: `${topPx}px`, height: `${heightPx}px`, left: '0', right: '0' }}
                                                    onClick={(e) => { e.stopPropagation(); handleOpenForm(new Date(), appt); }}
                                                    onDragStart={handleDragStart}
                                                />
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL --- */}
            <AnimatePresence>
                {isFormOpen && (
                    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsFormOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-2">
                                <Plus className="text-[#d4af37]" />
                                {formData.id ? 'Editar' : 'Novo'} Agendamento
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Serviço</label>
                                    <select
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white font-bold outline-none focus:border-[#d4af37]"
                                        value={formData.servico_id}
                                        onChange={e => handleServiceChange(e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {availableServices.map(s => (
                                            <option key={s.id} value={s.id}>{s.nome} - {s.duration} min</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Profissional</label>
                                    <select
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white font-bold outline-none focus:border-[#d4af37]"
                                        value={formData.professional}
                                        onChange={e => setFormData({ ...formData, professional: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Bruna">Bruna</option>
                                        <option value="Luis">Luis</option>
                                        <option value="William">William</option>
                                        <option value="Antonio">Antonio</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Duração</label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white font-bold outline-none focus:border-[#d4af37]"
                                                    value={Math.floor((formData.duration || 0) / 60)}
                                                    onChange={e => {
                                                        const newHours = parseInt(e.target.value) || 0;
                                                        const currentMinutes = (formData.duration || 0) % 60;
                                                        setFormData({ ...formData, duration: (newHours * 60) + currentMinutes });
                                                    }}
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs font-bold">HRS</div>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white font-bold outline-none focus:border-[#d4af37]"
                                                    value={(formData.duration || 0) % 60}
                                                    onChange={e => {
                                                        const newMinutes = parseInt(e.target.value) || 0;
                                                        const currentHours = Math.floor((formData.duration || 0) / 60);
                                                        setFormData({ ...formData, duration: (currentHours * 60) + newMinutes });
                                                    }}
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs font-bold">MIN</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white" placeholder="Nome do Cliente" value={formData.cliente_nome} onChange={e => setFormData({ ...formData, cliente_nome: e.target.value })} />
                                <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white" placeholder="Telefone" value={formData.cliente_telefone} onChange={e => setFormData({ ...formData, cliente_telefone: e.target.value })} />

                                {/* PRICE INPUT (USER REQUESTED POSITION) */}
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-zinc-400">Preço (R$)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value as any })}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white font-bold"
                                        placeholder="0.00"
                                    />
                                </div>

                                {formData.servico_id === 'custom' && (
                                    <div className="grid grid-cols-1 gap-4">
                                        <input className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm" placeholder="Descrição do Serviço" value={customDescription} onChange={e => setCustomDescription(e.target.value)} />
                                    </div>
                                )}
                            </div>

                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex flex-col gap-3 mt-4">

                                {/* DATE INPUT */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-500 font-bold uppercase">Data do Agendamento</span>
                                    <input
                                        type="date"
                                        required
                                        className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white font-bold text-sm outline-none focus:border-[#d4af37]"
                                        value={formData.data_horario ? format(parseISO(formData.data_horario), 'yyyy-MM-dd') : ''}
                                        onChange={(e) => {
                                            if (!e.target.value) return;
                                            const current = formData.data_horario ? parseISO(formData.data_horario) : new Date();
                                            const [year, month, day] = e.target.value.split('-').map(Number);
                                            // Set new date keeping time
                                            const newDate = new Date(current);
                                            newDate.setFullYear(year);
                                            newDate.setMonth(month - 1);
                                            newDate.setDate(day);
                                            setFormData({ ...formData, data_horario: newDate.toISOString() });
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-500 font-bold uppercase">Início</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max="23"
                                            className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-center text-white font-mono font-bold outline-none focus:border-[#d4af37]"
                                            value={formData.data_horario ? parseISO(formData.data_horario).getHours() : 0}
                                            onChange={e => {
                                                const date = parseISO(formData.data_horario);
                                                const newDate = setHours(date, parseInt(e.target.value) || 0);
                                                setFormData({ ...formData, data_horario: newDate.toISOString() });
                                            }}
                                        />
                                        <span className="text-zinc-500 font-bold">:</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="59"
                                            className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-center text-white font-mono font-bold outline-none focus:border-[#d4af37]"
                                            value={formData.data_horario ? parseISO(formData.data_horario).getMinutes() : 0}
                                            onChange={e => {
                                                const date = parseISO(formData.data_horario);
                                                const newDate = setMinutes(date, parseInt(e.target.value) || 0);
                                                setFormData({ ...formData, data_horario: newDate.toISOString() });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 text-xs">
                                    <span className="text-zinc-500">Previsão Término:</span>
                                    <span className="text-[#d4af37] font-mono font-bold">
                                        {(() => {
                                            if (!formData.data_horario) return '--:--';
                                            return format(addMinutes(parseISO(formData.data_horario), formData.duration || 30), 'HH:mm');
                                        })()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-6">
                                {formData.id && (
                                    <button
                                        onClick={handleDelete}
                                        disabled={isSaving}
                                        className="bg-red-600/20 text-red-500 border border-red-900/50 font-black uppercase py-4 px-6 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                        type="button"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <button onClick={handleSaveForm} disabled={isSaving} className="flex-1 bg-[#d4af37] text-black font-black uppercase py-4 rounded-xl hover:bg-[#b5952f] transition-all">
                                    {isSaving ? 'Salvando...' : 'Confirmar Agendamento'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}