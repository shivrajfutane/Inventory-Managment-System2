import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rpybiwuxbqnyaulhayso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJweWJpd3V4YnFueWF1bGhheXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0OTkxMzgsImV4cCI6MjA5ODA3NTEzOH0.1yfbZWdqScsaEyK0CodjaYP-BGkI-oOJRHo1n38Rvxc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('--- PRODUCTS with image_url ---');
    const { data, error } = await supabase.from('products').select('image_url');
    if (error) {
        console.error('Error fetching image_url:', error);
    } else {
        console.log('Successfully fetched, rows count:', data.length);
    }
}

main();
