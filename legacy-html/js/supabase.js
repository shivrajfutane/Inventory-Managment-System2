/**
 * ============================================================
 * SUPABASE CONFIGURATION & CLIENT SETUP
 * ============================================================
 * This file initializes the Supabase client and exports it
 * for use throughout the application.
 * 
 * IMPORTANT: Replace these values with your own Supabase
 * project credentials from your Supabase Dashboard.
 * 
 * To get your credentials:
 * 1. Go to https://app.supabase.com
 * 2. Select your project
 * 3. Go to Project Settings > API
 * 4. Copy the URL and anon/public key
 * ============================================================
 */

// ====== CONFIGURATION - REPLACE WITH YOUR CREDENTIALS ======
const SUPABASE_URL = 'https://rpybiwuxbqnyaulhayso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJweWJpd3V4YnFueWF1bGhheXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0OTkxMzgsImV4cCI6MjA5ODA3NTEzOH0.1yfbZWdqScsaEyK0CodjaYP-BGkI-oOJRHo1n38Rvxc';
// ============================================================

/**
 * Initialize and export the Supabase client
 * This creates a single instance that can be imported
 * by all other modules in the application.
 */
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
        if (typeof supabaseJs === 'undefined') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
                db: { schema: 'public' }
            });
        } else {
            supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
            });
        }
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        supabase = null;
    }
}

/**
 * Get the current authenticated user
 * @returns {Promise<Object|null>} The user object or null if not authenticated
 */
async function getCurrentUser() {
    try {
        if (!supabase) return null;
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

/**
 * Get the current session
 * @returns {Promise<Object|null>} The session object or null
 */
async function getSession() {
    try {
        if (!supabase) return null;
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} Unsubscribe function
 */
function onAuthStateChange(callback) {
    if (!supabase) return () => { };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
            callback(event, session);
        }
    );

    return () => subscription.unsubscribe();
}

/**
 * Sign out the current user
 * @returns {Promise<Object>} Result of sign out operation
 */
async function signOut() {
    try {
        if (!supabase) throw new Error('Supabase not initialized');
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error signing out:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Upload a file to Supabase Storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path within bucket
 * @param {File} file - File to upload
 * @returns {Promise<Object>} Upload result with data or error
 */
async function uploadFile(bucket, path, file) {
    try {
        if (!supabase) throw new Error('Supabase not initialized');

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return { success: true, data, publicUrl };
    } catch (error) {
        console.error('Error uploading file:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a file from Supabase Storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path within bucket
 * @returns {Promise<Object>} Delete result
 */
async function deleteFile(bucket, path) {
    try {
        if (!supabase) throw new Error('Supabase not initialized');

        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error deleting file:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get a public URL for a file
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path within bucket
 * @returns {string} Public URL
 */
function getPublicUrl(bucket, path) {
    if (!supabase) return '';

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

    return publicUrl;
}

/**
 * Subscribe to real-time changes on a table
 * @param {string} table - Table name to watch
 * @param {string} event - Event type: '*', 'INSERT', 'UPDATE', 'DELETE'
 * @param {Function} callback - Function to call when changes occur
 * @param {string} filter - Optional filter string
 * @returns {Object} Channel subscription
 */
function subscribeToTable(table, event = '*', callback, filter = null) {
    if (!supabase) return null;

    let channel = supabase
        .channel(`${table}-changes`)
        .on(
            'postgres_changes',
            { event, schema: 'public', table, filter },
            (payload) => {
                callback(payload);
            }
        );

    channel.subscribe();
    return channel;
}

/**
 * Test the Supabase connection
 * @returns {Promise<boolean>} True if connected
 */
async function testConnection() {
    try {
        if (!supabase) return false;
        const { error } = await supabase.from('categories').select('count', { count: 'exact', head: true });
        return !error;
    } catch {
        return false;
    }
}

// Export all functions for use in other modules
export {
    supabase,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    getCurrentUser,
    getSession,
    onAuthStateChange,
    signOut,
    uploadFile,
    deleteFile,
    getPublicUrl,
    subscribeToTable,
    testConnection
};
