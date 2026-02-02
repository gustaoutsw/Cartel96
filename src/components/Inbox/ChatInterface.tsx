import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// --- CONFIGURAÇÕES ---
const API_URL = import.meta.env.VITE_CHATWOOT_BASE_URL;
const ACCOUNT_ID = import.meta.env.VITE_CHATWOOT_ACCOUNT_ID;
const TOKEN = import.meta.env.VITE_CHATWOOT_TOKEN;

// Cores do Tema Cartel96
const THEME = {
    bg: 'bg-zinc-950',
    sidebar: 'bg-zinc-900/50',
    activeItem: 'bg-white/5 border-l-2 border-amber-500',
    goldText: 'text-amber-500',
    incomingBubble: 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-white/5',
    outgoingBubble: 'bg-amber-500 text-black font-medium rounded-tr-none shadow-lg shadow-amber-500/10',
};

export function ChatInterface() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<number | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll para baixo quando chega mensagem nova
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // --- 1. Carregar Conversas ---
    useEffect(() => {
        if (!API_URL || !ACCOUNT_ID || !TOKEN) {
            setError("Faltam chaves no arquivo .env.local");
            return;
        }

        async function fetchConversations() {
            try {
                const response = await axios.get(
                    `${API_URL}/accounts/${ACCOUNT_ID}/conversations?status=open&sort_by=last_activity_at`,
                    { headers: { 'api_access_token': TOKEN } }
                );
                const payload = response.data?.data?.payload;
                setConversations(Array.isArray(payload) ? payload : []);
            } catch (err: any) {
                console.error("Erro ao buscar conversas:", err);
            }
        }
        fetchConversations();

        // Polling simples para atualizar a lista a cada 30s (opcional)
        const interval = setInterval(fetchConversations, 30000);
        return () => clearInterval(interval);
    }, []);

    // --- 2. Carregar Mensagens ---
    async function loadMessages(id: number) {
        if (!API_URL) return;
        try {
            // Não limpa messages imediatamente para evitar "piscar", só troca o ID
            setSelectedChat(id);

            const response = await axios.get(
                `${API_URL}/accounts/${ACCOUNT_ID}/conversations/${id}/messages`,
                { headers: { 'api_access_token': TOKEN } }
            );
            const payload = response.data?.payload;
            setMessages(Array.isArray(payload) ? payload : []);
        } catch (err) {
            console.error("Erro ao abrir conversa:", err);
        }
    }

    // --- AUXILIARES VISUAIS ---
    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        try {
            const date = new Date(Number(timestamp) * 1000);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    };

    const getInitials = (name: string) => {
        return name ? name.substring(0, 2).toUpperCase() : 'CL';
    };

    const renderAttachment = (att: any) => {
        if (!att || !att.data_url) return null;
        try {
            if (att.file_type === 'image') {
                return (
                    <div className="group relative mt-2">
                        <img
                            src={att.data_url}
                            alt="Anexo"
                            className="max-w-[240px] w-full rounded-lg border border-white/10 cursor-zoom-in transition-transform hover:scale-[1.02]"
                            onClick={() => window.open(att.data_url, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg pointer-events-none">
                            <span className="text-white text-xs font-bold">Ver Imagem</span>
                        </div>
                    </div>
                );
            }
            if (att.file_type === 'audio') {
                return (
                    <div className="mt-2 bg-black/20 p-2 rounded-lg min-w-[220px] backdrop-blur-sm border border-white/5">
                        <audio controls className="w-full h-8 opacity-90 hover:opacity-100 transition-opacity">
                            <source src={att.data_url} type="audio/mpeg" />
                        </audio>
                    </div>
                );
            }
            return (
                <a href={att.data_url} target="_blank" className="flex items-center gap-2 mt-2 p-3 bg-white/5 rounded-lg text-xs hover:bg-white/10 transition-colors border border-white/5">
                    <span className="text-amber-500 text-lg">📎</span>
                    <span className="underline decoration-white/30 underline-offset-4">Baixar Arquivo</span>
                </a>
            );
        } catch { return null; }
    };

    if (error) return <div className="p-10 text-red-500 text-center font-mono border border-red-900/50 m-4 rounded bg-red-950/20">{error}</div>;

    return (
        <div className={`flex h-full w-full ${THEME.bg} text-zinc-100 rounded-2xl border border-white/5 overflow-hidden shadow-2xl font-sans`}>

            {/* SIDEBAR */}
            <div className={`w-1/3 border-r border-white/5 ${THEME.sidebar} flex flex-col backdrop-blur-xl`}>
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/80">
                    <h2 className={`font-bold ${THEME.goldText} text-xs tracking-[0.2em] uppercase`}>Atendimentos</h2>
                    <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full border border-amber-500/20">
                        {conversations.length}
                    </span>
                </div>

                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {conversations.map((chat) => (
                        <div
                            key={chat?.id || Math.random()}
                            onClick={() => chat?.id && loadMessages(chat.id)}
                            className={`p-4 border-b border-white/5 cursor-pointer transition-all duration-300 hover:bg-white/5 group ${selectedChat === chat?.id ? THEME.activeItem : ''
                                }`}
                        >
                            <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-3">
                                    {/* Avatar Simples */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shadow-inner ${selectedChat === chat?.id ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'
                                        }`}>
                                        {getInitials(chat?.meta?.sender?.name)}
                                    </div>
                                    <span className={`font-semibold text-sm ${selectedChat === chat?.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                                        {chat?.meta?.sender?.name || 'Cliente'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-zinc-600 font-mono tracking-tighter group-hover:text-zinc-500">
                                    {formatTime(chat?.last_non_activity_message?.created_at)}
                                </span>
                            </div>
                            <div className="text-xs text-zinc-500 truncate h-5 pl-11 group-hover:text-zinc-400 transition-colors">
                                {chat?.last_non_activity_message?.attachments?.length ?
                                    <span className="flex items-center gap-1 text-amber-500/80">📷 Mídia</span> :
                                    (chat?.last_non_activity_message?.content || 'Nova conversa iniciada')
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ÁREA DE CHAT */}
            <div className="w-2/3 flex flex-col relative bg-gradient-to-br from-zinc-950 to-zinc-900">
                {selectedChat ? (
                    <>
                        {/* Header do Chat */}
                        <div className="h-16 border-b border-white/5 flex items-center px-6 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-3 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                            <span className="text-sm font-medium text-zinc-200">
                                Conversa <span className="text-amber-500">#{selectedChat}</span>
                            </span>
                        </div>

                        {/* Mensagens */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar scroll-smooth" ref={scrollRef}>
                            {messages.map((msg) => (
                                <div key={msg?.id || Math.random()} className={`flex ${msg?.message_type === 'incoming' ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl ${msg?.message_type === 'incoming' ? THEME.incomingBubble : THEME.outgoingBubble
                                        }`}>

                                        {/* Nome de quem fala (opcional, só pra incoming) */}
                                        {msg?.message_type === 'incoming' && (
                                            <p className="text-[10px] text-amber-500/70 mb-1 font-bold tracking-wide uppercase">Cliente</p>
                                        )}

                                        {msg?.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}

                                        {msg?.attachments?.map((att: any) => (
                                            <div key={att?.id || Math.random()}>{renderAttachment(att)}</div>
                                        ))}

                                        <div className={`text-[9px] text-right mt-2 font-mono ${msg?.message_type === 'incoming' ? 'text-white/30' : 'text-black/40'
                                            }`}>
                                            {formatTime(msg?.created_at)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="h-2" /> {/* Espaço extra no final */}
                        </div>

                        {/* Input Fake (Apenas Visual por enquanto, já que você responde pelo n8n/chatwoot) */}
                        <div className="p-4 border-t border-white/5 bg-zinc-900/30">
                            <div className="text-xs text-center text-zinc-600 font-mono">
                                Use o Chatwoot ou WhatsApp para responder
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 space-y-4">
                        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center shadow-2xl">
                            <span className="text-4xl grayscale opacity-30">💈</span>
                        </div>
                        <p className="text-sm font-light tracking-widest uppercase text-zinc-600">Selecione um cliente</p>
                    </div>
                )}
            </div>

            {/* CSS Injetado para Scrollbar personalizada */}
            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #09090b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4af37; }
      `}</style>
        </div>
    );
}