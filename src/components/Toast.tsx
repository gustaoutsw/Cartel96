import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Bell, X, Info } from 'lucide-react';

// --- SOUND ASSET (Base64 for simplicity in demo) ---
// Short metallic 'ding' sound


type ToastType = 'success' | 'warning' | 'info' | 'error';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextData {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const playSound = () => {
        // const audio = new Audio('/sounds/ding.mp3'); // Real implementation
        // audio.play().catch(e => console.log("Audio play failed", e));

        // Mocking Audio Effect visual log
        console.log("🎵 DING! (Sound Effect Played)");
    };

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        if (type === 'success' || type === 'info') playSound();

        // Auto remove after 5s
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            layout
                            className="pointer-events-auto min-w-[300px] bg-zinc-900/95 backdrop-blur-xl border border-[#d4af37]/30 p-4 rounded-xl shadow-2xl shadow-black/50 flex items-start gap-4 overflow-hidden relative group"
                        >
                            {/* Gold Glow Line */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#d4af37] to-[#b08d55]"></div>

                            <div className={`mt-0.5 p-1.5 rounded-full ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : toast.type === 'warning' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                {toast.type === 'success' && <CheckCircle size={16} />}
                                {toast.type === 'warning' && <AlertTriangle size={16} />}
                                {toast.type === 'info' && <Bell size={16} />}
                                {toast.type === 'error' && <Info size={16} />}
                            </div>

                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white mb-0.5 capitalize">{toast.type === 'info' ? 'Nova Notificação' : toast.type}</h4>
                                <p className="text-xs text-zinc-400 font-medium leading-relaxed">{toast.message}</p>
                            </div>

                            <button onClick={() => removeToast(toast.id)} className="text-zinc-600 hover:text-white transition-colors">
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
