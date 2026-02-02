export interface Contact {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    thumbnail: string;
}

export interface Attachment {
    id: number;
    message_id: number;
    file_type: 'image' | 'audio' | 'video' | 'file';
    account_id: number;
    extension: string;
    data_url: string;
    thumb_url: string;
    file_size: number;
}

export interface Conversation {
    id: number;
    inbox_id: number;
    status: 'open' | 'resolved' | 'pending';
    unread_count: number;
    last_non_activity_message: {
        content: string;
        created_at: number;
        attachments?: Attachment[];
    };
    timestamp: number;
    meta: {
        sender: Contact;
    };
}

export interface Message {
    id: number;
    content: string;
    message_type: 'incoming' | 'outgoing' | 'activity';
    created_at: number;
    sender?: {
        name: string;
        thumbnail: string;
    };
    private: boolean;
    attachments?: Attachment[];
}