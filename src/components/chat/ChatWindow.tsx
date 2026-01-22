import { Send, MoreVertical, CheckCheck, Image as ImageIcon, X, Mic, Square, MapPin } from 'lucide-react';
import type { Ticket, Message } from '../../types/chat';
import { useRef, useState } from 'react';

interface ChatWindowProps {
    ticket: Ticket;
    messages: Message[];
    onSendMessage: (text: string, file?: File | null, type?: 'text' | 'image' | 'audio' | 'location', mediaUrl?: string) => void;
    onCloseTicket?: () => void;
}

export default function ChatWindow({ ticket, messages, onSendMessage, onCloseTicket }: ChatWindowProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Audio Recording State
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
                // Send immediately
                onSendMessage('', audioFile, 'audio');

                // Stop tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Não foi possível acessar o microfone.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSendLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocalização não suportada pelo seu navegador.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
                onSendMessage('Localização atual', null, 'location', link);
            },
            (error) => {
                console.error('Error sending location:', error);
                alert('Erro ao obter localização. Verifique as permissões.');
            }
        );
    };

    return (
        <div className="flex flex-col h-full bg-[#0b0b0b] relative">
            {/* HEADER */}
            <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold border border-zinc-600">
                        {ticket.customer_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-white font-bold">{ticket.customer_name}</h3>
                        <p className="text-xs text-zinc-400">{ticket.customer_phone}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onCloseTicket}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-[#d4af37]/10 hover:text-[#d4af37] transition-colors border border-zinc-700"
                    >
                        Finalizar
                    </button>
                    <button className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </header>

            {/* MESSAGES BODY */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/50">
                {(() => {
                    const groupedMessages: { type: 'group' | 'single', messages: Message[] }[] = [];

                    messages.forEach((msg, index) => {
                        const prevMsg = messages[index - 1];
                        const isImage = msg.type === 'image' && !!msg.media_url;
                        const isPrevImage = prevMsg?.type === 'image' && !!prevMsg.media_url;
                        const isSameSender = prevMsg?.sender_type === msg.sender_type;

                        // Check time difference (e.g., within 2 minutes)
                        const isNearTime = prevMsg
                            ? (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) < 2 * 60 * 1000
                            : false;

                        if (isImage && isPrevImage && isSameSender && isNearTime) {
                            const lastGroup = groupedMessages[groupedMessages.length - 1];
                            if (lastGroup && lastGroup.type === 'group') {
                                lastGroup.messages.push(msg);
                            } else {
                                // Should technically not happen if logic holds, but safe fallback
                                groupedMessages.push({ type: 'group', messages: [msg] });
                            }
                        } else if (isImage) {
                            // Check if NEXT message is also an image from same sender to start a group
                            const nextMsg = messages[index + 1];
                            const isNextImage = nextMsg?.type === 'image' && !!nextMsg.media_url;
                            const isNextSameSender = nextMsg?.sender_type === msg.sender_type;
                            const isNextNearTime = nextMsg
                                ? (new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime()) < 2 * 60 * 1000
                                : false;

                            if (isNextImage && isNextSameSender && isNextNearTime) {
                                groupedMessages.push({ type: 'group', messages: [msg] });
                            } else {
                                groupedMessages.push({ type: 'single', messages: [msg] });
                            }
                        } else {
                            groupedMessages.push({ type: 'single', messages: [msg] });
                        }
                    });

                    return groupedMessages.map((group, groupIndex) => {
                        if (group.type === 'group') {
                            const firstMsg = group.messages[0];
                            const isAgent = firstMsg.sender_type === 'agent';

                            return (
                                <div key={`group-${firstMsg.id}`} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-1 rounded-xl relative shadow-lg ${isAgent ? 'bg-[#d4af37] rounded-tr-none' : 'bg-zinc-900 border border-zinc-800 rounded-tl-none'
                                        }`}>
                                        <div className={`grid gap-1 ${group.messages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                            {group.messages.map((imgMsg) => (
                                                <div key={imgMsg.id} className="relative overflow-hidden rounded-lg">
                                                    <img
                                                        src={imgMsg.media_url!}
                                                        alt="Enviada"
                                                        className="w-32 h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => window.open(imgMsg.media_url, '_blank')}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className={`flex items-center justify-end gap-1 mt-1 mr-1 text-[10px] ${isAgent ? 'text-black/60' : 'text-zinc-500'}`}>
                                            <span>{new Date(firstMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {isAgent && <CheckCheck size={12} />}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // SINGLE MESSAGE RENDER (Existing Logic)
                        const msg = group.messages[0];
                        const isAgent = msg.sender_type === 'agent';
                        const isSystem = msg.sender_type === 'system';
                        const isImage = msg.type === 'image';
                        const isAudio = msg.type === 'audio';

                        if (isSystem) {
                            return (
                                <div key={msg.id} className="flex justify-center my-4">
                                    <span className="bg-zinc-900/80 text-zinc-500 text-xs px-3 py-1 rounded-full border border-zinc-800">
                                        {msg.content}
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[85%] sm:max-w-[70%] rounded-xl px-4 py-2 relative shadow-lg
                            ${isAgent
                                            ? 'bg-[#d4af37] text-black rounded-tr-none'
                                            : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none'}
                            `}
                                >
                                    {isImage && msg.media_url ? (
                                        <div className="mb-2 rounded-lg overflow-hidden border border-black/10">
                                            <img
                                                src={msg.media_url}
                                                alt="Enviada"
                                                className="w-auto max-h-60 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => window.open(msg.media_url, '_blank')}
                                            />
                                        </div>
                                    ) : null}

                                    {isAudio && msg.media_url ? (
                                        <div className="mb-1 mt-1 flex items-center justify-center w-64 bg-zinc-100/10 rounded-lg p-1">
                                            <audio
                                                controls
                                                src={msg.media_url}
                                                className="w-full h-8 [&::-webkit-media-controls-enclosure]:bg-transparent"
                                            />
                                        </div>
                                    ) : null}

                                    {msg.type === 'location' && msg.media_url ? (
                                        <div
                                            className="mb-1 mt-1 w-64 flex items-center gap-3 bg-zinc-950/40 p-3 rounded-xl border border-[#d4af37]/30 cursor-pointer hover:bg-zinc-950/60 transition-colors"
                                            onClick={() => window.open(msg.media_url, '_blank')}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] shrink-0">
                                                <MapPin size={24} />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-bold ${isAgent ? 'text-black' : 'text-white'}`}>Localização</p>
                                                <p className="text-[10px] opacity-70">Ver no Mapa</p>
                                            </div>
                                        </div>
                                    ) : null}

                                    {msg.content && msg.content !== 'Imagem enviada' && msg.content !== 'Áudio enviado' && msg.content !== 'Localização atual' && (
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    )}

                                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isAgent ? 'text-black/60' : 'text-zinc-500'}`}>
                                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {isAgent && <CheckCheck size={12} />}
                                    </div>
                                </div>
                            </div>
                        )
                    });
                })()}
            </div>

            {/* PREVIEW SELECTED FILE */}
            {selectedFile && (
                <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                            <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-200 font-bold max-w-[200px] truncate">{selectedFile.name}</p>
                            <p className="text-[10px] text-zinc-500">Pronto para enviar</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedFile(null)} className="p-2 text-zinc-500 hover:text-red-400">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* FOOTER / INPUT */}
            <footer className="p-3 bg-zinc-900 border-t border-zinc-800">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const input = form.elements.namedItem('message_input') as HTMLInputElement;

                        if (input.value.trim() || selectedFile) {
                            onSendMessage(input.value, selectedFile, selectedFile ? 'image' : 'text');
                            input.value = '';
                            setSelectedFile(null);
                        }
                    }}
                    className="flex items-center gap-2"
                >
                    {/* MapPin Button */}
                    <button
                        type="button"
                        onClick={handleSendLocation}
                        className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white transition-colors hover:bg-zinc-700"
                        title="Enviar Localização"
                        disabled={isRecording}
                    >
                        <MapPin size={20} />
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />

                    {/* Image Upload Button */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white transition-colors hover:bg-zinc-700"
                        title="Enviar Imagem"
                        disabled={isRecording}
                    >
                        <ImageIcon size={20} />
                    </button>

                    {/* Mic Button */}
                    <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isRecording
                            ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500/50'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                            }`}
                        title={isRecording ? "Parar Gravação" : "Gravar Áudio"}
                    >
                        {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
                    </button>

                    <input
                        name="message_input"
                        type="text"
                        placeholder={isRecording ? "Gravando áudio..." : "Digite uma mensagem..."}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg h-10 px-4 text-zinc-200 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all placeholder:text-zinc-600 disabled:opacity-50"
                        autoComplete="off"
                        disabled={isRecording}
                    />
                    <button
                        type="submit"
                        className="w-10 h-10 rounded-lg bg-[#d4af37] text-black flex items-center justify-center hover:bg-[#bf9b30] transition-colors shadow-lg shadow-yellow-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isRecording}
                    >
                        <Send size={18} />
                    </button>
                </form>
            </footer>
        </div>
    );
}
