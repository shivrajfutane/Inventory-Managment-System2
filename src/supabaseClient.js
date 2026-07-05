import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rpybiwuxbqnyaulhayso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJweWJpd3V4YnFueWF1bGhheXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0OTkxMzgsImV4cCI6MjA5ODA3NTEzOH0.1yfbZWdqScsaEyK0CodjaYP-BGkI-oOJRHo1n38Rvxc';

let supabase;
const IS_DEMO_MODE = SUPABASE_URL.includes('your-project-id.supabase.co');

if (IS_DEMO_MODE) {
    console.warn("Using Local Mock Data because Supabase is not configured.");

    const mockDB = {
        products: [
            { id: '1', name: 'Laptop Pro', sku: 'LAP-001', category_id: 'c1', quantity: 15, min_stock_level: 5, unit_price: 1200, status: 'active', categories: { name: 'Electronics', color: '#3B82F6' }, suppliers: { name: 'TechCorp' } },
            { id: '2', name: 'Wireless Mouse', sku: 'MOU-002', category_id: 'c1', quantity: 3, min_stock_level: 10, unit_price: 25, status: 'active', categories: { name: 'Electronics', color: '#3B82F6' }, suppliers: { name: 'TechCorp' } },
            { id: '3', name: 'Ergonomic Chair', sku: 'CHR-001', category_id: 'c2', quantity: 24, min_stock_level: 10, unit_price: 250, status: 'active', categories: { name: 'Furniture', color: '#10B981' }, suppliers: { name: 'OfficePlus' } }
        ],
        categories: [
            { id: 'c1', name: 'Electronics', color: '#3B82F6' },
            { id: 'c2', name: 'Furniture', color: '#10B981' }
        ],
        suppliers: [
            { id: 's1', name: 'TechCorp', email: 'contact@techcorp.com', phone: '555-0101' },
            { id: 's2', name: 'OfficePlus', email: 'sales@officeplus.com', phone: '555-0102' }
        ],
        inventory_transactions: [
            { id: 't1', product_id: '1', transaction_type: 'in', quantity: 15, reference_number: 'PO-1001', notes: 'Initial stock', created_at: new Date().toISOString(), products: { name: 'Laptop Pro', sku: 'LAP-001' } },
            { id: 't2', product_id: '2', transaction_type: 'in', quantity: 5, reference_number: 'PO-1002', notes: 'Restock', created_at: new Date().toISOString(), products: { name: 'Wireless Mouse', sku: 'MOU-002' } }
        ],
        profiles: [
            { id: 'mock-user-id', full_name: 'Demo Admin', role: 'admin', phone: '555-0199', created_at: new Date().toISOString() }
        ],
        low_stock_products: [
            { name: 'Wireless Mouse', sku: 'MOU-002', quantity: 3, min_stock_level: 10 }
        ]
    };

    class MockQuery {
        constructor(table) { this.table = table; this._count = false; this._single = false; this._filters = []; }
        select(cols, opts) { if (opts?.head) this._count = true; return this; }
        eq(col, val) { this._filters.push({ col, val }); return this; }
        order() { return this; }
        limit() { return this; }
        gte() { return this; }
        lte() { return this; }
        single() { this._single = true; return this; }
        maybeSingle() { this._single = true; return this; }
        insert(data) {
            if (Array.isArray(data)) mockDB[this.table].push(...data);
            else mockDB[this.table].push(data);
            return this;
        }
        update() { return this; }
        delete() { return this; }
        async then(resolve) {
            let data = mockDB[this.table] || [];
            for (let f of this._filters) {
                data = data.filter(item => item[f.col] === f.val);
            }
            if (this._count) resolve({ data: null, count: data.length, error: null });
            else if (this._single) resolve({ data: data[0] || null, error: null });
            else resolve({ data, error: null });
        }
    }

    supabase = {
        from: (table) => new MockQuery(table),
        auth: {
            getUser: async () => ({ data: { user: { id: 'mock-user-id', email: 'demo@inventorypro.com' } }, error: null }),
            getSession: async () => ({ data: { session: { user: { id: 'mock-user-id' } } }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: async () => ({ data: { user: { id: 'mock-user-id' } }, error: null }),
            signOut: async () => ({ error: null }),
            signUp: async () => ({ data: { user: { id: 'mock-user-id' } }, error: null })
        },
        channel: () => ({ on: () => ({ subscribe: () => { } }) }),
        rpc: () => ({ then: (res) => res({ data: [], error: null }) })
    };
} else {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
        });
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        supabase = null;
    }
}

export { supabase, SUPABASE_URL, SUPABASE_ANON_KEY, IS_DEMO_MODE };
