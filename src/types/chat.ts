export type TicketStatus = 'open' | 'closed' | 'pending';
export type SenderType = 'customer' | 'agent' | 'system';

export interface Ticket {
    id: string; // UUID
    customer_name: string;
    customer_phone: string;
    status: TicketStatus;
    professional_id?: string; // UUID, nullable
    last_message_at: string; // ISO string
    created_at: string;
    updated_at: string;
    unread_count?: number; // Optional UI helper
}

export interface Message {
    id: string; // UUID
    ticket_id: string; // UUID
    content: string;
    sender_type: SenderType;
    created_at: string;
    read_at?: string; // Nullable
    media_url?: string;
    type?: 'text' | 'image' | 'audio' | 'location';
}
