import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Package, ShoppingBag, X, Upload, Loader2, Edit, Minus, Search, Filter, TrendingUp } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price: number; // Preço de Venda
    cost_price: number; // Preço de Custo
    stock: number;
    category: string;
    image_url: string | null;
}

const CATEGORIES = ['Todos', 'Cabelo', 'Barba', 'Bebidas', 'Eletrônicos', 'Outros'];

export default function StockShop() {
    const [products, setProducts] = useState<Product[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    // Estado do Formulário
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '', price: '', cost_price: '', stock: '', category: 'Outros', image_url: ''
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const { data } = await supabase.from('products').select('*').order('name');
        if (data) setProducts(data);
        setLoading(false);
    };

    // --- LÓGICA DE FILTRO ---
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // --- AÇÕES ---
    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData({ name: '', price: '', cost_price: '', stock: '', category: 'Outros', image_url: '' });
        setShowModal(true);
    };

    const handleOpenEdit = (prod: Product) => {
        setEditingId(prod.id);
        setFormData({
            name: prod.name,
            price: prod.price.toString(),
            cost_price: (prod.cost_price || 0).toString(),
            stock: prod.stock.toString(),
            category: prod.category || 'Outros',
            image_url: prod.image_url || ''
        });
        setShowModal(true);
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        setUploading(true);
        try {
            const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('products').getPublicUrl(filePath);
            setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error: any) {
            alert('Erro: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price) return alert("Nome e Preço são obrigatórios");

        const payload = {
            name: formData.name,
            price: parseFloat(formData.price.toString().replace(',', '.')),
            cost_price: parseFloat(formData.cost_price.toString().replace(',', '.')) || 0,
            stock: parseInt(formData.stock) || 0,
            category: formData.category,
            image_url: formData.image_url || null
        };

        if (editingId) {
            await supabase.from('products').update(payload).eq('id', editingId);
        } else {
            await supabase.from('products').insert([payload]);
        }
        setShowModal(false);
        fetchProducts();
    };

    const handleDelete = async (id: string, imageUrl: string | null) => {
        if (!confirm("Tem certeza que quer excluir?")) return;
        await supabase.from('products').delete().eq('id', id);
        if (imageUrl) {
            const path = imageUrl.split('/').pop();
            if (path) await supabase.storage.from('products').remove([path]);
        }
        fetchProducts();
    };

    const handleQuickDecrease = async (id: string, currentStock: number) => {
        if (currentStock <= 0) return;
        setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: p.stock - 1 } : p));
        await supabase.from('products').update({ stock: currentStock - 1 }).eq('id', id);
    };

    return (
        <div className="h-full bg-[#09090b] text-white p-6 pb-20 overflow-y-auto custom-scrollbar">
            {/* HEADER E BUSCA */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-black uppercase tracking-tighter text-white">
                        Estoque <span className="text-[#d4af37]">Produtos</span>
                    </h1>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
                        Gerencie suas vendas extras
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar produto..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#d4af37] outline-none"
                        />
                    </div>
                    <button
                        onClick={handleOpenCreate}
                        className="bg-[#d4af37] text-black px-4 py-3 rounded-xl font-black uppercase flex items-center gap-2 hover:bg-[#b5952f] transition-all"
                    >
                        <Plus size={20} /> <span className="hidden md:inline">Novo</span>
                    </button>
                </div>
            </div>

            {/* ABAS DE CATEGORIA */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 custom-scrollbar">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${selectedCategory === cat
                                ? 'bg-zinc-800 text-[#d4af37] border-[#d4af37]/50'
                                : 'bg-transparent text-zinc-500 border-transparent hover:bg-zinc-900'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? <p className="text-zinc-500 animate-pulse">Carregando...</p> : filteredProducts.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 border border-zinc-800 border-dashed rounded-3xl text-zinc-600">
                        <Package size={48} className="mb-4 opacity-50" />
                        <p className="font-bold uppercase tracking-widest text-sm">Nenhum produto encontrado</p>
                    </div>
                ) : (
                    filteredProducts.map(product => {
                        const profit = product.price - (product.cost_price || 0);
                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={product.id}
                                className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between group hover:border-[#d4af37]/30 transition-all relative overflow-hidden"
                            >
                                {/* IMAGEM */}
                                <div className="relative h-48 rounded-xl overflow-hidden mb-4 bg-black/50 flex items-center justify-center group-hover:shadow-lg transition-all">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <ShoppingBag size={40} className="text-zinc-700" />
                                    )}

                                    {product.stock <= 3 && (
                                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded uppercase shadow-lg">
                                            Acabando
                                        </div>
                                    )}

                                    {/* OVERLAY ACTIONS */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-between items-end">
                                        <button onClick={() => handleOpenEdit(product)} className="p-2 bg-zinc-800 hover:bg-white hover:text-black text-white rounded-lg transition-colors"><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(product.id, product.image_url)} className="p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                {/* INFO */}
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider bg-zinc-950 px-2 py-0.5 rounded">{product.category}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight truncate mb-2" title={product.name}>{product.name}</h3>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800/50">
                                        <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-lg border border-zinc-800">
                                            <span className={`text-xs font-bold ${product.stock > 0 ? 'text-white' : 'text-red-500'}`}>{product.stock} un</span>
                                            <button onClick={() => handleQuickDecrease(product.id, product.stock)} className="w-5 h-5 flex items-center justify-center bg-zinc-800 hover:bg-red-500 hover:text-white rounded text-zinc-400 transition-colors"><Minus size={10} /></button>
                                        </div>

                                        <div className="text-right">
                                            <span className="block text-[#d4af37] font-serif font-black text-xl">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                            </span>
                                            {/* MOSTRAR LUCRO */}
                                            {product.cost_price > 0 && (
                                                <span className="text-[10px] text-zinc-600 font-bold flex items-center justify-end gap-1">
                                                    <TrendingUp size={10} /> Lucro: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profit)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* MODAL (FORMULÁRIO) */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X /></button>
                            <h3 className="text-2xl font-serif font-black text-white italic mb-1">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-6">Preencha os detalhes</p>

                            <div className="space-y-4">
                                {/* FOTO */}
                                <div className="flex justify-center">
                                    <label className="cursor-pointer group relative w-full h-32 bg-black/30 border-2 border-dashed border-zinc-700 rounded-2xl flex flex-col items-center justify-center hover:border-[#d4af37] transition-colors overflow-hidden">
                                        {uploading ? <Loader2 className="animate-spin text-[#d4af37]" /> : formData.image_url ? (
                                            <img src={formData.image_url} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                                        ) : (
                                            <div className="text-center">
                                                <Upload size={24} className="text-zinc-500 mb-2 mx-auto" />
                                                <span className="text-zinc-500 text-xs font-bold uppercase">Enviar Foto</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                                    </label>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Nome</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3 text-white font-bold outline-none focus:border-[#d4af37]" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Categoria</label>
                                        <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3 text-white font-bold outline-none focus:border-[#d4af37]">
                                            {CATEGORIES.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Estoque</label>
                                        <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3 text-white font-bold outline-none focus:border-[#d4af37]" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest block mb-1">Preço Venda</label>
                                        <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full bg-black/50 border border-[#d4af37]/30 rounded-xl p-3 text-white font-bold outline-none focus:border-[#d4af37]" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Preço Custo</label>
                                        <input type="number" value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: e.target.value })} className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3 text-zinc-400 font-bold outline-none focus:border-[#d4af37]" placeholder="Opcional" />
                                    </div>
                                </div>

                                <button onClick={handleSave} disabled={uploading} className="w-full bg-[#d4af37] text-black font-black uppercase py-4 rounded-xl hover:bg-[#b5952f] mt-2 shadow-lg disabled:opacity-50">
                                    {editingId ? 'Salvar Alterações' : 'Cadastrar Produto'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}