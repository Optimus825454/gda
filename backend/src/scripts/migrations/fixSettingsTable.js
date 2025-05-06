/**
 * fixSettingsTable.js - Settings tablosunu du00fczeltir
 * Eksik 'group' su00fctununu ekler
 */

require('dotenv').config();
const { supabase } = require('../../config/supabaseClient');

const fixSettingsTable = async () => {
    try {
        console.log('Settings tablosu kontrol ediliyor...');
        
        // Tablo var mu0131 kontrol et
        const { data: existingTable, error: tableError } = await supabase
            .from('settings')
            .select('count')
            .limit(1);
            
        if (tableError) {
            if (tableError.code === '42P01') {
                console.log('Settings tablosu bulunamadu0131, oluu015fturulamadu0131.');
                
                // Tabloyu oluu015fturmak iu00e7in SQL
                const createTableSQL = `
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    type TEXT NOT NULL DEFAULT 'string',
    group TEXT NOT NULL DEFAULT 'genel',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
`;
                
                console.log('Lu00fctfen Supabase yu00f6netim panelinden au015fau011fu0131daki SQL sorgusunu u00e7alu0131u015ftu0131ru0131n:');
                console.log(createTableSQL);
                
                // Varsayu0131lan ayarlaru0131 eklemek iu00e7in SQL
                console.log('\nVarsayu0131lan ayarlaru0131 eklemek iu00e7in:');
                console.log(`
INSERT INTO public.settings (key, value, type, group, description, is_public)
VALUES 
('site.title', 'GDA FlowSystems', 'string', 'genel', 'Site bau015flu0131u011fu0131', true),
('site.description', 'Hayvancu0131lu0131k Yu00f6netim Sistemi', 'string', 'genel', 'Site au00e7u0131klamasu0131', true),
('animal.default_status', 'ACTIVE', 'string', 'hayvan', 'Varsayu0131lan hayvan durumu', false),
('system.maintenance_mode', 'false', 'boolean', 'sistem', 'Baku0131m modu', true)
ON CONFLICT (key) DO NOTHING;
`);
                
                return false;
            } else if (tableError.code === '42501') {
                console.error('Settings tablosuna eriu015fim izni yok:', tableError);
                console.log('Lu00fctfen Supabase yu00f6netim panelinden RLS (Row Level Security) ayarlaru0131nu0131 kontrol edin.');
                console.log('\nSettings tablosu iu00e7in RLS\'yi devre du0131u015fu0131 bu0131rakmak iu00e7in:');
                console.log('ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;');
                return false;
            } else {
                console.error('Tablo kontrolu00fc su0131rasu0131nda hata:', tableError);
                return false;
            }
        }
        
        // Tablo var, 'group' su00fctunu var mu0131 kontrol et
        try {
            console.log('Group su00fctunu kontrol ediliyor...');
            
            // Group su00fctununu sorgulayarak kontrol et
            const { data: groupCheck, error: groupError } = await supabase
                .from('settings')
                .select('group')
                .limit(1);
                
            if (groupError && groupError.message && groupError.message.includes('does not exist')) {
                console.log('Group su00fctunu bulunamadu0131, eklenmesi gerekiyor.');
                
                // Group su00fctununu eklemek iu00e7in SQL
                const alterTableSQL = `ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "group" TEXT NOT NULL DEFAULT 'genel';`;
                
                console.log('Lu00fctfen Supabase yu00f6netim panelinden au015fau011fu0131daki SQL sorgusunu u00e7alu0131u015ftu0131ru0131n:');
                console.log(alterTableSQL);
                
                return false;
            } else if (groupError) {
                console.error('Group su00fctunu kontrolu00fc su0131rasu0131nda hata:', groupError);
                return false;
            } else {
                console.log('Group su00fctunu zaten mevcut');
                return true;
            }
        } catch (error) {
            console.error('Group su00fctunu kontrolu00fc su0131rasu0131nda beklenmeyen hata:', error);
            return false;
        }
        
    } catch (error) {
        console.error('Settings tablosu du00fczeltme hatasu0131:', error);
        return false;
    }
};

// Script dou011frudan u00e7alu0131u015ftu0131ru0131ldu0131u011fu0131nda tabloyu du00fczelt
if (require.main === module) {
    fixSettingsTable()
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

module.exports = { fixSettingsTable };