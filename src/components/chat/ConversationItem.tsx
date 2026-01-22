import type { Ticket } from '../../types/chat';

interface ConversationItemProps {
    ticket: Ticket;
    isActive: boolean;
    onClick: () => void;
}

export default function ConversationItem({ ticket, isActive, onClick }: ConversationItemProps) {
    // Helpers for display
    const initials = ticket.customer_name ? ticket.customer_name.substring(0, 2).toUpperCase() : '??';

    // Status config
    const statusColors = {
        open: 'bg-green-500',
        closed: 'bg-zinc-600',
        pending: 'bg-yellow-500'
    };



    return (
        <div
            onClick={onClick}
            className={`w-full p-3 flex items-center gap-3 border-b border-zinc-800 cursor-pointer transition-colors
        ${isActive ? 'bg-zinc-800/80 border-l-4 border-l-[#d4af37]' : 'hover:bg-zinc-900 border-l-4 border-l-transparent'}
      `}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold border border-zinc-600">
                    {initials}
                </div>
                {/* Status indicator dot on avatar */}
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-950 ${statusColors[ticket.status]}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <span className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-zinc-200'}`}>
                        {ticket.customer_name}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                        {new Date(ticket.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-400 truncate pr-2">
                        Click para ver a conversa...
                    </p>
                    {/* Unread Badge (Placeholder) */}
                    {ticket.unread_count && ticket.unread_count > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#d4af37] text-black text-[10px] font-black flex items-center justify-center shrink-0">
                            {ticket.unread_count}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
