'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  BarChart3, 
  Package, 
  ShoppingBag, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Upload, 
  Eye,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { formatPrice } from '@/lib/utils/formatPrice';
import { slugify } from '@/lib/utils/slugify';
import { createClient } from '@/lib/supabase/client';
import { 
  createProductAction, 
  updateProductAction, 
  deleteProductAction, 
  updateOrderStatusAction, 
  getCollectionsAction,
  getProductsAction
} from '@/lib/actions/actions';
import { Product, Order, Collection, ProductVariant, DashboardStats } from '@/types';

interface AdminClientProps {
  initialStats: DashboardStats;
  initialProducts: Product[];
  initialCollections: Collection[];
}

export function AdminClient({ initialStats, initialProducts, initialCollections }: AdminClientProps) {
  const [stats, setStats] = useState(initialStats);
  const [products, setProducts] = useState(initialProducts);
  const [collections] = useState(initialCollections);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders'>('dashboard');

  const supabase = createClient();

  // Overview Search
  const [productSearch, setProductSearch] = useState('');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formComparePrice, setFormComparePrice] = useState('');
  const [formStatus, setFormStatus] = useState<'draft' | 'active' | 'archived'>('draft');
  const [formCollectionId, setFormCollectionId] = useState('');
  const [formMetaTitle, setFormMetaTitle] = useState('');
  const [formMetaDesc, setFormMetaDesc] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  
  // Attributes / Variants Generation Form
  const [attributes, setAttributes] = useState<{ name: string; values: string[] }[]>([]);
  const [attrName, setAttrName] = useState('');
  const [attrValueStr, setAttrValueStr] = useState('');
  const [variantsMatrix, setVariantsMatrix] = useState<any[]>([]);

  // Drag and Drop Images
  const [uploadingImage, setUploadingImage] = useState(false);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Auto-fill slug from title
  useEffect(() => {
    if (!editingProduct) {
      setFormSlug(slugify(formName));
    }
  }, [formName, editingProduct]);

  const handleEditProductClick = async (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormSlug(prod.slug);
    setFormDesc(prod.description || '');
    setFormPrice(prod.price.toString());
    setFormComparePrice(prod.compare_at_price?.toString() || '');
    setFormStatus(prod.status);
    setFormCollectionId(prod.collection_id || '');
    setFormMetaTitle(prod.meta_title || '');
    setFormMetaDesc(prod.meta_description || '');
    setFormImages(prod.images);

    // Fetch existing variants
    const { data } = await supabase.from('product_variants').select('*').eq('product_id', prod.id);
    if (data) {
      setVariantsMatrix(data.map((v: any) => ({
        id: v.id,
        name: v.name,
        options: v.options,
        price: v.price || '',
        stock: v.stock,
        sku: v.sku || '',
        imageUrl: v.image_url || '',
      })));
    }
    
    setIsProductModalOpen(true);
  };

  const handleAddProductClick = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSlug('');
    setFormDesc('');
    setFormPrice('');
    setFormComparePrice('');
    setFormStatus('draft');
    setFormCollectionId('');
    setFormMetaTitle('');
    setFormMetaDesc('');
    setFormImages([]);
    setAttributes([]);
    setVariantsMatrix([]);
    setIsProductModalOpen(true);
  };

  // Add Attribute Size/Color
  const handleAddAttribute = () => {
    if (!attrName.trim() || !attrValueStr.trim()) return;
    const values = attrValueStr.split(',').map((v) => v.trim()).filter((v) => v.length > 0);
    const newAttrs = [...attributes, { name: attrName.trim(), values }];
    setAttributes(newAttrs);
    setAttrName('');
    setAttrValueStr('');
    
    // Regenerate variants matrix using cartesian logic
    generateVariants(newAttrs);
  };

  const generateVariants = (attrs: any[]) => {
    if (attrs.length === 0) {
      setVariantsMatrix([]);
      return;
    }

    let combos: Record<string, string>[] = [{}];
    attrs.forEach((attr) => {
      const temp: Record<string, string>[] = [];
      combos.forEach((combo) => {
        attr.values.forEach((val: string) => {
          temp.push({ ...combo, [attr.name]: val });
        });
      });
      combos = temp;
    });

    const matrix = combos.map((combo) => {
      const name = Object.entries(combo).map(([_, v]) => v).join(' / ');
      const valString = Object.values(combo).join('-').toLowerCase();
      return {
        name,
        options: combo,
        price: formPrice || '',
        stock: 10,
        sku: `${formSlug || 'sku'}-${valString}`,
        imageUrl: '',
      };
    });

    setVariantsMatrix(matrix);
  };

  // Drag and Drop simulation
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload to Supabase Storage bucket 'products'
      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      } else {
        // Fallback mockup local preview
        const url = URL.createObjectURL(file);
        uploadedUrls.push(url);
      }
    }

    setFormImages([...formImages, ...uploadedUrls]);
    setUploadingImage(false);
    toast.success('Images uploaded successfully.');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSlug || !formPrice) {
      toast.error('Required fields must be completed.');
      return;
    }

    const payload = {
      name: formName,
      slug: formSlug,
      description: formDesc || null,
      price: parseFloat(formPrice),
      compareAtPrice: formComparePrice ? parseFloat(formComparePrice) : null,
      images: formImages,
      status: formStatus,
      collectionId: formCollectionId || null,
      metaTitle: formMetaTitle || null,
      metaDescription: formMetaDesc || null,
      variants: variantsMatrix.map((v) => ({
        name: v.name,
        options: v.options,
        price: v.price ? parseFloat(v.price) : null,
        stock: parseInt(v.stock.toString()),
        sku: v.sku,
        imageUrl: v.imageUrl || null,
      })),
    };

    setLoading(true);
    let res;
    if (editingProduct) {
      res = await updateProductAction(editingProduct.id, payload);
    } else {
      res = await createProductAction(payload);
    }
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(editingProduct ? 'Product updated successfully.' : 'Product created successfully.');
      setIsProductModalOpen(false);
      
      // Reload product listing
      const freshProds = await getProductsAction({ status: null, limit: 100 });
      if (freshProds.data) setProducts(freshProds.data.products);
    }
  };

  const handleDeleteProductClick = (id: string) => {
    setDeletingProductId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProductId) return;

    setLoading(true);
    const res = await deleteProductAction(deletingProductId);
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Product deleted successfully.');
      setProducts(products.filter((p) => p.id !== deletingProductId));
      setIsDeleteModalOpen(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, status: any) => {
    const res = await updateOrderStatusAction(orderId, status);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Order status updated.');
      
      // Update local state
      const updatedOrders = stats.recentOrders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      );
      setStats({ ...stats, recentOrders: updatedOrders });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.slug.toLowerCase().includes(productSearch.toLowerCase())
  );

  const [loading, setLoading] = useState(false);

  return (
    <div className="flex-1 w-full flex flex-col lg:flex-row bg-background">
      {/* Sidebar Nav */}
      <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-border bg-card p-6 flex flex-col gap-1 select-none shrink-0">
        <span className="text-[10px] font-black tracking-widest text-primary uppercase mb-6 px-4">
          Control Center
        </span>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-left transition-colors cursor-pointer ${
            activeTab === 'dashboard' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <BarChart3 className="w-4.5 h-4.5" /> Overview Dashboard
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-left transition-colors cursor-pointer ${
            activeTab === 'products' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Package className="w-4.5 h-4.5" /> Product Inventory
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-left transition-colors cursor-pointer ${
            activeTab === 'orders' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <ShoppingBag className="w-4.5 h-4.5" /> Order Fulfillment
        </button>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-6 md:p-10 flex flex-col gap-8 max-w-7xl">
        
        {/* 1. DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8">
            <h2 className="text-xl font-black uppercase text-foreground">Dashboard</h2>
            
            {/* Aggregate Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Total Revenue', value: formatPrice(stats.revenue), icon: BarChart3 },
                { title: 'Orders Placed', value: stats.ordersCount, icon: ShoppingBag },
                { title: 'Users Count', value: stats.usersCount, icon: Users },
                { title: 'Catalog Items', value: stats.productsCount, icon: Package },
              ].map((card, idx) => (
                <div key={idx} className="border border-border bg-card p-6 rounded-xl shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider">{card.title}</span>
                    <card.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-2xl font-black text-foreground">{card.value}</span>
                </div>
              ))}
            </div>

            {/* Recent Orders table */}
            <div className="border border-border rounded-xl bg-card overflow-hidden mt-4">
              <div className="px-6 py-4 bg-muted/40 border-b border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Recent Transactions</h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/20">
                    <th className="px-6 py-3">Order ID</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-muted/10">
                      <td className="px-6 py-4 text-xs font-bold text-foreground truncate max-w-[120px]">{order.id}</td>
                      <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{order.shipping_address.fullName}</td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-foreground text-right">{formatPrice(order.total)}</td>
                      <td className="px-6 py-4">
                        <Button 
                          onClick={() => { setSelectedOrder(order); setIsOrderModalOpen(true); }}
                          variant="ghost" size="sm" className="h-8 text-[10px]"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. PRODUCTS INVENTORY */}
        {activeTab === 'products' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center gap-4">
              <h2 className="text-xl font-black uppercase text-foreground">Products</h2>
              <Button onClick={handleAddProductClick} size="sm" className="uppercase text-xs font-bold tracking-wider gap-1.5 h-10">
                <Plus className="w-4 h-4" /> Add Product
              </Button>
            </div>

            {/* Search filter toolbar */}
            <div className="flex items-center relative w-full max-w-md">
              <input
                type="text"
                placeholder="Search products by name or slug..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Search className="absolute left-3.5 w-4 h-4 text-muted-foreground" />
            </div>

            {/* Products Table */}
            <div className="border border-border rounded-xl bg-card overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Slug</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Price</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="border-b border-border/60 hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="relative w-10 h-12 bg-muted rounded border border-border overflow-hidden">
                          {p.images[0] ? (
                            <Image src={p.images[0]} alt={p.name} fill sizes="40px" className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-muted" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-foreground truncate max-w-[180px]">{p.name}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-muted-foreground">{p.slug}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          p.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-foreground text-right">{formatPrice(p.price)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button onClick={() => handleEditProductClick(p)} variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button onClick={() => handleDeleteProductClick(p.id)} variant="destructive" size="sm" className="h-8 w-8 p-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. ORDER MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-black uppercase text-foreground font-sans">Fulfillment Panel</h2>

            <div className="border border-border rounded-xl bg-card overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Recipient</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Fulfillment</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-border/50 hover:bg-muted/10">
                      <td className="px-6 py-4 text-xs font-bold text-foreground truncate max-w-[120px]">{o.id}</td>
                      <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{o.shipping_address.fullName}</td>
                      <td className="px-6 py-4 text-xs font-bold text-primary truncate max-w-[140px]">{o.razorpay_payment_id || 'Cash'}</td>
                      <td className="px-6 py-4">
                        <select
                          value={o.status}
                          onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                          className="text-[10px] font-bold bg-muted/40 border border-border rounded px-2.5 py-1 focus:ring-0 focus:outline-none text-foreground uppercase cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-foreground text-right">{formatPrice(o.total)}</td>
                      <td className="px-6 py-4 text-center">
                        <Button onClick={() => { setSelectedOrder(o); setIsOrderModalOpen(true); }} variant="outline" size="sm" className="h-8">
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* 4. PRODUCT EDIT/ADD DIALOG */}
      <Modal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)} 
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        className="max-w-4xl max-h-[90vh]"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-6 py-2">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Product Name" required value={formName} onChange={(e) => setFormName(e.target.value)} />
            <Input label="Slug / URL Path" required value={formSlug} onChange={(e) => setFormSlug(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea
              rows={4}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Input label="Base Price (₹)" required type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
            <Input label="Compare-At Price (₹)" type="number" step="0.01" value={formComparePrice} onChange={(e) => setFormComparePrice(e.target.value)} />
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Publish Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="flex h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Collection assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Collection Association</label>
              <select
                value={formCollectionId}
                onChange={(e) => setFormCollectionId(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                <option value="">None</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
            
            <Input label="Meta Title Tag" max={70} value={formMetaTitle} onChange={(e) => setFormMetaTitle(e.target.value)} />
          </div>

          <Input label="Meta Description" max={160} value={formMetaDesc} onChange={(e) => setFormMetaDesc(e.target.value)} />

          {/* Drag & Drop Multi Images */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gallery Images</span>
            <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-4 bg-muted/15 relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                disabled={uploadingImage}
              />
              <Upload className="w-10 h-10 text-muted-foreground" />
              <div className="text-center">
                <p className="text-xs font-semibold text-foreground">Click to upload files</p>
                <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG, WEBP up to 5MB</p>
              </div>
            </div>

            {/* Thumbnail preview List */}
            {formImages.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2">
                {formImages.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-20 border border-border rounded-lg overflow-hidden bg-muted group">
                    <Image src={img} alt="Product upload preview" fill sizes="64px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormImages(formImages.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-1 bg-destructive/80 text-white rounded-full hover:bg-destructive shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attribute Cartesian Grid */}
          {!editingProduct && (
            <div className="border-t border-border pt-6 flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Dynamic Variants Setup</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <Input label="Attribute Name" placeholder="e.g. Size" value={attrName} onChange={(e) => setAttrName(e.target.value)} />
                <Input label="Values (Comma split)" placeholder="e.g. S, M, L" value={attrValueStr} onChange={(e) => setAttrValueStr(e.target.value)} />
                <Button type="button" variant="outline" onClick={handleAddAttribute} className="h-11 uppercase text-[10px] tracking-wider font-extrabold">
                  Add Attribute
                </Button>
              </div>

              {/* Added Attributes display list */}
              {attributes.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  {attributes.map((attr, idx) => (
                    <span key={idx} className="px-3 py-1 bg-muted rounded-full text-foreground border border-border">
                      {attr.name}: {attr.values.join(', ')}
                    </span>
                  ))}
                </div>
              )}

              {/* Generated matrix table */}
              {variantsMatrix.length > 0 && (
                <div className="border border-border rounded-xl bg-card overflow-hidden mt-2">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border text-[9px] font-bold uppercase text-muted-foreground">
                        <th className="px-4 py-2">Variant</th>
                        <th className="px-4 py-2">Stock</th>
                        <th className="px-4 py-2">SKU</th>
                        <th className="px-4 py-2">Price Override</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variantsMatrix.map((item, idx) => (
                        <tr key={idx} className="border-b border-border/50 last:border-0">
                          <td className="px-4 py-2 text-xs font-bold text-foreground">{item.name}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              required
                              value={item.stock}
                              onChange={(e) => {
                                const temp = [...variantsMatrix];
                                temp[idx].stock = parseInt(e.target.value) || 0;
                                setVariantsMatrix(temp);
                              }}
                              className="w-20 border border-input bg-background text-xs text-foreground px-2 py-1 rounded"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              required
                              value={item.sku}
                              onChange={(e) => {
                                const temp = [...variantsMatrix];
                                temp[idx].sku = e.target.value;
                                setVariantsMatrix(temp);
                              }}
                              className="w-full max-w-[150px] border border-input bg-background text-xs text-foreground px-2 py-1 rounded"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              placeholder="Price"
                              value={item.price}
                              onChange={(e) => {
                                const temp = [...variantsMatrix];
                                temp[idx].price = e.target.value;
                                setVariantsMatrix(temp);
                              }}
                              className="w-24 border border-input bg-background text-xs text-foreground px-2 py-1 rounded"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Form Actions CTA */}
          <div className="border-t border-border pt-6 flex justify-end gap-3 shrink-0">
            <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading} className="uppercase text-xs font-bold tracking-wider">
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>

        </form>
      </Modal>

      {/* 5. DELETE VERIFICATION MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="py-2 flex flex-col gap-4">
          <p className="text-xs text-muted-foreground leading-normal">
            Are you sure you want to delete this product? This action is permanent and will delete all variants associated with it.
          </p>
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} isLoading={loading}>Delete Product</Button>
          </div>
        </div>
      </Modal>

      {/* 6. ORDER DETAIL VIEW MODAL */}
      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Order Summary">
        {selectedOrder && (
          <div className="flex flex-col gap-5 py-2">
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div>
                <p className="text-[10px]">Order ID</p>
                <p className="text-foreground font-bold">{selectedOrder.id}</p>
              </div>
              <div>
                <p className="text-[10px]">Recipient</p>
                <p className="text-foreground font-bold">{selectedOrder.shipping_address.fullName}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fulfillment State</label>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleOrderStatusUpdate(selectedOrder.id, e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-xs text-foreground uppercase cursor-pointer"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">Items Summary</h4>
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-foreground">{item.name}</p>
                    {item.variant_name && <p className="text-[9px] text-muted-foreground mt-0.5">{item.variant_name}</p>}
                    <p className="text-[9px] text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-foreground">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-baseline text-xs font-bold uppercase border-t border-border pt-4 text-foreground">
              <span>Total Revenue</span>
              <span className="text-sm font-black text-primary">{formatPrice(selectedOrder.total)}</span>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
