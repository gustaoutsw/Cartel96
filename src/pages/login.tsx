import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, ShieldCheck, ArrowRight, Lock, Mail, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setShowError(false);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('Login error:', error);
            setLoading(false);
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
        } else {
            navigate('/agenda');
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 relative overflow-hidden font-sans">

            {/* AMBIENCE BACKGROUND */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d4af37]/5 rounded-full blur-[120px]" />
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#d4af37]/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[450px] relative z-10"
            >
                {/* BRANDING */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                        className="w-24 h-24 bg-zinc-950 border border-[#d4af37]/20 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] relative group"
                    >
                        <div className="absolute inset-0 bg-[#d4af37]/10 rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Scissors size={40} className="text-[#d4af37] relative z-10 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                    </motion.div>
                    <h1 className="text-5xl font-serif font-black text-white tracking-tighter drop-shadow-2xl mb-2 lowercase italic">
                        cartel <span className="text-[#d4af37]">96</span>
                    </h1>
                    <div className="flex items-center justify-center gap-3">
                        <span className="w-8 h-px bg-zinc-800" />
                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.6em]">Terminal de Acesso</p>
                        <span className="w-8 h-px bg-zinc-800" />
                    </div>
                </div>

                {/* LOGIN FORM */}
                <div className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800/80 p-10 rounded-[48px] shadow-2xl relative">

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2 flex items-center gap-2">
                                <Mail size={12} /> Identidade
                            </label>
                            <input
                                type="email" placeholder="nome@cartel96.com" required
                                className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-[#d4af37]/40 focus:ring-4 ring-[#d4af37]/10 transition-all placeholder:text-zinc-700 shadow-inner"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2 flex items-center gap-2">
                                <Lock size={12} /> Protocolo
                            </label>
                            <input
                                type="password" placeholder="••••••••" required
                                className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-[#d4af37]/40 focus:ring-4 ring-[#d4af37]/10 transition-all placeholder:text-zinc-700 shadow-inner"
                                value={password} onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <AnimatePresence>
                            {showError && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="text-[10px] text-red-500 font-bold uppercase tracking-widest text-center"
                                >
                                    Credenciais Inválidas. Acesso Negado.
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit" disabled={loading}
                            className="group w-full bg-white hover:bg-[#d4af37] text-black font-black py-5 rounded-2xl shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] hover:shadow-[0_20px_40px_-10px_rgba(212,175,55,0.3)] hover:-translate-y-1 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader size={20} className="animate-spin" />
                            ) : (
                                <>Autenticar <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-600">
                            <ShieldCheck size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest">AES-256 Encrypted</span>
                        </div>
                        <a href="#" className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest hover:text-white transition-colors">Esqueceu?</a>
                    </div>
                </div>

                <p className="text-center mt-10 text-[10px] text-zinc-700 font-black uppercase tracking-[0.4em] opacity-40">
                    Propriedade Privada • Cartel 96 Business
                </p>
            </motion.div>
        </div>
    );
}