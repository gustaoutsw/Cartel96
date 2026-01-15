import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MoreVertical, Send, CheckCheck, Zap, MessageSquare, Calendar, ShoppingBag } from 'lucide-react';

// --- TYPES ---
interface Message {
    id: number;
    text: string;
    sender: 'me' | 'client';
    time: string;
    status: 'sent' | 'delivered' | 'read';
}

interface ClientProfile {
    name: string;
    avatar: string;
    phone: string;
    lastService: string;
    lastDate: string;
    ltv: number;
    favoriteBarber: string;
    tags: string[];
    status: 'vip' | 'new' | 'risk';
}

interface Conversation {
    id: number;
    client: ClientProfile;
    lastMessage: string;
    lastTime: string;
    unread: number;
    status: 'open' | 'waiting' | 'closed';
    automationTag?: 'Agendamento Próximo' | 'Recuperação' | 'Aniversário';
    messages: Message[];
}

// --- INITIAL MOCK DATA ---
const INITIAL_CONVERSATIONS: Conversation[] = [
    {
        id: 1,
        client: { name: "Ricardo Oliveira", avatar: "RO", phone: "11 99999-9999", lastService: "Corte Degradê", lastDate: "Ontem", ltv: 1250.00, favoriteBarber: "Gustavo", tags: ['VIP'], status: 'vip' },
        lastMessage: "Confirmado! Te vejo amanhã então.",
        lastTime: "10:45",
        unread: 0,
        status: 'open',
        automationTag: 'Agendamento Próximo',
        messages: [
            { id: 1, text: "Olá Ricardo, tudo bem? Lembrando do seu horário amanhã às 14h.", sender: 'me', time: "10:30", status: 'read' },
            { id: 2, text: "Opa, tudo certo! Estarei lá.", sender: 'client', time: "10:40", status: 'read' },
            { id: 3, text: "Confirmado! Te vejo amanhã então.", sender: 'me', time: "10:45", status: 'read' },
        ]
    },
    {
        id: 2,
        client: { name: "Felipe Costa", avatar: "FC", phone: "11 98888-8888", lastService: "Barba & Bigode", lastDate: "20 dias atrás", ltv: 450.00, favoriteBarber: "Lucas", tags: [], status: 'risk' },
        lastMessage: "Ainda tem horário para hoje?",
        lastTime: "09:12",
        unread: 1,
        status: 'waiting',
        automationTag: 'Recuperação',
        messages: [
            { id: 1, text: "Fala Felipe! Faz tempo que não te vemos.", sender: 'me', time: "09:00", status: 'read' },
            { id: 2, text: "Verdade correria total. Ainda tem horário para hoje?", sender: 'client', time: "09:12", status: 'read' },
        ]
    },
    {
        id: 3,
        client: { name: "JOÃO SILVA", avatar: "JS", phone: "11 97777-7777", lastService: "Corte Degradê", lastDate: "Agendado hoje", ltv: 850.00, favoriteBarber: "Gustavo", tags: ['Agendado'], status: 'new' },
        lastMessage: "Vou chegar 5 min atrasado, pode ser?",
        lastTime: "10:55",
        unread: 2,
        status: 'waiting',
        messages: [
            { id: 1, text: "Tudo certo para seu corte hoje?", sender: 'me', time: "09:30", status: 'read' },
            { id: 2, text: "Opa, tudo certo!", sender: 'client', time: "09:45", status: 'read' },
            { id: 3, text: "Vou chegar 5 min atrasado, pode ser?", sender: 'client', time: "10:55", status: 'sent' },
        ]
    },
    {
        id: 4,
        client: { name: "Jorge", avatar: "JO", phone: "11 96666-6666", lastService: "Barba & Toalha", lastDate: "Agendado hoje", ltv: 320.00, favoriteBarber: "Lucas", tags: [], status: 'new' },
        lastMessage: "Até logo!",
        lastTime: "08:30",
        unread: 0,
        status: 'open',
        messages: [
            { id: 1, text: "Bom dia Jorge! Te esperamos para a barba às 09h.", sender: 'me', time: "08:15", status: 'read' },
            { id: 2, text: "Bom dia! Até logo!", sender: 'client', time: "08:30", status: 'read' },
        ]
    }
];

export default function Messages() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
    const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'waiting' | 'closed'>('all');
    const [selectedChatId, setSelectedChatId] = useState<number | null>(1);
    const [inputText, setInputText] = useState("");
    const [showTemplates, setShowTemplates] = useState(false);

    // REFS
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // --- DEEP LINKING LOGIC (UPSERT) ---
    useEffect(() => {
        const isNewChat = searchParams.get('newChat') === 'true';
        const targetName = searchParams.get('name');
        const targetService = searchParams.get('service');

        if (isNewChat && targetName) {
            // 1. Check if exists
            const existingChat = conversations.find(c =>
                c.client.name.toLowerCase() === targetName.toLowerCase()
            );

            if (existingChat) {
                // FOUND: Select it
                setSelectedChatId(existingChat.id);
            } else {
                // NOT FOUND: Create it
                const newId = Math.max(...conversations.map(c => c.id)) + 1;
                const newConversation: Conversation = {
                    id: newId,
                    client: {
                        name: targetName,
                        avatar: targetName.substring(0, 2).toUpperCase(),
                        phone: "Novo Contato",
                        lastService: targetService || "Novo Agendamento",
                        lastDate: "Hoje",
                        ltv: 0,
                        favoriteBarber: "-",
                        tags: ['Novo'],
                        status: 'new'
                    },
                    lastMessage: "Iniciando conversa...",
                    lastTime: "Agora",
                    unread: 0,
                    status: 'open',
                    messages: []
                };

                setConversations(prev => [newConversation, ...prev]);
                setSelectedChatId(newId);
            }

            // Clean URL and Focus
            setSearchParams({});
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [searchParams, conversations]); // Added conversations to dep array to ensure we don't duplicate if ref changed

    const activeConversation = conversations.find(c => c.id === selectedChatId);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(() => { scrollToBottom(); }, [selectedChatId, activeConversation?.messages]);

    const getStatusColor = (status: 'vip' | 'new' | 'risk') => {
        switch (status) {
            case 'vip': return 'bg-[#d4af37] text-black border-[#d4af37]';
            case 'risk': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'new': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default: return 'bg-zinc-800 text-zinc-500';
        }
    };

    return (
        <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] flex rounded-[40px] overflow-hidden border border-zinc-900 bg-zinc-950/50 backdrop-blur-xl">
            {/* 1. LEFT SIDEBAR: CONVERSATION LIST */}
            <div className="w-80 md:w-96 border-r border-zinc-900 flex flex-col bg-zinc-950/20">
                <div className="p-6 border-b border-zinc-900/50">
                    <h1 className="text-2xl font-serif font-black text-white uppercase tracking-tighter mb-6">Concierge</h1>
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                        <input
                            placeholder="Buscar cliente..."
                            className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:border-[#d4af37]/50 outline-none transition-all placeholder:text-zinc-700"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                        {['all', 'unread', 'waiting'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-xl text-[9px] uppercase font-black tracking-widest whitespace-nowrap transition-all border ${activeTab === tab ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-[0_5px_15px_-5px_#d4af37]' : 'bg-transparent text-zinc-600 border-zinc-800 hover:text-zinc-400'}`}
                            >
                                {tab === 'all' ? 'Todos' : tab === 'unread' ? 'Não Lidas' : 'Aguardando'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-900">
                    {conversations.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChatId(chat.id)}
                            className={`p-6 border-b border-zinc-900/30 cursor-pointer transition-all hover:bg-[#d4af37]/5 relative group ${selectedChatId === chat.id ? 'bg-[#d4af37]/10' : ''}`}
                        >
                            {selectedChatId === chat.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#d4af37] shadow-[2px_0_10px_#d4af37]" />}
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#d4af37] font-black text-xs">
                                            {chat.client.avatar}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg border-2 border-black flex items-center justify-center text-[8px] font-black uppercase ${getStatusColor(chat.client.status)}`}>
                                            {chat.client.status[0]}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className={`text-sm font-black uppercase tracking-tight ${selectedChatId === chat.id ? 'text-[#d4af37]' : 'text-zinc-300'}`}>{chat.client.name}</h3>
                                        {chat.automationTag && (
                                            <span className="inline-flex items-center gap-1 text-[8px] font-bold text-[#d4af37]/80 bg-[#d4af37]/5 px-2 py-0.5 rounded-full mt-1 border border-[#d4af37]/10 uppercase tracking-widest">
                                                <Zap size={8} /> {chat.automationTag}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[9px] text-zinc-700 font-black italic">{chat.lastTime}</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 font-bold line-clamp-1 mt-1">{chat.lastMessage}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. CHAT AREA */}
            <div className="flex-1 flex flex-col bg-black/20 relative">
                {activeConversation ? (
                    <>
                        {/* Header */}
                        <div className="h-20 border-b border-zinc-900/50 flex items-center justify-between px-8 bg-zinc-950/40 backdrop-blur-xl absolute top-0 left-0 right-0 z-10 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-[14px] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#d4af37] font-black text-xs">
                                    {activeConversation.client.avatar}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-serif font-black text-white text-base uppercase tracking-tight truncate">{activeConversation.client.name}</h2>
                                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] flex items-center gap-2 mt-0.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> Online Atendimento
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-[#d4af37] text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                                    <Calendar size={14} /> Reservar Slot
                                </button>
                                <MoreVertical size={18} className="text-zinc-700 hover:text-white cursor-pointer transition-colors" />
                            </div>
                        </div>

                        {/* Messages Body */}
                        <div className="flex-1 overflow-y-auto p-8 pt-28 pb-32 space-y-6 scrollbar-thin scrollbar-thumb-zinc-900">
                            {activeConversation.messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} group relative`}>
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        className={`max-w-[80%] p-4 rounded-[28px] relative transition-all ${msg.sender === 'me' ? 'bg-[#d4af37] text-black rounded-tr-none shadow-xl border border-white/10' : 'bg-zinc-900/50 text-zinc-300 rounded-tl-none border border-zinc-800 backdrop-blur-sm'}`}
                                    >
                                        <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                                        <div className={`flex items-center gap-2 justify-end mt-2 text-[8px] font-black italic ${msg.sender === 'me' ? 'text-black/40' : 'text-zinc-600'}`}>
                                            {msg.time}
                                            {msg.sender === 'me' && <CheckCheck size={12} />}
                                        </div>
                                    </motion.div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="absolute bottom-10 left-10 right-10 p-4 bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800 rounded-[32px] shadow-2xl">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!inputText.trim() || !activeConversation) return;

                                    const newMessage: Message = {
                                        id: Date.now(), // Unique ID based on timestamp
                                        text: inputText,
                                        sender: 'me',
                                        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                        status: 'sent'
                                    };

                                    setConversations(prev => prev.map(c => {
                                        if (c.id === activeConversation.id) {
                                            return {
                                                ...c,
                                                messages: [...c.messages, newMessage],
                                                lastMessage: inputText,
                                                lastTime: "Agora",
                                                client: { ...c.client, status: c.client.status === 'new' ? 'vip' : c.client.status } // Promote to VIP/Active implicitly or keep status. Let's keep it simple or upgrade if it was 'new' to avoid 'phantom' feel if that was the logic. 
                                                // Actually, purely updating the state persists it in memory so it won't disappear on re-render. The reload was the killer.
                                            };
                                        }
                                        return c;
                                    }));

                                    setInputText("");
                                    setTimeout(scrollToBottom, 10);
                                }}
                                className="flex gap-4 items-center"
                            >
                                <button type="button" onClick={() => setShowTemplates(!showTemplates)} className="p-4 text-zinc-500 hover:text-[#d4af37] bg-black/40 rounded-2xl border border-zinc-800 transition-all"><MessageSquare size={20} /></button>
                                <input
                                    ref={inputRef}
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    placeholder={`Escrever para ${activeConversation.client.name}...`}
                                    className="flex-1 bg-transparent py-2 text-sm text-white outline-none font-bold placeholder:text-zinc-700"
                                />
                                <div className="flex gap-4 px-2">
                                    <ShoppingBag size={20} className="text-zinc-700 hover:text-[#d4af37] cursor-pointer" />
                                    <button type="submit" className="bg-transparent border-none p-0 cursor-pointer">
                                        <Send size={20} className="text-[#d4af37] hover:scale-110 cursor-pointer transition-transform" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-700">
                        <MessageSquare size={80} className="opacity-10 mb-6" />
                        <p className="font-serif font-black text-xl uppercase tracking-widest opacity-20">Selecione um Chat</p>
                    </div>
                )}
            </div>
        </div>
    );
}
