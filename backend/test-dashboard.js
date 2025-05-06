require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function testAnimalCount() {
    try {
        console.log('Supabase URL:', process.env.SUPABASE_URL);
        console.log('API Key var mı:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        const { data, error } = await supabaseAdmin
            .from('animals')
            .select('id, category, status, purpose, sale_status, pregnancy_status')
            .limit(5);

        if (error) {
            console.error('Supabase sorgu hatası:', error);
            return;
        }

        console.log('Hayvan sayısı (ilk 5):', data?.length || 0);
        console.log('Hayvan verileri:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Test hatası:', err);
    }
}

testAnimalCount(); 