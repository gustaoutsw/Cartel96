import { ChatInterface } from '../components/Inbox/ChatInterface';

export default function Messages() {
    return (
        <div className="flex h-screen bg-black overflow-hidden">
            {/* Área Principal - Ocupa toda a tela restante */}
            <div className="flex-1 flex flex-col h-full">

                {/* Cabeçalho Simples */}
                <div className="px-6 py-4 border-b border-[#222] bg-black">
                    <h1 className="text-xl font-bold text-[#D4AF37]">Central de Atendimento</h1>
                    <p className="text-xs text-gray-500">Conectado ao Chatwoot</p>
                </div>

                {/* O Componente do Chat Real */}
                <div className="flex-1 p-4 min-h-0">
                    <ChatInterface />
                </div>

            </div>
        </div>
    );
}