import React, { useState, useEffect, useCallback } from 'react';
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
            const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
            if (error || !data) { showToast('Product not found', 'error'); navigate('/products'); return; }
            setForm({ ...EMPTY_FORM, ...data });
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
            let error;
            if (isEdit) {
                ({ error } = await supabase.from('products').update(payload).eq('id', id));
            } else {
                ({ error } = await supabase.from('products').insert([payload]));
            }
            if (error) throw error;
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

                        <div className="form-group">
                            <label htmlFor="image_url" className="form-label">Image URL</label>
                            <input id="image_url" name="image_url" type="url" className="form-input"
                                placeholder="https://..." value={form.image_url} onChange={handleChange} />
                        </div>

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
