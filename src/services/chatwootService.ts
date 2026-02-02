import axios from 'axios';
import { Conversation, Message } from '../types/chatwoot';

const API_URL = import.meta.env.VITE_CHATWOOT_BASE_URL;
const ACCOUNT_ID = import.meta.env.VITE_CHATWOOT_ACCOUNT_ID;
const TOKEN = import.meta.env.VITE_CHATWOOT_TOKEN;

const api = axios.create({
    baseURL: `${API_URL}/accounts/${ACCOUNT_ID}`,
    headers: {
        'api_access_token': TOKEN,
        'Content-Type': 'application/json',
    },
});

export const chatwootService = {
    // Buscar lista de conversas abertas
    getConversations: async (): Promise<Conversation[]> => {
        const response = await api.get('/conversations?status=open&sort_by=last_activity_at');
        // O Chatwoot retorna os dados dentro de data.data.payload
        return response.data.data.payload;
    },

    // Buscar mensagens de uma conversa específica
    getMessages: async (conversationId: number): Promise<Message[]> => {
        const response = await api.get(`/conversations/${conversationId}/messages`);
        return response.data.payload;
    },

    // Enviar mensagem (para usar depois)
    sendMessage: async (conversationId: number, content: string) => {
        return await api.post(`/conversations/${conversationId}/messages`, {
            content,
            message_type: 'outgoing',
            private: false
        });
    }
};