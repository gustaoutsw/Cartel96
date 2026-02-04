import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { supabase } from '../../lib/supabase';
import { Send, Mic, CheckCheck, Loader2, X, Paperclip, Image as ImageIcon } from 'lucide-react';

// --- CONFIGURAÇÕES ---
const API_URL = import.meta.env.VITE_CHATWOOT_BASE_URL;
const ACCOUNT_ID = import.meta.env.VITE_CHATWOOT_ACCOUNT_ID;
const TOKEN = import.meta.env.VITE_CHATWOOT_TOKEN;

const THEME = {
    bg: 'bg-zinc-950',
    sidebar: 'bg-zinc-900/50',
    activeItem: 'bg-amber-500/10 border-l-2 border-amber-500',
    goldText: 'text-amber-500',
    incomingBubble: 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-white/5',
    outgoingBubble: 'bg-amber-500 text-black font-medium rounded-tr-none shadow-lg shadow-amber-500/10',
};

export function ChatInterface() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<number | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        const channel = supabase
            .channel('chat_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages_chatwoot' }, (payload) => {
                if (payload.new.conversation_id === selectedChat) {
                    setMessages(prev => [...prev, payload.new]);
                }
                fetchConversations();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedChat]);

    async function fetchConversations() {
        try {
            const response = await axios.get(
                `${API_URL}/accounts/${ACCOUNT_ID}/conversations?status=open&sort_by=last_activity_at`,
                { headers: { 'api_access_token': TOKEN } }
            );
            const payload = response.data?.data?.payload;
            setConversations(Array.isArray(payload) ? payload : []);
        } catch (err) {
            console.error("Erro conversas:", err);
        }
    }

    async function loadMessages(id: number) {
        setSelectedChat(id);
        try {
            const response = await axios.get(
                `${API_URL}/accounts/${ACCOUNT_ID}/conversations/${id}/messages`,
                { headers: { 'api_access_token': TOKEN } }
            );
            const payload = response.data?.payload;
            setMessages(Array.isArray(payload) ? payload : []);
        } catch (err) {
            console.error("Erro mensagens:", err);
        }
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat || sending) return;

        setSending(true);
        try {
            await axios.post(
                `${API_URL}/accounts/${ACCOUNT_ID}/conversations/${selectedChat}/messages`,
                { content: newMessage, message_type: "outgoing" },
                { headers: { 'api_access_token': TOKEN } }
            );
            setNewMessage('');
            loadMessages(selectedChat);
        } catch (err) {
            console.error("Erro envio:", err);
        } finally {
            setSending(false);
        }
    }

    const formatTime = (timestamp: any) => {
        const date = timestamp ? new Date(Number(timestamp) * 1000) : new Date();
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    // Renderizador de Anexos (Imagens, Áudios, etc)
    const renderAttachment = (att: any) => {
        if (!att || !att.data_url) return null;
        if (att.file_type === 'image') {
            return <img src={att.data_url} alt="Anexo" className="max-w-[240px] w-full rounded-lg mt-2 border border-white/10" onClick={() => window.open(att.data_url, '_blank')} />;
        }
        if (att.file_type === 'audio') {
            return (
                <div className="mt-2 bg-black/20 p-2 rounded-lg min-w-[200px]">
                    <audio controls className="w-full h-8"><source src={att.data_url} type="audio/mpeg" /></audio>
                </div>
            );
        }
        return <a href={att.data_url} target="_blank" className="block p-2 bg-white/5 rounded mt-2 underline text-[10px]">Ver Arquivo</a>;
    };

    return (
        <div className={`flex h-full w-full ${THEME.bg} text-zinc-100 rounded-2xl border border-white/5 overflow-hidden shadow-2xl`}>
            {/* SIDEBAR */}
            <div className={`w-80 border-r border-white/5 ${THEME.sidebar} flex flex-col`}>
                <div className="p-4 border-b border-white/5 bg-zinc-900/80">
                    <h2 className={`font-black text-[10px] tracking-[0.2em] uppercase ${THEME.goldText}`}>Contatos Ativos</h2>
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {conversations.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => loadMessages(chat.id)}
                            className={`p-4 border-b border-white/5 cursor-pointer transition-all ${selectedChat === chat.id ? THEME.activeItem : 'hover:bg-white/5'}`}
                        >
                            <span className="font-bold text-sm block truncate text-zinc-200">{chat.meta?.sender?.name || 'Cliente'}</span>
                            <p className="text-xs text-zinc-500 truncate mt-1">
                                {chat.last_non_activity_message?.content || '📷 Mídia'}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 flex flex-col bg-zinc-950/50">
                {selectedChat ? (
                    <>
                        <div className="h-14 border-b border-white/5 flex items-center px-6 bg-zinc-900/20 backdrop-blur-md">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-3 animate-pulse"></div>
                            <span className="text-sm font-bold text-zinc-300">Atendimento #{selectedChat}</span>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar" ref={scrollRef}>
                            {messages.map((msg, i) => {
                                // LÓGICA DE ALINHAMENTO CORRIGIDA
                                const isOutgoing = msg.message_type === 'outgoing' || msg.message_type === 1;

                                return (
                                    <div key={i} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${isOutgoing ? THEME.outgoingBubble : THEME.incomingBubble}`}>
                                            {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}

                                            {/* RENDERIZAÇÃO DE ANEXOS */}
                                            {msg.attachments?.map((att: any, idx: number) => (
                                                <div key={idx}>{renderAttachment(att)}</div>
                                            ))}

                                            <div className={`text-[9px] text-right mt-1 opacity-50 flex items-center justify-end gap-1 ${isOutgoing ? 'text-black/60' : 'text-zinc-500'}`}>
                                                {formatTime(msg.created_at)}
                                                {isOutgoing && <CheckCheck size={12} />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-zinc-900/30">
                            <div className="flex items-center gap-2 bg-black/40 rounded-xl p-2 px-4 border border-white/10 focus-within:border-amber-500/50 transition-all">
                                <input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Escreva sua resposta..."
                                    className="flex-1 bg-transparent text-sm outline-none py-2 text-white"
                                />
                                <button type="submit" disabled={!newMessage.trim() || sending} className="text-amber-500 disabled:opacity-30">
                                    {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-800 uppercase text-[10px] font-black tracking-[0.4em] opacity-30">
                        Selecione um cliente para conversar
                    </div>
                )}
            </div>
        </div>
    );
}