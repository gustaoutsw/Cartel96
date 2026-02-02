import { ChatInterface } from '../components/Inbox/ChatInterface';

export default function Inbox() {
    return (
        // Container Principal: Fundo preto, altura total da tela
        <div className="flex h-screen w-full bg-black overflow-hidden">

            <div className="flex-1 flex flex-col h-full w-full">

                {/* Cabeçalho da Página */}
                <div className="px-6 py-4 border-b border-[#222] bg-black shrink-0">
                    <h1 className="text-xl font-bold text-[#D4AF37] flex items-center gap-2">
                        Central de Atendimento
                        <span className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-full border border-[#D4AF37]/20">
                            CHATWOOT CONNECTED
                        </span>
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Gerencie as conversas do WhatsApp em tempo real.
                    </p>
                </div>

                {/* O Chat Real (Aqui entra o componente que criamos) */}
                <div className="flex-1 p-4 min-h-0 overflow-hidden">
                    <ChatInterface />
                </div>

            </div>
        </div>
    );
}