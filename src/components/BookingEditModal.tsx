import { useState } from 'react';
import { Clock, Move, Star, ShoppingBag, Check, Calendar } from 'lucide-react';

interface BookingEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: any | null;
    onSaveName: (newName: string) => void;
    onReorder: () => void;
}

export default function BookingEditModal({ isOpen, onClose, booking, onSaveName, onReorder }: BookingEditModalProps) {
    const [name, setName] = useState(booking?.cliente_nome || '');
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

    if (!isOpen || !booking) return null;

    const products = [
        { id: 'pomade', name: 'Pomada Matte', price: 'R$ 45' },
        { id: 'minoxidil', name: 'Minoxidil', price: 'R$ 80' },
        { id: 'oil', name: 'Óleo de Barba', price: 'R$ 35' },
    ];

    const toggleProduct = (id: string) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-zinc-950 border border-[#d4af37]/30 rounded-[2rem] w-full max-w-md overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] relative ring-1 ring-[#d4af37]/10 flex flex-col max-h-[90vh]">

                {/* HERO PROFILE HEADER */}
                <div className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 p-6 pt-10 text-center relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#d4af37] via-transparent to-transparent" />

                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-zinc-400 hover:text-white hover:bg-black transition-all z-20">✕</button>

                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-black border-2 border-[#d4af37] rounded-full mx-auto flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(212,175,55,0.3)] ring-4 ring-black/50">
                            {/* Mock Avatar or Initials */}
                            <span className="text-3xl font-serif font-black text-[#d4af37]">{name.charAt(0)}</span>
                        </div>

                        <div className="flex items-center justify-center gap-2 mb-1">
                            <h2 className="text-2xl font-serif font-black text-white tracking-tight">{name}</h2>
                            <div className="bg-[#d4af37] text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg">
                                <Star size={10} fill="black" /> VIP
                            </div>
                        </div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Cliente desde 2023</p>
                    </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="p-6 space-y-8 overflow-y-auto scrollbar-hide">

                    {/* INFO ROW */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/50 flex flex-col items-center justify-center gap-1">
                            <Calendar size={16} className="text-zinc-500" />
                            <span className="text-[#d4af37] font-bold text-sm">{new Date(booking.data_horario).toLocaleDateString()}</span>
                        </div>
                        <div className="bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/50 flex flex-col items-center justify-center gap-1">
                            <Clock size={16} className="text-zinc-500" />
                            <span className="text-[#d4af37] font-bold text-sm">{new Date(booking.data_horario).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>

                    {/* UPSELL SECTION */}
                    <div className="bg-zinc-900/20 rounded-3xl p-5 border border-zinc-800/50 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-4">
                            <ShoppingBag size={16} className="text-[#d4af37]" />
                            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Recomendações do Barbeiro</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {products.map(prod => {
                                const isSelected = selectedProducts.includes(prod.id);
                                return (
                                    <button
                                        key={prod.id}
                                        onClick={() => toggleProduct(prod.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${isSelected ? 'bg-[#d4af37]/20 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'bg-black border-zinc-800 hover:border-zinc-700'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'bg-[#d4af37] border-[#d4af37]' : 'border-zinc-700'}`}>
                                                {isSelected && <Check size={10} className="text-black" />}
                                            </div>
                                            <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-zinc-500'}`}>{prod.name}</span>
                                        </div>
                                        <span className="text-xs text-[#d4af37] font-bold">{prod.price}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div>
                        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block mb-2 mx-1">Editar Nome</label>
                        <div className="flex gap-2">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="flex-1 bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#d4af37] transition-all"
                            />
                            <button
                                onClick={() => onSaveName(name)}
                                className="bg-zinc-900 text-zinc-400 border border-zinc-800 px-4 rounded-xl font-bold text-xs hover:bg-zinc-800 hover:text-white transition-all"
                            >
                                SALVAR
                            </button>
                        </div>
                    </div>
                </div>

                {/* FOOTER MASTER ACTION */}
                <div className="p-6 pt-2 bg-zinc-950 border-t border-zinc-900 mt-auto">
                    <button
                        onClick={onReorder}
                        className="w-full py-5 bg-[#d4af37] text-black rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-[#ffe180] active:scale-95 transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                        <Move size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                        Desplugar & Mover
                    </button>
                    <p className="text-center text-[10px] text-zinc-600 font-bold mt-3">
                        O card ficará solto para reagendamento imediato.
                    </p>
                </div>

            </div>
        </div>
    );
}
