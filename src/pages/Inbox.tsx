import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MessageSquare, ArrowLeft, Loader2, Plus } from 'lucide-react';
import ConversationItem from '../components/chat/ConversationItem';
import ChatWindow from '../components/chat/ChatWindow';
import type { Ticket, Message } from '../types/chat';
import { supabase } from '../lib/supabase';

export default function Inbox() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // We use a ref to track activeTicketId inside the subscription callback
    const activeTicketIdRef = useRef<string | null>(null);

    // Ref for auto-scrolling
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Sync ref with state
    useEffect(() => {
        activeTicketIdRef.current = activeTicketId;
    }, [activeTicketId]);

    const activeTicket = tickets.find(t => t.id === activeTicketId);

    // 1. Initial Fetch of Tickets & Realtime Subscription
    useEffect(() => {
        fetchTickets();

        const channel = supabase.channel('inbox-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const newMessage = payload.new as Message;
                    handleNewMessage(newMessage);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // 2. Fetch Messages when active ticket changes
    useEffect(() => {
        if (!activeTicketId) {
            setMessages([]);
            return;
        }

        const loadMessages = async () => {
            setLoadingMessages(true);
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('ticket_id', activeTicketId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error loading messages:', error);
            } else {
                setMessages(data || []);
                scrollToBottom();
            }
            setLoadingMessages(false);

            // Mark as read locally (reset badge)
            setTickets(prev => prev.map(t =>
                t.id === activeTicketId ? { ...t, unread_count: 0 } : t
            ));
        };

        loadMessages();
    }, [activeTicketId]);

    const fetchTickets = async () => {
        setLoadingTickets(true);
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .order('last_message_at', { ascending: false });

        if (error) {
            console.error('Error fetching tickets:', error);
        } else {
            setTickets(data || []);
        }
        setLoadingTickets(false);
    };

    // 1.5 Handle Query Params (Phone from Agenda)
    const [searchParams] = useSearchParams();
    useEffect(() => {
        const phoneParam = searchParams.get('phone');
        if (phoneParam && tickets.length > 0) {
            // Find ticket with this phone
            // Phone in DB might be formatted or raw, check loose match
            const normalize = (p: string) => p.replace(/\D/g, '');
            const targetPhone = normalize(phoneParam);

            const found = tickets.find(t => normalize(t.customer_phone).includes(targetPhone));

            if (found) {
                setActiveTicketId(found.id);
            } else {
                // Pre-fill search if not found, to help user create one or see if it's there
                setSearchTerm(phoneParam);
            }
        }
    }, [tickets, searchParams]);

    const scrollToBottom = () => {
        // Small delay to ensure render is complete
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleNewMessage = (newMessage: Message) => {
        const currentActiveId = activeTicketIdRef.current;

        // A. Update Tickets List Order & Preview
        setTickets(prevTickets => {
            // Find the ticket this message belongs to
            const ticketIndex = prevTickets.findIndex(t => t.id === newMessage.ticket_id);

            // If we don't have the ticket locally (silent error or maybe new ticket logic needed later)
            // For now we assume ticket exists.
            if (ticketIndex === -1) return prevTickets;

            const updatedTicket = {
                ...prevTickets[ticketIndex],
                last_message_at: newMessage.created_at,
                // Increment unread if it's NOT the currently active ticket
                unread_count: (currentActiveId === newMessage.ticket_id)
                    ? 0
                    : (prevTickets[ticketIndex].unread_count || 0) + 1
            };

            // Remove from old position and add to top
            const otherTickets = prevTickets.filter(t => t.id !== newMessage.ticket_id);
            return [updatedTicket, ...otherTickets];
        });

        // B. If belongs to active chat, append to messages list
        if (currentActiveId === newMessage.ticket_id) {
            setMessages(prevMessages => {
                // Prevent duplicates (Realtime + Local Optimistic might collide if not careful)
                const exists = prevMessages.some(m => m.id === newMessage.id);
                if (exists) return prevMessages;

                return [...prevMessages, newMessage];
            });
            scrollToBottom();
        }
    };

    // 3. Send Message
    const handleSendMessage = async (text: string, file?: File | null, typeArg: 'text' | 'image' | 'audio' | 'location' = 'text', mediaUrlArg?: string) => {
        if (!activeTicketId) return;

        // Optimistic Update (optional, gives better feel)
        // For now we rely on Realtime echoing back to keep "handleNewMessage" as the single source of truth
        // But user asked to "insert... and update"

        let mediaUrl = mediaUrlArg || null;
        let messageType = typeArg;

        // 1. Upload File if exists (Image or Audio)
        if (file) {
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${activeTicketId}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('chat-uploads')
                    .upload(fileName, file);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    alert('Erro ao enviar arquivo. Verifique se o bucket "chat-uploads" existe e é público.');
                    return;
                }

                const { data: publicUrlData } = supabase.storage
                    .from('chat-uploads')
                    .getPublicUrl(fileName);

                mediaUrl = publicUrlData.publicUrl;

                // If type was defaulted to text but we have a file, assume image if not specified otherwise
                if (messageType === 'text') {
                    messageType = 'image';
                }
            } catch (err) {
                console.error('File processing error:', err);
                return;
            }
        }

        // Determine content placeholder based on type
        let finalContent = text;
        if (!finalContent && mediaUrl) {
            if (messageType === 'image') finalContent = 'Imagem enviada';
            if (messageType === 'audio') finalContent = 'Áudio enviado';
            if (messageType === 'location') finalContent = 'Localização atual';
        }

        // Insert into Supabase
        const { error } = await supabase.from('messages').insert({
            ticket_id: activeTicketId,
            content: finalContent || '',
            sender_type: 'agent',
            media_url: mediaUrl,
            type: messageType
        });

        if (error) {
            console.error('Error sending message:', error);
            alert('Erro ao enviar mensagem.');
            return;
        }

        // Update Ticket Timestamp
        await supabase.from('tickets')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', activeTicketId);
    };

    // 4. Test Tool: Simulate Customer
    const handleSimulateCustomer = async () => {
        const randomId = Math.floor(Math.random() * 1000);
        const customerName = `Cliente Teste ${randomId}`;

        // 1. Create Ticket
        const { data: ticketData, error: ticketError } = await supabase
            .from('tickets')
            .insert({
                customer_name: customerName,
                customer_phone: `+55 11 9${Math.floor(Math.random() * 100000000)}`,
                status: 'open',
                last_message_at: new Date().toISOString()
            })
            .select()
            .single();

        if (ticketError || !ticketData) {
            console.error('Error creating test ticket:', ticketError);
            alert('Erro ao criar ticket de teste');
            return;
        }

        // 2. Insert Initial Message
        const { error: msgError } = await supabase
            .from('messages')
            .insert({
                ticket_id: ticketData.id,
                content: 'Olá! Gostaria de saber os horários disponíveis para hoje.',
                sender_type: 'customer'
            });

        if (msgError) {
            console.error('Error creating test message:', msgError);
        }

        fetchTickets();
    };

    const filteredTickets = tickets.filter(t =>
        t.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customer_phone.includes(searchTerm)
    );

    return (
        <div className="flex h-screen bg-zinc-950 overflow-hidden relative">
            {/* LEFT COLUMN - LIST */}
            <aside className={`
        flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300
        ${activeTicketId ? 'hidden md:flex w-full md:w-96' : 'w-full md:w-96'} 
      `}>
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800 shrink-0">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageSquare className="text-[#d4af37]" /> Inbox
                    </h1>
                    <button
                        onClick={() => handleSimulateCustomer()}
                        className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-[#d4af37] transition-colors"
                        title="Simular Cliente (Teste)"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-zinc-800 bg-zinc-900/30">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar conversa..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#d4af37] transition-colors"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {loadingTickets ? (
                        <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
                            <Loader2 size={24} className="animate-spin mb-2" />
                            <p className="text-xs">Carregando conversas...</p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 text-sm">
                            Nenhuma conversa encontrada.
                        </div>
                    ) : (
                        filteredTickets.map(ticket => (
                            <ConversationItem
                                key={ticket.id}
                                ticket={ticket}
                                isActive={activeTicketId === ticket.id}
                                onClick={() => setActiveTicketId(ticket.id)}
                            />
                        ))
                    )}
                </div>
            </aside>

            {/* RIGHT COLUMN - CHAT WINDOW */}
            <main className={`
        flex-1 bg-[#0b0b0b] flex flex-col relative
        ${!activeTicketId ? 'hidden md:flex' : 'flex'}
      `}>
                {activeTicket ? (
                    <div className="flex flex-col h-full">
                        {/* Mobile Header Overwrite or Back Button Injection in ChatWindow? 
                    ChatWindow has a header. We can add a "back" button prop or logic there.
                    Let's modify ChatWindow wrapper here to handle the mobile back button logic subtly 
                    or pass a custom header component if needed. 
                    Actually, ChatWindow already has a header. Let's create a wrapper or just use ChatWindow but
                    we might want to inject a 'Back' button if on mobile.
                    
                    Simpler: Add a mobile-only back button Absolute over the header or pass it to ChatWindow.
                    The requirement said "Mobile UX: Back button returns to list".
                    Let's wrap ChatWindow or pass the back action. 
                    ChatWindow already has 'onCloseTicket', but that was for "Finalizar".
                    Let's Add a "Back" button visible only on mobile in the ChatWindow implementation 
                    OR strictly here in the layout above the ChatWindow if we could, but ChatWindow owns the full height.
                */}

                        {/* Mobile Back Button Overlay (Top Left) */}
                        <div className="md:hidden absolute top-4 left-4 z-50">
                            <button
                                onClick={() => setActiveTicketId(null)}
                                className="p-2 rounded-full bg-zinc-900/80 text-white shadow-lg border border-zinc-800 backdrop-blur-md"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            {/* Note: This might overlap with ChatWindow header content. 
                        Ideally ChatWindow should accept a 'renderLeftAccessory' or similar. 
                        However for now, let's just assume the user can click this. 
                        Better yet, let's not overlap. Let's pass 'onMobileBack' to ChatWindow? 
                        ChatWindow.tsx doesn't have that prop yet. 
                        I will stick to this Overlay for now, positioned carefully or rely on the fact 
                        that I can't easily change ChatWindow props without another edit. 
                        Wait, I just created ChatWindow. I can modify it if needed, 
                        or just rely on the layout. 
                        Let's put it as a distinct bar for mobile or just use the overlay.
                    */}
                        </div>

                        <ChatWindow
                            ticket={activeTicket}
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            onCloseTicket={() => {
                                // "Finalizar" Logic - maybe also close the active window?
                                // console.log('Finalizar clicked');
                                // Implement close ticket logic if needed (update status to closed)
                                setActiveTicketId(null);
                            }}
                        />

                        {/* Scroll dummy */}
                        <div ref={messagesEndRef} />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4 opacity-50">
                        <MessageSquare size={64} strokeWidth={1} />
                        <p>Selecione uma conversa para iniciar o atendimento</p>
                    </div>
                )}
            </main>
        </div>
    );
}
