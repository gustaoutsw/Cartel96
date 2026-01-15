import React, { memo, useRef } from 'react';
import { User, CheckCircle, MessageSquare, Edit, Plus, Scissors, Trash2 } from 'lucide-react';

interface Booking {
    id: any;
    cliente_nome: string;
    data_horario: string;
    status: 'agendado' | 'atendimento' | 'finalizado' | 'cancelado' | 'noshow';
    barbeiro_id: any;
}

interface AgendaSlotProps {
    date: Date;
    time: string;
    booking?: Booking;
    isDragging?: boolean;
    isDropTarget?: boolean;
    isBlur?: boolean;
    onClick: (date: Date, time: string, booking?: Booking) => void;
    onAction: (action: 'check-in' | 'whatsapp' | 'edit' | 'delete', booking: Booking, e: React.MouseEvent) => void;
    onDragStartOp: (booking: Booking, e: React.MouseEvent) => void;
    onMouseEnter: (date: Date, time: string) => void;
}

const AgendaSlot = memo(({
    date, time, booking, isDragging, isDropTarget, isBlur,
    onClick, onAction, onDragStartOp, onMouseEnter
}: AgendaSlotProps) => {

    const timeoutRef = useRef<any>(null);
    const hasTriggeredDrag = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!booking) return;
        hasTriggeredDrag.current = false;

        // Iniciar timer para "Desplugar" (Sticky Mode)
        timeoutRef.current = setTimeout(() => {
            hasTriggeredDrag.current = true;
            onDragStartOp(booking, e);
        }, 300); // 300ms para ativar o modo flutuante
    };

    const handleMouseUp = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    // Wrapper para Click: Só dispara se não virou Drag
    const handleClick = (e: React.MouseEvent) => {
        if (hasTriggeredDrag.current) {
            e.stopPropagation();
            return;
        }
        onClick(date, time, booking);
    };

    // RENDERIZAÇÃO ESTADO OCUPADO
    if (booking) {
        if (isDragging) {
            // Slot original fica "ocupado" visualmente mas esmaecido
            return (
                <div className="h-[90px] p-1 border-r border-b border-zinc-800/30">
                    <div className="w-full h-full rounded-xl flex items-center justify-center bg-zinc-900/50 border border-dashed border-[#d4af37]/30">
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest animate-pulse">EM MOVIMENTO...</span>
                    </div>
                </div>
            );
        }

        let statusStyles = '';
        let statusIcon = <User size={14} />;

        switch (booking.status) {
            case 'atendimento':
                statusStyles = 'bg-black border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.15)] animate-pulse';
                statusIcon = <Scissors size={14} className="text-[#d4af37]" />; // Increased from 12
                break;
            case 'finalizado':
                statusStyles = 'bg-zinc-900 border-zinc-800 opacity-50 grayscale';
                statusIcon = <CheckCircle size={14} className="text-zinc-600" />; // Increased from 12
                break;
            case 'agendado':
            default:
                statusStyles = 'bg-[#10b981]/5 border-[#10b981]/40 shadow-[0_0_10px_rgba(16,185,129,0.05)]';
                statusIcon = <User size={14} className="text-[#10b981]" />; // Increased from 12
                break;
        }

        return (
            <div
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                className={`relative h-[90px] p-1 transition-all duration-300 group cursor-pointer border-r border-b border-zinc-800/50 hover:bg-zinc-900/40 select-none ${isBlur ? 'blur-sm opacity-40 scale-95 grayscale' : ''}`}
            >
                <div className={`w-full h-full rounded-xl p-3 flex flex-col justify-center relative overflow-hidden transition-transform duration-200 hover:scale-[1.02] ${statusStyles}`}>

                    {/* STATUS INDICATOR BAR */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${booking.status === 'atendimento' ? 'bg-[#d4af37]' : booking.status === 'finalizado' ? 'bg-zinc-700' : 'bg-[#10b981]'}`} />

                    <div className="flex items-center gap-2 mb-1 pl-2">
                        {statusIcon}
                        <span className="text-sm font-black text-white uppercase truncate tracking-wide leading-none pt-0.5">
                            {booking.cliente_nome}
                        </span>
                    </div>

                    {booking.status !== 'finalizado' && (
                        <div className="pl-2 mt-1 w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-white/20 h-full w-[40%]" />
                        </div>
                    )}

                    {/* QUICK ACTIONS OVERLAY (Hover) */}
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                        <button
                            onClick={(e) => onAction('whatsapp', booking, e)}
                            className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-[#25D366] hover:bg-black transition-colors border border-zinc-800 active:scale-95"
                            title="WhatsApp"
                        >
                            <MessageSquare size={14} />
                        </button>
                        <button
                            onClick={(e) => onAction('check-in', booking, e)}
                            className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-[#d4af37] hover:bg-black transition-colors border border-zinc-800 active:scale-95"
                            title="Check-in / Iniciar"
                        >
                            <Scissors size={14} />
                        </button>
                        <button
                            onClick={(e) => onAction('edit', booking, e)}
                            className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-blue-400 hover:bg-black transition-colors border border-zinc-800 active:scale-95"
                            title="Editar"
                        >
                            <Edit size={14} />
                        </button>
                        <button
                            onClick={(e) => onAction('delete', booking, e)}
                            className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-red-500 hover:bg-black transition-colors border border-zinc-800 active:scale-95"
                            title="Excluir"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // RENDERIZAÇÃO ESTADO LIVRE
    return (
        <div
            onMouseEnter={() => onMouseEnter(date, time)}
            onClick={() => onClick(date, time)}
            className={`h-[90px] border-r border-b border-zinc-800/50 p-1 group cursor-pointer relative transition-all duration-300 hover:bg-white/5 ${isDropTarget ? 'bg-[#d4af37]/10' : ''} ${isBlur ? 'blur-[1px] opacity-30' : ''}`}
        >
            <div className={`w-full h-full rounded-xl border border-dashed flex items-center justify-center transition-all ${isDropTarget ? 'border-[#d4af37] shadow-[inset_0_0_30px_rgba(212,175,55,0.15)] scale-95' : 'border-zinc-800/30 group-hover:border-[#d4af37]/50'}`}>
                {isDropTarget ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <div className="w-2 h-2 bg-[#d4af37] rounded-full mb-1 shadow-[0_0_10px_#d4af37]" />
                        <span className="text-[9px] font-black text-[#d4af37] tracking-widest uppercase">Soltar</span>
                    </div>
                ) : (
                    <Plus size={16} className="text-zinc-800 group-hover:text-[#d4af37]/80 transition-colors" />
                )}
            </div>
        </div>
    );
}, (prev, next) => {
    return (
        prev.date.getTime() === next.date.getTime() &&
        prev.time === next.time &&
        prev.booking?.id === next.booking?.id &&
        prev.booking?.status === next.booking?.status &&
        prev.isDragging === next.isDragging &&
        prev.isDropTarget === next.isDropTarget &&
        prev.isBlur === next.isBlur
    );
});

export default AgendaSlot;
