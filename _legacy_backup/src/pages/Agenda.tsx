import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, isSameDay, parseISO, isSameMonth, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckCircle2, Scissors as ScissorsIcon, Trash2, MessageSquare, Plus, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';

// --- TYPES ---
interface Appointment {
    id: any;
    cliente_nome: string;
    cliente_telefone?: string;
    servico_nome: string;
    data_horario: string;
    barbeiro_id: any;
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
    onDragStart
}: {
    appt: Appointment;
    onClick: (e: React.MouseEvent) => void;
    onDragStart: (e: React.DragEvent, id: any) => void;
}) => {
    return (
        <motion.div
            layoutId={appt.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-2 z-10 cursor-grab active:cursor-grabbing"
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
            </div>
        </motion.div>
    );
});

// --- MAIN COMPONENT ---

export default function Agenda() {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [notification, setNotification] = useState<string | null>(null);
    const [activeManagement, setActiveManagement] = useState<Appointment | null>(null);

    // Initial Data Fetch
    const fetchData = useCallback(async (date: Date) => {
        const start = startOfMonth(date).toISOString();
        const end = endOfMonth(date).toISOString();

        // 1. Fetch from Supabase
        const { data, error } = await supabase
            .from('agendamentos')
            .select(`
                *,
                servicos (
                    nome
                )
            `)
            .gte('data_horario', start)
            .lte('data_horario', end);

        let mergedAppointments: Appointment[] = [];

        // 2. Load from LocalStorage (Source of Truth for Demo)
        const localData = localStorage.getItem('demo_appointments');
        const localAppointments: Appointment[] = localData ? JSON.parse(localData) : [];

        if (!error && data) {
            console.log("🐛 DEBUG DATA SOURCE: Data from Supabase:", data);
            const serverAppointments = data.map((d: any) => ({
                ...d,
                servico_nome: d.servicos?.nome || 'SERVIÇO INDEFINIDO'
            }));

            // Merge Strategy: Keep local items that are NOT in server (by ID) + Server items
            mergedAppointments = [
                ...serverAppointments,
                ...localAppointments.filter(local => !serverAppointments.find((server: any) => server.id === local.id))
            ];
        } else {
            // Fallback
            mergedAppointments = localAppointments;
            // SANITIZATION: Removed mock data fallback
            // Fallback
            mergedAppointments = localAppointments;
        }

        setAppointments(mergedAppointments);
    }, []);

    useEffect(() => {
        fetchData(currentDate);
    }, [currentDate.getMonth(), currentDate.getFullYear(), fetchData]);

    // Helpers
    const showToast = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
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

    const handleSlotClick = useCallback(async (date: Date, time: string) => {
        console.log('Slot clicado:', date, time);
        const [hour, minute] = time.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hour, minute, 0, 0);

        const conflict = appointments.find(a => isSameDay(parseISO(a.data_horario), newDate) && format(parseISO(a.data_horario), "HH:mm") === time);
        if (conflict) {
            showToast("⚠️ Horário Ocupado");
            return;
        }

        const name = window.prompt("Nome do Cliente:");
        if (!name) return;

        const phone = window.prompt("Telefone do Cliente (Obrigatório):");
        if (!phone) {
            alert("Telefone é obrigatório para agendamento.");
            return;
        }

        const tempId = crypto.randomUUID();
        const newAppt: Appointment = {
            id: tempId,
            cliente_nome: name.toUpperCase(),
            cliente_telefone: phone,
            servico_nome: "CORTE SOCIAL",
            data_horario: newDate.toISOString(),
            barbeiro_id: "872bd265-fe95-4ed3-9285-1fdbc72daae8",
            status: 'agendado',
            valor_total: 40,
            // @ts-ignore
            servico_id: "4683b8a3-0c4d-4627-bd39-0d2708d66934"
        };

        const nextAppointments = [...appointments, newAppt];
        setAppointments(nextAppointments);
        localStorage.setItem('demo_appointments', JSON.stringify(nextAppointments));
        showToast("Agendamento criado!");

        try {
            const { id, servico_nome, ...rest } = newAppt;
            const payload = { ...rest };
            const { data, error } = await supabase.from('agendamentos').insert(payload).select(`*, servicos (nome)`).single();

            if (error) {
                console.warn("Supabase Sync Error (Demo Mode - Ignored):", error);
            } else if (data) {
                const mapped = {
                    ...data,
                    servico_nome: data.servicos?.nome || 'SERVIÇO INDEFINIDO'
                };
                const finalAppointments = nextAppointments.map(a => a.id === tempId ? mapped : a);
                setAppointments(finalAppointments);
                localStorage.setItem('demo_appointments', JSON.stringify(finalAppointments));
            }
        } catch (err) {
            console.warn("Critical Sync Failure (Demo Mode - Ignored):", err);
        }
    }, [appointments]);

    const handleFabClick = useCallback(() => {
        const now = new Date();
        const currentHour = now.getHours();
        // Default to next full hour
        const nextTime = `${String(currentHour + 1).padStart(2, '0')}:00`;
        handleSlotClick(currentDate, nextTime);
    }, [currentDate, handleSlotClick]);

    // ACTIONS
    const handleWipeDatabase = async () => {
        // @ts-ignore
        if (!confirm('TEM CERTEZA? Isso apaga tudo do banco Supabase.')) return;

        alert('Limpando...'); // Visual feedback requested by user

        const { error } = await supabase.from('agendamentos').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
            alert('Erro: ' + error.message);
        } else {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="h-screen bg-black text-white flex overflow-hidden">
            <Sidebar perfil={{ nome: 'DEMO USER', cargo: 'barbeiro' }} onLogout={() => { }} />

            <main className="flex-1 flex flex-col h-full relative overflow-hidden">
                <header className="px-8 py-6 flex items-center justify-between shrink-0 bg-zinc-950 border-b border-zinc-900 z-50">
                    <div>
                        <h1 className="text-2xl font-serif font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            CARTEL 96 <span className="text-[#d4af37] opacity-60 text-xs font-sans tracking-[0.3em] font-normal border-l border-zinc-800 pl-3">GESTÃO PROFISSIONAL</span>
                        </h1>
                        <button
                            onClick={handleWipeDatabase}
                            className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-red-900/50"
                        >
                            LIMPAR BANCO DE DADOS (PERIGO)
                        </button>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex bg-zinc-900/50 rounded-xl p-1 border border-zinc-800">
                            <button onClick={() => setCurrentDate(d => addDays(d, -1))} className="p-3 hover:text-white text-zinc-500 transition-colors"><ChevronLeft size={16} /></button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-4 text-[10px] font-black uppercase text-zinc-400 hover:text-[#d4af37] transition-colors tracking-widest">HOJE</button>
                            <button onClick={() => setCurrentDate(d => addDays(d, 1))} className="p-3 hover:text-white text-zinc-500 transition-colors"><ChevronRight size={16} /></button>
                        </div>
                        <div className="flex bg-zinc-900/50 rounded-xl p-1 border border-zinc-800">
                            <button onClick={() => setViewMode('day')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'day' ? 'bg-[#d4af37] text-black shadow-lg scale-105' : 'text-zinc-500 hover:bg-zinc-800'}`}>DIA</button>
                            <button onClick={() => setViewMode('week')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-[#d4af37] text-black shadow-lg scale-105' : 'text-zinc-500 hover:bg-zinc-800'}`}>SEMANA</button>
                            <button onClick={() => setViewMode('month')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-[#d4af37] text-black shadow-lg scale-105' : 'text-zinc-500 hover:bg-zinc-800'}`}>MÊS</button>
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
                                                const appt = appointments.find(a => isSameDay(parseISO(a.data_horario), currentDate) && format(parseISO(a.data_horario), "HH:00") === time);
                                                return (
                                                    <div key={time} className="grid" style={{ gridTemplateColumns: '100px 1fr' }}>
                                                        <div className="flex items-center justify-center border-r border-zinc-900 text-[11px] font-serif italic text-zinc-600">{time}</div>
                                                        <TimeSlot
                                                            time={time}
                                                            date={currentDate}
                                                            onClick={() => handleSlotClick(currentDate, time)}
                                                            onDrop={processDrop}
                                                        >
                                                            {appt && (
                                                                <AppointmentCard
                                                                    appt={appt}
                                                                    onClick={(e) => { e.stopPropagation(); setActiveManagement(appt); }}
                                                                    onDragStart={handleDragStart}
                                                                />
                                                            )}
                                                        </TimeSlot>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            case 'week':
                                return (
                                    <div key="week-view" className="flex-1 w-full min-h-[80vh] flex flex-col overflow-y-auto overflow-x-hidden">
                                        {/* Week Header */}
                                        <div className="grid border-b border-zinc-900 bg-zinc-950 sticky top-0 z-40" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
                                            <div className="h-16 border-r border-zinc-900" />
                                            {Array.from({ length: 7 }).map((_, i) => {
                                                const day = addDays(startOfWeek(currentDate, { weekStartsOn: 0 }), i);
                                                const isToday = isSameDay(day, new Date());
                                                return (
                                                    <div key={i} className="h-16 flex flex-col items-center justify-center border-r border-zinc-900/50 bg-zinc-900/10">
                                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{format(day, 'EEE', { locale: ptBR })}</span>
                                                        <span className={`text-xl font-serif font-black ${isToday ? 'text-[#d4af37]' : 'text-zinc-500'}`}>{format(day, 'dd')}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Week Grid Content */}
                                        <div className="grid w-full" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
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
                                                            // Find appointment for this Slot
                                                            const appt = appointments.find(a =>
                                                                isSameDay(parseISO(a.data_horario), day) &&
                                                                format(parseISO(a.data_horario), "HH:00") === time
                                                            );

                                                            return (
                                                                <div key={time} className="h-[100px] border-b border-zinc-900/30 relative bg-zinc-950/20 hover:bg-zinc-900/40 transition-colors">
                                                                    <TimeSlot
                                                                        time={time}
                                                                        date={day}
                                                                        onClick={() => handleSlotClick(day, time)}
                                                                        onDrop={processDrop}
                                                                    >
                                                                        {appt && (
                                                                            <AppointmentCard
                                                                                appt={appt}
                                                                                onClick={(e) => { e.stopPropagation(); setActiveManagement(appt); }}
                                                                                onDragStart={handleDragStart}
                                                                            />
                                                                        )}
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
                                                    return format(apptDate, 'yyyy-MM-dd') === cellDateStr;
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

                {/* FAB */}
                <button
                    onClick={() => {
                        console.log('FAB Clicado');
                        handleFabClick();
                    }}
                    className="fixed bottom-8 right-8 w-14 h-14 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-400 hover:scale-110 transition-all z-[9999] cursor-pointer"
                >
                    <Plus className="w-8 h-8 text-black" />
                </button>
            </main>

            <AnimatePresence>
                {activeManagement && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveManagement(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-zinc-950 border border-zinc-800 p-8 rounded-[32px] w-full max-w-sm shadow-2xl">
                            <h2 className="text-center text-3xl font-serif font-black text-white uppercase mb-2">{activeManagement.cliente_nome}</h2>
                            <p className="text-center text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8">{activeManagement.servico_nome}</p>

                            <div className="grid gap-3">
                                <button
                                    onClick={() => {
                                        console.log("🚀 WhatsApp Webhook Payload:", {
                                            client: activeManagement.cliente_nome,
                                            phone: activeManagement.cliente_telefone || "N/A",
                                            date: activeManagement.data_horario,
                                            service: activeManagement.servico_nome
                                        });
                                        alert(`Simulação: Enviando WhatsApp para ${activeManagement.cliente_telefone || 'Sem telefone'}...`);
                                    }}
                                    className="h-16 bg-green-600 hover:bg-green-700 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-colors border border-green-800"
                                >
                                    <MessageCircle size={18} /> Enviar Lembrete WhatsApp
                                </button>
                                <button
                                    onClick={() => {
                                        navigate(`/messages?newChat=true&name=${encodeURIComponent(activeManagement.cliente_nome)}&service=${encodeURIComponent(activeManagement.servico_nome)}`);
                                        setActiveManagement(null);
                                    }}
                                    className="h-16 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-colors border border-zinc-800"
                                >
                                    <MessageSquare size={18} className="text-[#d4af37]" /> Mensagem
                                </button>
                                <button
                                    onClick={() => handleDelete(activeManagement.id)}
                                    className="h-16 bg-red-950/20 hover:bg-red-950/40 text-red-500 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-colors border border-red-900/20"
                                >
                                    <Trash2 size={18} /> Excluir
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {notification && (
                    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-[#d4af37] text-black px-8 py-3 rounded-full font-black text-xs uppercase shadow-[0_0_30px_rgba(212,175,55,0.4)] flex items-center gap-2 border border-white/20">
                        <CheckCircle2 size={16} /> {notification}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}