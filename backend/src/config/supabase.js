/**
 * Supabase API bau011flantu0131su0131 - Admin iu015flemleri iu00e7in
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase admin bau011flantu0131 bilgileri eksik. Lu00fctfen .env dosyasu0131nu0131 kontrol edin.');
    process.exit(1);
}

// Admin yetkilerine sahip Supabase istemcisi oluu015ftur
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Admin auth client
const adminAuthClient = supabaseAdmin.auth.admin;

module.exports = { supabaseAdmin, adminAuthClient };