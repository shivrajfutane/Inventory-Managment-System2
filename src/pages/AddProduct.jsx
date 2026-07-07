import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import { generateSKU } from '../utils/helpers';

const EMPTY_FORM = {
    name: '', sku: '', description: '', category_id: '',
    supplier_id: '', quantity: '', min_stock_level: '',
    unit_price: '', cost_price: '', location: '',
    status: 'active', image_url: '',
};

/* ── Image Uploader Component ──────────────────────────────── */
const ImageUploader = ({ value, onChange }) => {
    const fileRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(value || '');
    const [dragOver, setDragOver] = useState(false);

    // Keep preview in sync if parent resets form (edit mode)
    useEffect(() => { setPreview(value || ''); }, [value]);

    const uploadFile = async (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            return;
        }
        setUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: upErr } = await supabase.storage
                .from('product-images')
                .upload(path, file, { upsert: true });
            if (upErr) throw upErr;

            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(path);

            setPreview(data.publicUrl);
            onChange(data.publicUrl);
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e) => uploadFile(e.target.files?.[0]);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        uploadFile(e.dataTransfer.files?.[0]);
    };

    const handleUrlChange = (e) => {
        setPreview(e.target.value);
        onChange(e.target.value);
    };

    const handleRemove = () => {
        setPreview('');
        onChange('');
        if (fileRef.current) fileRef.current.value = '';
    };

    return (
        <div className="form-group">
            <label className="form-label">Product Image</label>

            {/* Drop zone / Preview */}
            <div
                onClick={() => !preview && fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${dragOver ? 'var(--color-primary-500)' : 'var(--border-light)'}`,
                    borderRadius: 12,
                    background: dragOver ? 'var(--bg-active)' : 'var(--bg-hover)',
                    minHeight: preview ? 'auto' : 120,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: preview ? 'default' : 'pointer',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    position: 'relative',
                }}
            >
                {uploading ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            border: '3px solid var(--border-light)',
                            borderTopColor: 'var(--color-primary-500)',
                            animation: 'spin 0.8s linear infinite',
                            margin: '0 auto 0.5rem',
                        }} />
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Uploading...</p>
                    </div>
                ) : preview ? (
                    <>
                        <img
                            src={preview}
                            alt="Product preview"
                            style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }}
                            onError={() => setPreview('')}
                        />
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                            style={{
                                position: 'absolute', top: 8, right: 8,
                                background: 'rgba(0,0,0,0.5)', color: 'white',
                                border: 'none', borderRadius: 6, padding: '2px 8px',
                                cursor: 'pointer', fontSize: '0.75rem', lineHeight: '1.6',
                            }}
                        >
                            ✕ Remove
                        </button>
                    </>
                ) : (
                    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" style={{ marginBottom: '0.5rem' }}>
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                            <circle cx="9" cy="9" r="2"/>
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                        </svg>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                            Click or drag & drop an image
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0.25rem 0 0' }}>
                            PNG, JPG, WebP supported
                        </p>
                    </div>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            {/* Upload button row */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    style={{ flexShrink: 0 }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" x2="12" y1="3" y2="15"/>
                    </svg>
                    Upload Image
                </button>
                <input
                    type="url"
                    className="form-input"
                    placeholder="or paste an image URL..."
                    value={preview}
                    onChange={handleUrlChange}
                    style={{ fontSize: '0.8125rem' }}
                />
            </div>
        </div>
    );
};

/* ── Main Component ──────────────────────────────────────────── */
const AddProduct = () => {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [form, setForm] = useState(EMPTY_FORM);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [originalQuantity, setOriginalQuantity] = useState(0);

    // Load categories + suppliers
    useEffect(() => {
        const load = async () => {
            const [{ data: cats }, { data: sups }] = await Promise.all([
                supabase.from('categories').select('id, name').order('name'),
                supabase.from('suppliers').select('id, name').order('name'),
            ]);
            setCategories(cats || []);
            setSuppliers(sups || []);
        };
        load();
    }, []);

    // If editing, load existing product
    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
            if (error || !data) { showToast('Product not found', 'error'); navigate('/products'); return; }
            setForm({ ...EMPTY_FORM, ...data, image_url: data.image_url || '' });
            setOriginalQuantity(data.quantity || 0);
            setFetching(false);
        };
        load();
    }, [id, isEdit, navigate, showToast]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.sku.trim()) {
            showToast('Name and SKU are required', 'error');
            return;
        }

        setLoading(true);
        const payload = {
            name:            form.name.trim(),
            sku:             form.sku.trim(),
            description:     form.description.trim() || null,
            category_id:     form.category_id     || null,
            supplier_id:     form.supplier_id     || null,
            quantity:        parseInt(form.quantity)      || 0,
            min_stock_level: parseInt(form.min_stock_level) || 0,
            unit_price:      parseFloat(form.unit_price)   || 0,
            cost_price:      parseFloat(form.cost_price)   || null,
            location:        form.location.trim()          || null,
            status:          form.status,
            image_url:       form.image_url.trim()         || null,
        };

        try {
            if (isEdit) {
                const { error } = await supabase.from('products').update(payload).eq('id', id);
                if (error) throw error;

                // Log adjustment if quantity has changed
                if (payload.quantity !== originalQuantity) {
                    const diff = payload.quantity - originalQuantity;
                    const type = diff > 0 ? 'stock_in' : 'stock_out';
                    const { error: txErr } = await supabase.from('inventory_transactions').insert([{
                        product_id: id,
                        type,
                        quantity: Math.abs(diff),
                        previous_stock: originalQuantity,
                        new_stock: payload.quantity,
                        reference: 'UPDATE',
                        notes: `Quantity adjusted from product edit form (${originalQuantity} ➔ ${payload.quantity})`
                    }]);
                    if (txErr) console.error('Error logging adjustment transaction:', txErr);
                }
            } else {
                const { data: newProds, error } = await supabase.from('products').insert([payload]).select();
                if (error) throw error;
                const newProd = newProds?.[0];

                // Log initial stock if quantity is > 0
                if (payload.quantity > 0 && newProd) {
                    const { error: txErr } = await supabase.from('inventory_transactions').insert([{
                        product_id: newProd.id,
                        type: 'stock_in',
                        quantity: payload.quantity,
                        previous_stock: 0,
                        new_stock: payload.quantity,
                        reference: 'INITIAL',
                        notes: 'Initial stock on product creation'
                    }]);
                    if (txErr) console.error('Error logging initial stock transaction:', txErr);
                }
            }
            showToast(isEdit ? 'Product updated!' : 'Product added!', 'success');
            navigate('/products');
        } catch (err) {
            showToast(err.message || 'Something went wrong', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading product...</div>;
    }

    const Field = ({ label, name, type = 'text', required, hint, ...rest }) => (
        <div className="form-group">
            <label htmlFor={name} className="form-label">
                {label}{required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                className="form-input"
                value={form[name]}
                onChange={handleChange}
                required={required}
                {...rest}
            />
            {hint && <p className="form-hint">{hint}</p>}
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <Link to="/products" style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: '0.875rem' }}>
                        ← Products
                    </Link>
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {isEdit ? 'Edit Product' : 'Add New Product'}
                </h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                    {isEdit ? 'Update the product information below' : 'Fill in the details to add a product to inventory'}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.25rem' }}>

                    {/* Basic Info */}
                    <div className="app-card" style={{ padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Basic Information</h2>

                        <Field label="Product Name" name="name" placeholder="e.g. Wireless Mouse" required />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                            <Field label="SKU" name="sku" placeholder="e.g. SKU-001" required />
                            <button type="button" className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}
                                onClick={() => setForm(prev => ({ ...prev, sku: generateSKU() }))}>
                                Generate
                            </button>
                        </div>

                        <div className="form-group">
                            <label htmlFor="description" className="form-label">Description</label>
                            <textarea
                                id="description" name="description" className="form-input"
                                placeholder="Optional product description"
                                rows={3} value={form.description} onChange={handleChange}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        {/* Image uploader */}
                        <ImageUploader
                            value={form.image_url}
                            onChange={(url) => setForm(prev => ({ ...prev, image_url: url }))}
                        />

                        <div className="form-group">
                            <label htmlFor="status" className="form-label">Status</label>
                            <select id="status" name="status" className="form-select" value={form.status} onChange={handleChange}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="discontinued">Discontinued</option>
                            </select>
                        </div>
                    </div>

                    {/* Inventory Details */}
                    <div className="app-card" style={{ padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Inventory & Pricing</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <Field label="Quantity" name="quantity" type="number" min="0" placeholder="0" />
                            <Field label="Min Stock Level" name="min_stock_level" type="number" min="0" placeholder="5"
                                hint="Alert threshold" />
                            <Field label="Unit Price (₹)" name="unit_price" type="number" min="0" step="0.01" placeholder="0.00" />
                            <Field label="Cost Price (₹)" name="cost_price" type="number" min="0" step="0.01" placeholder="0.00" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="location" className="form-label">Storage Location</label>
                            <input id="location" name="location" className="form-input"
                                placeholder="e.g. Shelf A-3" value={form.location} onChange={handleChange} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="category_id" className="form-label">Category</label>
                            <select id="category_id" name="category_id" className="form-select" value={form.category_id} onChange={handleChange}>
                                <option value="">-- Select Category --</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="supplier_id" className="form-label">Supplier</label>
                            <select id="supplier_id" name="supplier_id" className="form-select" value={form.supplier_id} onChange={handleChange}>
                                <option value="">-- Select Supplier --</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                    <Link to="/products" className="btn btn-secondary">Cancel</Link>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddProduct;
