import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Loader2, User, ChevronRight, Clock, DollarSign, Calendar, CheckCircle2, ChevronLeft, AlertCircle, LogOut, Sparkles, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BARBERS } from '../../constants/barbers';
import { format, addDays, isSameDay, addMinutes, parseISO, setHours, setMinutes, startOfDay, isBefore, isAfter, getHours, setSeconds, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- TYPES ---

interface Service {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
    professional: string;
}

interface AvailabilityBlock {
    start: Date;
    end: Date;
    duration: number; // minutes
    startIso: string;
    label: string;    // "11:30"
}

// --- ANIMATIONS ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

export default function Booking() {
    // --- STATE ---
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0);

    // User Data
    const [customerName, setCustomerName] = useState<string | null>(null);
    const [customerEmail, setCustomerEmail] = useState<string | null>(null);

    // Selections
    const [selectedBarber, setSelectedBarber] = useState<any | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    // Time Logic
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showSlots, setShowSlots] = useState(false);
    const [availBlocks, setAvailBlocks] = useState<AvailabilityBlock[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState<AvailabilityBlock | null>(null);

    // Form
    const [formData, setFormData] = useState({ name: '', email: '' });

    //   // --- INIT & AUTH ---
    useEffect(() => {
        const cached = localStorage.getItem('cartel_client');
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (data.phone) setPhone(data.phone);
            } catch (e) {
                console.error("Error parsing cached client", e);
            }
        }
    }, []);

    const handleContinue = async () => {
        if (!phone) return;
        setLoading(true);
        try {
            const { data: apptData } = await supabase.from('appointments').select('client_name, client_email').eq('client_phone', phone).limit(1).maybeSingle();
            const { data: clientData } = await supabase.from('clientes').select('nome, email').eq('telefone', phone).maybeSingle();

            const foundName = clientData?.nome || apptData?.client_name;
            const foundEmail = clientData?.email || apptData?.client_email;

            if (foundName) {
                setCustomerName(foundName);
                setCustomerEmail(foundEmail || '');
                localStorage.setItem('cartel_client', JSON.stringify({ name: foundName, email: foundEmail, phone: phone }));
                await new Promise(r => setTimeout(r, 500));
                setStep(2);
            } else {
                await new Promise(r => setTimeout(r, 500));
                setStep(1);
            }
        } catch (error) {
            console.error(error);
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = () => {
        if (!formData.name) return;
        setCustomerName(formData.name);
        setCustomerEmail(formData.email);
        localStorage.setItem('cartel_client', JSON.stringify({ name: formData.name, email: formData.email, phone: phone }));
        setStep(2);
    };

    const logout = () => {
        localStorage.removeItem('cartel_client');
        setPhone('');
        setCustomerName(null);
        setStep(0);
        setSelectedBarber(null);
        setSelectedService(null);
    };

    // --- SERVICE FLOW ---
    const handleBarberSelect = async (barber: any) => {
        setSelectedBarber(barber);
        setStep(3);
        fetchServices(barber.name);
    };

    const fetchServices = async (barberName: string) => {
        setServicesLoading(true);
        const { data } = await supabase.from('services').select('*').eq('professional', barberName).order('name');
        if (data) setServices(data);
        setServicesLoading(false);
    };

    const handleServiceSelect = (service: Service) => {
        setSelectedService(service);
        setSelectedDate(new Date());
        setShowSlots(false);
        setStep(4);
    };

    // --- 2-LEVEL TIMELINE LOGIC (Hour > 10min Slots) ---

    // We store slots grouped by hour: { 8: [slot, slot], 9: [], ... }
    const [groupedSlots, setGroupedSlots] = useState<Record<number, AvailabilityBlock[]>>({});
    const [expandedHour, setExpandedHour] = useState<number | null>(null);

    const handleDateSelect = (date: Date) => {
        setGroupedSlots({});
        setExpandedHour(null);
        setSelectedDate(date);
        setSelectedBlock(null);
        setShowSlots(true);
    };

    useEffect(() => {
        if (step === 4 && selectedBarber && selectedService && showSlots) {
            generateTimelineTwoLevel(selectedDate);
        }
    }, [step, selectedDate, selectedBarber, selectedService, showSlots]);

    const generateTimelineTwoLevel = async (date: Date) => {
        setSlotsLoading(true);
        setGroupedSlots({});

        try {
            if (!selectedBarber || !selectedService) throw new Error("Missing selection");

            // 1. Fetch Appointments
            const { data: existingAppts, error } = await supabase
                .from('appointments')
                .select('start_time, end_time')
                .eq('professional', selectedBarber.name)
                .gte('start_time', startOfDay(date).toISOString())
                .lt('start_time', addDays(startOfDay(date), 1).toISOString())
                .order('start_time');

            if (error) throw error;

            const serviceDuration = selectedService.duration_minutes || 30;

            // Define Day Boundaries
            const startHour = 8;
            const endHour = 19; // Last slot starts max at 19:00? Or work ends at 19:00?
            // Usually "Open 08-19" means closes at 19:00.
            const workEnd = setSeconds(setMinutes(setHours(date, endHour), 0), 0);

            // Prepare busy segments
            const segments = (existingAppts || []).map(a => ({
                start: parseISO(a.start_time),
                end: parseISO(a.end_time)
            }));

            const slotsByHour: Record<number, AvailabilityBlock[]> = {};

            // 2. Generate ALL 10-minute candidates
            // From 08:00 to 18:50 (assuming 19:00 is close time)
            // If service is 30m, last slot can be 18:30 (ends 19:00).

            const now = new Date();

            for (let h = startHour; h < endHour; h++) {
                slotsByHour[h] = [];

                for (let m = 0; m < 60; m += 10) {
                    const pointer = setSeconds(setMinutes(setHours(date, h), m), 0);
                    const slotEnd = addMinutes(pointer, serviceDuration);

                    // A. Check Past
                    if (isSameDay(date, now) && isBefore(pointer, addMinutes(now, 20))) {
                        continue; // Too soon
                    }

                    // B. Check Work End
                    if (isAfter(slotEnd, workEnd)) {
                        continue; // Exceeds closing time
                    }

                    // C. Check Collisions
                    let collision = false;
                    for (const seg of segments) {
                        // Overlap: SegStart < SlotEnd && SegEnd > SlotStart
                        if (isBefore(seg.start, slotEnd) && isAfter(seg.end, pointer)) {
                            collision = true;
                            break;
                        }
                    }

                    if (!collision) {
                        slotsByHour[h].push({
                            start: pointer,
                            end: slotEnd,
                            duration: serviceDuration,
                            startIso: pointer.toISOString(),
                            label: format(pointer, 'HH:mm')
                        });
                    }
                }
            }

            setGroupedSlots(slotsByHour);

        } catch (e) {
            console.error("Timeline Error", e);
        } finally {
            setSlotsLoading(false);
        }
    };

    const handleHourClick = (hour: number) => {
        if (expandedHour === hour) {
            setExpandedHour(null);
        } else {
            setExpandedHour(hour);
        }
    };

    const handleBlockSelect = (block: AvailabilityBlock) => {
        setSelectedBlock(block);
    };

    const handleConfirmBooking = async () => {
        if (!selectedBlock || !selectedService || !selectedBarber) return;
        setLoading(true);

        try {
            const startTime = parseISO(selectedBlock.startIso);
            const endTime = addMinutes(startTime, selectedService.duration_minutes);

            const payload = {
                client_name: customerName,
                client_phone: phone,
                client_email: customerEmail,
                professional: selectedBarber.name,
                service_name: selectedService.name,
                duration_minutes: selectedService.duration_minutes,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                service_id: selectedService.id,
                price: selectedService.price,
                status: 'agendado'
            };

            const { error } = await supabase.from('appointments').insert([payload]);

            if (error) throw error;
            if (phone && customerName) {
                await supabase.from('clientes').upsert(
                    { nome: customerName, telefone: phone, email: customerEmail || '' },
                    { onConflict: 'telefone' }
                );
            }
            setStep(5);
        } catch (error) {
            console.error("Booking Error:", error);
            alert("Houve um erro ao realizar o agendamento. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    // --- UI COMPONENTS ---

    const UserHeader = () => (
        <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 mb-6 backdrop-blur-sm shadow-sm sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#fbbf24] shadow-inner">
                    <User size={16} />
                </div>
                <div className="text-left">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Agendando para</p>
                    <p className="text-sm font-bold text-white leading-none truncate max-w-[150px]">{customerName}</p>
                </div>
            </div>
            <button onClick={logout} className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:text-red-400 text-zinc-400 text-xs font-bold uppercase">Trocar</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 font-sans selection:bg-[#fbbf24] selection:text-black">
            <AnimatePresence mode="wait">

                {/* STEP 0: LOGIN */}
                {step === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
                        <div className="flex flex-col items-center gap-6">
                            <Scissors className="w-10 h-10 text-[#fbbf24]" />
                            <h1 className="text-3xl font-bold text-white">Bem-vindo</h1>
                            <input type="tel" placeholder="(00) 00000-0000" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white text-lg focus:border-[#fbbf24] outline-none" value={phone} onChange={e => setPhone(e.target.value)} />
                            <button onClick={handleContinue} disabled={loading || phone.length < 8} className="w-full bg-[#fbbf24] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#d4a01c] disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin" /> : 'Continuar'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 1: REGISTER */}
                {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold text-white mb-6">Criar Conta</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Seu Nome" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-[#fbbf24] outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            <input type="email" placeholder="Email (Opcional)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-[#fbbf24] outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            <button onClick={handleRegister} disabled={!formData.name} className="w-full bg-[#fbbf24] text-black font-bold py-4 rounded-xl hover:bg-[#d4a01c]">Finalizar</button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 2: BARBER */}
                {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-2xl">
                        <UserHeader />
                        <h2 className="text-center text-zinc-400 text-lg mb-8">Escolha um profissional:</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {BARBERS.map(barber => (
                                <motion.button key={barber.id} whileHover={{ scale: 1.02 }} onClick={() => handleBarberSelect(barber)} className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-[#fbbf24] text-left">
                                    <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
                                        {barber.avatar ? <img src={barber.avatar} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-zinc-500" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{barber.name}</h3>
                                        <p className="text-zinc-500 text-sm">{barber.specialty}</p>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* STEP 3: SERVICES */}
                {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-2xl">
                        <UserHeader />
                        <div className="flex items-center gap-4 mb-8">
                            <button onClick={() => setStep(2)} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-[#fbbf24] text-zinc-400"><ChevronLeft /></button>
                            <h2 className="text-2xl font-bold text-white">{selectedBarber?.name}</h2>
                        </div>
                        <div className="space-y-3">
                            {servicesLoading ? <div className="py-20 flex justify-center text-[#fbbf24]"><Loader2 className="animate-spin w-8 h-8" /></div> : services.map(service => (
                                <motion.button key={service.id} onClick={() => handleServiceSelect(service)} className="w-full bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl flex items-center justify-between hover:bg-zinc-900 hover:border-[#fbbf24] transition-all text-left group">
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-[#fbbf24]">{service.name}</h3>
                                        <div className="flex gap-4 mt-1 text-sm text-zinc-400 font-medium">
                                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {service.duration_minutes} min</span>
                                            <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> R$ {service.price.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-zinc-600 group-hover:text-[#fbbf24]" />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* STEP 4: TWO-LEVEL TIMELINE */}
                {step === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-xl pb-32 h-[85vh] flex flex-col">
                        <UserHeader />
                        <div className="flex items-center gap-4 mb-4 flex-shrink-0">
                            <button onClick={() => setStep(3)} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-[#fbbf24] text-zinc-400"><ChevronLeft /></button>
                            <div>
                                <p className="text-zinc-500 text-xs font-bold uppercase">Agendamento</p>
                                <h2 className="text-xl font-bold text-white">{selectedBarber?.name} • {selectedService?.name}</h2>
                            </div>
                        </div>

                        {/* Date Picker */}
                        <div className="mb-6 flex-shrink-0">
                            <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-[#fbbf24]" /> Selecione a Data</h3>
                            <div className="flex gap-3 overflow-x-auto pb-4 px-1 snap-x mandatory scrollbar-hide mask-linear-fade">
                                {Array.from({ length: 14 }).map((_, i) => {
                                    const date = addDays(new Date(), i);
                                    const isSelected = isSameDay(date, selectedDate);
                                    return (
                                        <button key={i} onClick={() => handleDateSelect(date)} className={`flex-shrink-0 w-20 h-24 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all snap-center ${isSelected ? 'bg-[#fbbf24] border-[#fbbf24] text-black scale-105 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'}`}>
                                            <span className="text-xs font-bold uppercase">{format(date, 'EEE', { locale: ptBR })}</span>
                                            <span className="text-2xl font-black">{format(date, 'dd')}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        {/* TIMELINE LIST (2-LEVEL) */}
                        <div className="flex-1 overflow-y-auto px-1 custom-scrollbar relative">
                            <AnimatePresence mode="wait">
                                {showSlots && (
                                    <motion.div key={selectedDate.toISOString()} initial="hidden" animate="visible" variants={containerVariants} className="space-y-4 pb-32">
                                        {slotsLoading ? (
                                            <div className="py-20 flex flex-col items-center justify-center text-[#fbbf24] gap-3">
                                                <Loader2 className="animate-spin w-10 h-10" />
                                                <p className="text-zinc-500 text-sm">Carregando horários...</p>
                                            </div>
                                        ) : Object.keys(groupedSlots).length === 0 || Object.values(groupedSlots).every(arr => arr.length === 0) ? (
                                            <div className="py-10 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                                                Nenhum horário disponível para hoje.
                                            </div>
                                        ) : (
                                            // Iterate '08' to '18'
                                            Object.entries(groupedSlots).map(([hourStr, slots]) => {
                                                const hour = parseInt(hourStr);
                                                if (slots.length === 0) return null; // Hide empty hours

                                                const isExpanded = expandedHour === hour;

                                                return (
                                                    <motion.div key={hour} variants={itemVariants} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                                                        {/* Hour Header */}
                                                        <button
                                                            onClick={() => handleHourClick(hour)}
                                                            className={`w-full p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors ${isExpanded ? 'bg-zinc-800/80' : ''}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`text-2xl font-black ${isExpanded ? 'text-[#fbbf24]' : 'text-white'}`}>
                                                                    {hour.toString().padStart(2, '0')}:00
                                                                </div>
                                                                <div className="text-xs font-bold text-emerald-500 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/50">
                                                                    {slots.length} opções
                                                                </div>
                                                            </div>
                                                            <ChevronRight className={`text-zinc-500 transition-transform ${isExpanded ? 'rotate-90 text-[#fbbf24]' : ''}`} />
                                                        </button>

                                                        {/* Sub-slots Grid */}
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden bg-zinc-950/30"
                                                                >
                                                                    <div className="p-4 grid grid-cols-3 gap-3">
                                                                        {slots.map((slot, idx) => {
                                                                            const isSelected = selectedBlock?.startIso === slot.startIso;
                                                                            return (
                                                                                <button
                                                                                    key={idx}
                                                                                    onClick={() => handleBlockSelect(slot)}
                                                                                    className={`py-3 rounded-xl border font-bold text-sm transition-all ${isSelected
                                                                                        ? 'bg-[#fbbf24] border-[#fbbf24] text-black shadow-lg scale-105'
                                                                                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-[#fbbf24] hover:text-[#fbbf24]'
                                                                                        }`}
                                                                                >
                                                                                    {slot.label}
                                                                                </button>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.div>
                                                )
                                            })
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {/* CONFIRMATION FAB (OUTSIDE SCROLL) */}
                <AnimatePresence>
                    {step === 4 && selectedBlock && (
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50 }} className="fixed bottom-6 left-4 right-4 max-w-xl mx-auto z-50">
                            <button onClick={handleConfirmBooking} disabled={loading} className="w-full bg-[#fbbf24] hover:bg-[#d4a01c] text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-2xl flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="animate-spin" /> : `Confirmar às ${format(parseISO(selectedBlock.startIso), 'HH:mm')}`}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* STEP 5: SUCCESS */}
                {step === 5 && (
                    <motion.div key="step5" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl backdrop-blur-md">
                        <CheckCircle2 className="w-20 h-20 text-[#fbbf24] mx-auto mb-6" />
                        <h2 className="text-3xl font-black text-white mb-2">Agendado!</h2>
                        <p className="text-zinc-400 mb-8">Confirmado para <strong>{format(parseISO(selectedBlock!.startIso), "dd/MM 'às' HH:mm")}</strong></p>
                        <button onClick={() => window.location.reload()} className="w-full py-3 rounded-xl bg-zinc-800 text-white font-bold">Voltar</button>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
