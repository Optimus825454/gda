/**
 * fixPermissionsTable.js
 * u0130zinler tablosundaki eksik 'module' su00fctununu ekler
 */

require('dotenv').config();
const { supabase } = require('../../config/supabaseClient');

async function fixPermissionsTable() {
    try {
        console.log('Permissions tablosu kontrol ediliyor...');
        
        // u00d6nce permissions tablosunun var olup olmadu0131u011fu0131nu0131 kontrol et
        const { data: existingTable, error: tableError } = await supabase
            .from('permissions')
            .select('count')
            .limit(1);
            
        if (tableError) {
            if (tableError.code === '42P01') {
                console.log('Permissions tablosu bulunamadu0131, oluu015fturulamadu0131.');
                
                // Tabloyu oluu015fturmak iu00e7in SQL
                const createTableSQL = `
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    module TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS politikalaru0131nu0131 devre du0131u015fu0131 bu0131rak
ALTER TABLE public.permissions DISABLE ROW LEVEL SECURITY;
`;
                
                console.log('Lu00fctfen Supabase yu00f6netim panelinden au015fau011fu0131daki SQL sorgusunu u00e7alu0131u015ftu0131ru0131n:');
                console.log(createTableSQL);
                
                return false;
            } else if (tableError.code === '42501') {
                console.error('Permissions tablosuna eriu015fim izni yok:', tableError);
                console.log('Lu00fctfen Supabase yu00f6netim panelinden RLS (Row Level Security) ayarlaru0131nu0131 kontrol edin.');
                console.log('\nPermissions tablosu iu00e7in RLS\'yi devre du0131u015fu0131 bu0131rakmak iu00e7in:');
                console.log('ALTER TABLE public.permissions DISABLE ROW LEVEL SECURITY;');
                return false;
            } else {
                console.error('Tablo kontrolu00fc su0131rasu0131nda hata:', tableError);
                return false;
            }
        }
        
        // Tablo var, 'module' su00fctunu var mu0131 kontrol et
        try {
            console.log('Module su00fctunu kontrol ediliyor...');
            
            // Module su00fctununu sorgulayarak kontrol et
            const { data: moduleCheck, error: moduleError } = await supabase
                .from('permissions')
                .select('module')
                .limit(1);
                
            if (moduleError && moduleError.message && moduleError.message.includes('does not exist')) {
                console.log('Module su00fctunu bulunamadu0131, eklenmesi gerekiyor.');
                
                // Module su00fctununu eklemek iu00e7in SQL
                const alterTableSQL = `ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS module VARCHAR(50) DEFAULT 'general';`;
                
                console.log('Lu00fctfen Supabase yu00f6netim panelinden au015fau011fu0131daki SQL sorgusunu u00e7alu0131u015ftu0131ru0131n:');
                console.log(alterTableSQL);
                
                return false;
            } else if (moduleError) {
                console.error('Module su00fctunu kontrolu00fc su0131rasu0131nda hata:', moduleError);
                return false;
            } else {
                console.log('Module su00fctunu zaten mevcut');
                
                // NULL module deu011ferlerini gu00fcncelleme SQL'i
                console.log('\nNULL module deu011ferlerini gu00fcncellemek iu00e7in:');
                console.log(`
-- u0130zin koduna gu00f6re modu00fcl belirle
UPDATE public.permissions SET module = 'general' WHERE module IS NULL;
UPDATE public.permissions SET module = 'pages' WHERE module IS NULL AND code LIKE '%PAGE%';
UPDATE public.permissions SET module = 'animals' WHERE module IS NULL AND code LIKE '%ANIMAL%';
UPDATE public.permissions SET module = 'users' WHERE module IS NULL AND code LIKE '%USER%';
UPDATE public.permissions SET module = 'roles' WHERE module IS NULL AND code LIKE '%ROLE%';
UPDATE public.permissions SET module = 'settings' WHERE module IS NULL AND code LIKE '%SETTING%';
UPDATE public.permissions SET module = 'shelters' WHERE module IS NULL AND (code LIKE '%SHELTER%' OR code LIKE '%PADDOCK%');
UPDATE public.permissions SET module = 'health' WHERE module IS NULL AND (code LIKE '%TEST%' OR code LIKE '%HEALTH%');
UPDATE public.permissions SET module = 'sales' WHERE module IS NULL AND (code LIKE '%SALE%' OR code LIKE '%LOGISTICS%');
`);
                
                return true;
            }
        } catch (error) {
            console.error('Module su00fctunu kontrolu00fc su0131rasu0131nda beklenmeyen hata:', error);
            return false;
        }
        
    } catch (error) {
        console.error('Permissions tablosu gu00fcncellenirken hata:', error);
        return false;
    }
}

// Script dou011frudan u00e7alu0131u015ftu0131ru0131ldu0131u011fu0131nda
if (require.main === module) {
    fixPermissionsTable()
        .then(result => {
            if (result) {
                console.log('u0130u015flem bau015faru0131yla tamamlandu0131.');
                process.exit(0);
            } else {
                console.error('u0130u015flem su0131rasu0131nda hata oluu015ftu.');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('Beklenmeyen hata:', error);
            process.exit(1);
        });
}

module.exports = { fixPermissionsTable };