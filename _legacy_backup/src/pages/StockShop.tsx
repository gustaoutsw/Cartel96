import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ShoppingCart, Plus, Minus, Truck, AlertTriangle, Check, DollarSign, X, History, User } from 'lucide-react';

import { supabase } from '../lib/supabase';


// --- TYPES ---
interface Product {
    id: number;
    name: string;
    category: 'cabelo' | 'barba' | 'rosto' | 'acessorios';
    price: number;
    cost: number;
    stock: number;
    min_stock: number; // Changed to snake_case to match typical DB
    image_url: string; // Changed to snake_case
    supplier: string;
}

interface SaleLog {
    id: number;
    product: string;
    value: number;
    barber: string;
    date: Date;
}

// --- MOCK DATA FOR HISTORY ONLY (For now) ---
const SALES_HISTORY: SaleLog[] = [
    { id: 101, product: "Pomada Matte Gold", value: 89.90, barber: "Gustavo", date: new Date() },
    { id: 102, product: "Óleo de Barba", value: 65.00, barber: "Lucas", date: new Date(Date.now() - 3600000) },
    { id: 103, product: "Minoxidil Turbo", value: 120.00, barber: "Beto", date: new Date(Date.now() - 7200000) },
    { id: 104, product: "Pomada Matte Gold", value: 89.90, barber: "Gustavo", date: new Date(Date.now() - 10800000) },
    { id: 105, product: "Shampoo Anti-Queda", value: 75.00, barber: "Lucas", date: new Date(Date.now() - 86400000) },
];

export default function StockShop() {
    const [viewMode, setViewMode] = useState<'stock' | 'shop'>('stock');
    const [selectedCategory, setSelectedCategory] = useState<string>('todos');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [cartQuantity, setCartQuantity] = useState(1);
    const [products, setProducts] = useState<Product[]>([]);

    // Initial Fetch
    React.useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        // Changed table name to 'estoque' as requested by user
        const { data, error } = await supabase.from('estoque').select('*');
        if (error) {
            console.error('Error fetching estoque:', error);
        } else {
            if (!data || data.length === 0) {
                // High-quality mock products for Step 4
                const mockProducts: Product[] = [
                    { id: 1, name: "Pomada Matte Gold", category: 'cabelo', price: 89.90, cost: 45.00, stock: 12, min_stock: 5, image_url: "https://images.unsplash.com/photo-1599351431247-f13b3828e239?auto=format&fit=crop&q=80&w=400", supplier: "Gold Hair Co." },
                    { id: 2, name: "Óleo de Barba Royal", category: 'barba', price: 65.00, cost: 30.00, stock: 2, min_stock: 5, image_url: "https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?auto=format&fit=crop&q=80&w=400", supplier: "Beard King" },
                    { id: 3, name: "Shampoo Detox Mentol", category: 'cabelo', price: 75.00, cost: 35.00, stock: 8, min_stock: 3, image_url: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=400", supplier: "Fresh Care" },
                    { id: 4, name: "Escova de Madeira", category: 'acessorios', price: 45.00, cost: 15.00, stock: 1, min_stock: 5, image_url: "https://images.unsplash.com/photo-1590540179852-2110a3003058?auto=format&fit=crop&q=80&w=400", supplier: "Eco Styles" },
                    { id: 5, name: "Pós Barba Ice", category: 'rosto', price: 55.00, cost: 25.00, stock: 15, min_stock: 10, image_url: "https://images.unsplash.com/photo-1619451334792-150fd785ee74?auto=format&fit=crop&q=80&w=400", supplier: "Face Fresh" }
                ];
                setProducts(mockProducts);
            } else {
                const mappedProducts = data.map((item: any) => ({
                    id: item.id,
                    name: item.nome,
                    category: item.categoria,
                    price: item.preco,
                    cost: item.custo,
                    stock: item.quantidade,
                    min_stock: item.min_quantidade,
                    image_url: item.imagem_url,
                    supplier: item.fornecedor
                }));
                setProducts(mappedProducts);
            }
        }
    };

    // POS STATE
    const [lastClient] = useState("Ricardo Oliveira"); // Mocked "Last Client"

    const filteredProducts = products.filter(p => selectedCategory === 'todos' || p.category === selectedCategory);

    const handleSellClick = (product: Product) => {
        setCartQuantity(1);
        setSelectedProduct(product);
    };

    const handleConfirmSale = async () => {
        alert(`Venda registrada para ${lastClient}: ${cartQuantity}x ${selectedProduct?.name}`);
        // In real app: Insert into sales table, decrement stock
        setSelectedProduct(null);
    };

    const handleRestock = (product: Product, e: React.MouseEvent) => {
        e.stopPropagation();
        const msg = `Olá ${product.supplier}, preciso de reposição do ${product.name}. Qual o prazo?`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-stone-200 font-sans selection:bg-[#d4af37]/30 flex relative overflow-hidden">
            {/* Sidebar removed (Global) */}

            <main className="flex-1 p-4 lg:p-8 relative overflow-y-auto h-screen scrollbar-hide flex flex-col">

                {/* HEADER & TOGGLE */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-serif font-black text-white tracking-tighter drop-shadow-2xl mb-1">
                            {viewMode === 'stock' ? 'ESTOQUE' : 'LOJA'} <span className="text-[#d4af37]">&</span> SUPPLY
                        </h1>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">Gestão de Produtos e Vendas</p>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-full flex gap-1 relative z-20">
                        <button
                            onClick={() => setViewMode('stock')}
                            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === 'stock' ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <Package size={14} /> Estoque
                        </button>
                        <button
                            onClick={() => setViewMode('shop')}
                            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === 'shop' ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <ShoppingCart size={14} /> Loja
                        </button>
                    </div>
                </div>

                {/* CATEGORIES */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                    {['todos', 'cabelo', 'barba', 'rosto', 'acessorios'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 border rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-zinc-100 border-white text-black' : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* PRODUCT GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-12">
                    <AnimatePresence mode='popLayout'>
                        {filteredProducts.map(product => (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`
                                    bg-zinc-900/60 backdrop-blur-md rounded-2xl p-4 border relative group overflow-hidden transition-all duration-300
                                    ${product.stock < 3 ? 'border-red-500/30' : 'border-[#d4af37]/20'}
                                    ${viewMode === 'shop' ? 'hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.2)]' : ''}
                                `}
                            >
                                {/* Low Stock Pulse */}
                                {product.stock < 3 && (
                                    <div className="absolute inset-0 border-2 border-red-500/20 rounded-2xl animate-pulse pointer-events-none" />
                                )}

                                {/* Image & Badge */}
                                <div className="relative h-48 rounded-xl overflow-hidden mb-4 bg-black">
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                                    {product.stock < 3 && (
                                        <div className="absolute top-2 right-2 bg-red-600/90 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg backdrop-blur-md">
                                            <AlertTriangle size={10} /> REPOSIÇÃO
                                        </div>
                                    )}
                                    {viewMode === 'stock' && product.stock >= 3 && (
                                        <div className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-md">
                                            <Check size={10} /> EM DIA
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">{product.category}</p>
                                        <h3 className="text-white font-bold text-lg leading-tight">{product.name}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[#d4af37] font-black text-xl">R$ {product.price.toFixed(2)}</p>
                                        {viewMode === 'shop' && <p className="text-[10px] text-zinc-600 font-mono">Lucro: R$ {(product.price - product.cost).toFixed(2)}</p>}
                                    </div>
                                </div>

                                {/* Mode Specific UI */}
                                {viewMode === 'stock' ? (
                                    <div className="mt-4 space-y-3">
                                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                                            <span>Estoque: <strong className={product.stock < 3 ? 'text-red-500' : 'text-white'}>{product.stock} un</strong></span>
                                            <span>Mínimo: {product.min_stock}</span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${product.stock < 3 ? 'bg-red-500 w-[20%]' : 'bg-emerald-500 w-[80%]'}`}
                                            />
                                        </div>

                                        {product.stock < 3 && (
                                            <button
                                                onClick={(e) => handleRestock(product, e)}
                                                className="w-full mt-2 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                                            >
                                                <Truck size={14} /> Pedir Reposição
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleSellClick(product)}
                                        className="w-full mt-4 bg-[#d4af37] hover:bg-[#b08d55] text-black font-black uppercase tracking-widest py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart size={16} /> Vender
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* SALES HISTORY FOOTER */}
                <div className="mt-auto pt-6 border-t border-zinc-900">
                    <div className="flex items-center gap-2 mb-4 text-zinc-500">
                        <History size={14} />
                        <span className="text-xs font-bold uppercase tracking-widest">Últimas Vendas</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {SALES_HISTORY.map(sale => (
                            <div key={sale.id} className="bg-black/40 border border-zinc-800 p-3 rounded-lg flex flex-col">
                                <span className="text-zinc-300 font-bold text-xs truncate">{sale.product}</span>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[#d4af37] font-mono text-xs">R$ {sale.value.toFixed(2)}</span>
                                    <span className="text-[10px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded capitalize">{sale.barber}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </main>

            {/* POS DRAWER */}
            <AnimatePresence>
                {selectedProduct && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-zinc-950 border-l border-[#d4af37]/30 z-50 shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-zinc-900 bg-zinc-900/50">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-serif font-black text-white">CHECKOUT</h2>
                                    <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><X size={20} className="text-zinc-500" /></button>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 rounded-xl bg-zinc-800 overflow-hidden shrink-0">
                                        <img src={selectedProduct.image_url} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-zinc-500 text-xs font-bold uppercase">{selectedProduct.category}</p>
                                        <h3 className="text-white font-bold text-lg leading-tight">{selectedProduct.name}</h3>
                                        <p className="text-[#d4af37] font-black text-lg mt-1">R$ {selectedProduct.price.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 flex-1 space-y-6">
                                {/* Client Auto-Select */}
                                <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Cliente (Agenda)</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center font-bold text-xs"><User size={14} /></div>
                                        <p className="text-white font-bold">{lastClient}</p>
                                        <span className="ml-auto text-emerald-500 text-[10px] font-bold bg-emerald-950 px-2 py-1 rounded-full">CONFIRMADO</span>
                                    </div>
                                </div>

                                {/* Quantity */}
                                <div>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Quantidade</p>
                                    <div className="flex items-center justify-between bg-zinc-900 rounded-xl p-2 border border-zinc-800">
                                        <button onClick={() => setCartQuantity(Math.max(1, cartQuantity - 1))} className="w-10 h-10 rounded-lg bg-black hover:bg-zinc-800 text-zinc-400 flex items-center justify-center transition-colors"><Minus size={16} /></button>
                                        <span className="text-xl font-black text-white">{cartQuantity}</span>
                                        <button onClick={() => setCartQuantity(cartQuantity + 1)} className="w-10 h-10 rounded-lg bg-[#d4af37] text-black flex items-center justify-center hover:scale-105 transition-transform"><Plus size={16} /></button>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="mt-auto py-6 border-t border-zinc-900">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-zinc-500 text-sm">Total a pagar</span>
                                        <span className="text-3xl font-black text-white">R$ {(selectedProduct.price * cartQuantity).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 pt-0">
                                <button
                                    onClick={handleConfirmSale}
                                    className="w-full bg-gradient-to-r from-[#d4af37] to-[#b08d55] text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:shadow-[0_0_50px_rgba(212,175,55,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <DollarSign size={20} /> Confirmar Venda
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
