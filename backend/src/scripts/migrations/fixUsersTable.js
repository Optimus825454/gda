/**
 * fixUsersTable.js - Users tablosunu du00fczeltir
 * Eksik users tablosunu oluu015fturur veya eriu015fim sorunlaru0131nu0131 giderir
 */

require('dotenv').config();
const { supabase } = require('../../config/supabaseClient');

const fixUsersTable = async () => {
    try {
        console.log('Users tablosu kontrol ediliyor...');
        
        // Tablo var mu0131 kontrol et
        const { data: existingTable, error: tableError } = await supabase
            .from('users')
            .select('count')
            .limit(1);
            
        if (tableError) {
            if (tableError.code === '42P01') {
                console.log('Users tablosu bulunamadu0131, oluu015fturulamadu0131.');
                
                // Tabloyu oluu015fturmak iu00e7in SQL
                const createTableSQL = `
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS politikalaru0131nu0131 devre du0131u015fu0131 bu0131rak
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
`;
                
                console.log('Lu00fctfen Supabase yu00f6netim panelinden au015fau011fu0131daki SQL sorgusunu u00e7alu0131u015ftu0131ru0131n:');
                console.log(createTableSQL);
                
                return false;
            } else if (tableError.code === '42501') {
                console.error('Users tablosuna eriu015fim izni yok:', tableError);
                console.log('Lu00fctfen Supabase yu00f6netim panelinden RLS (Row Level Security) ayarlaru0131nu0131 kontrol edin.');
                console.log('\nUsers tablosu iu00e7in RLS\'yi devre du0131u015fu0131 bu0131rakmak iu00e7in:');
                console.log('ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
                return false;
            } else {
                console.error('Tablo kontrolu00fc su0131rasu0131nda hata:', tableError);
                return false;
            }
        }
        
        console.log('Users tablosu zaten mevcut');
        return true;
        
    } catch (error) {
        console.error('Users tablosu du00fczeltme hatasu0131:', error);
        return false;
    }
};



// Script dou011frudan u00e7alu0131u015ftu0131ru0131ldu0131u011fu0131nda tabloyu du00fczelt
if (require.main === module) {
    fixUsersTable()
        .then(result => {
            if (result) {
                console.log('u0130u015flem bau015faru0131lu0131');
                process.exit(0);
            } else {
                console.error('u0130u015flem bau015faru0131su0131z');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('Beklenmeyen hata:', error);
            process.exit(1);
        });
}

module.exports = { fixUsersTable };