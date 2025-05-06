/**
 * fixDatabasePermissionsSQL.js - Veritabanu0131 izin sorunlaru0131nu0131 du00fczeltmek iu00e7in SQL komutlaru0131 oluu015fturur
 */

require('dotenv').config();

// Kontrol edilecek tablolar listesi
const TABLES_TO_CHECK = [
    'users',
    'settings',
    'user_roles',
    'user_profiles',
    'permissions',
    'animals',
    'paddocks',
    'shelters',
    'sales',
    'role_permissions'
];

const generateFixSQL = () => {
    console.log('Veritabanu0131 izin sorunlaru0131nu0131 du00fczeltmek iu00e7in SQL komutlaru0131 oluu015fturuluyor...');
    console.log('\n--- VERITABANI u0130Zu0130N SORUNLARINI Du00dcZELTME SQL KOMUTLARI ---');
    console.log('Bu SQL komutlaru0131nu0131 Supabase yu00f6netim panelindeki SQL Editu00f6ru00fcnde u00e7alu0131u015ftu0131ru0131n:\n');
    
    // RLS politikalaru0131nu0131 devre du0131u015fu0131 bu0131rakan SQL komutlaru0131
    console.log('-- RLS politikalaru0131nu0131 devre du0131u015fu0131 bu0131rak');
    
    for (const table of TABLES_TO_CHECK) {
        console.log(`ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`);
    }
    
    console.log('\n-- Veya alternatif olarak her tablo iu00e7in au00e7u0131k RLS politikalaru0131 ekle');
    
    for (const table of TABLES_TO_CHECK) {
        console.log(`\n-- ${table} tablosu iu00e7in RLS politikasu0131`);
        console.log(`CREATE POLICY "${table}_policy" ON public.${table}`);
        console.log(`    USING (true)`);
        console.log(`    WITH CHECK (true);`);
    }
    
    console.log('\n-- Eksik tablolaru0131 oluu015ftur (eu011fer yoksa)');
    console.log(`
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    group_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
`);
    
    console.log('\n-- Kullanu0131cu0131 rolu00fc iliu015fkileri tablosu');
    console.log(`
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role_id)
);
`);
    
    console.log('\n-- Rol izin iliu015fkileri tablosu');
    console.log(`
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(role_id, permission_id)
);
`);
    
    console.log('\n-- u0130zinler tablosu');
    console.log(`
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    module TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
`);
    
    console.log('\n-- Roller tablosu');
    console.log(`
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
`);
    
    console.log('\n-- Kullanu0131cu0131 profilleri tablosu');
    console.log(`
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    position TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
`);
    
    console.log('\n-- Sistem yu00f6netici rolu00fc oluu015ftur');
    console.log(`
INSERT INTO public.roles (name, description, is_system)
VALUES ('System Admin', 'Sistem yu00f6neticisi - tu00fcm yetkilere sahip', true)
ON CONFLICT (name) DO NOTHING;
`);
    
    console.log('\n-- Temel izinleri oluu015ftur');
    console.log(`
INSERT INTO public.permissions (code, name, description, module)
VALUES 
('ADMIN', 'Tam Yu00f6netici Yetkisi', 'Tu00fcm sistem u00fczerinde tam yetki', 'system'),
('VIEW_USERS_PAGE', 'Kullanu0131cu0131lar Sayfasu0131nu0131 Gu00f6ru00fcntu00fcleme', 'Kullanu0131cu0131lar sayfasu0131nu0131 gu00f6ru00fcntu00fcleme yetkisi', 'pages'),
('VIEW_SETTINGS_PAGE', 'Ayarlar Sayfasu0131nu0131 Gu00f6ru00fcntu00fcleme', 'Ayarlar sayfasu0131nu0131 gu00f6ru00fcntu00fcleme yetkisi', 'pages'),
('VIEW_ANIMALS_PAGE', 'Hayvanlar Sayfasu0131nu0131 Gu00f6ru00fcntu00fcleme', 'Hayvanlar sayfasu0131nu0131 gu00f6ru00fcntu00fcleme yetkisi', 'pages')
ON CONFLICT (code) DO NOTHING;
`);
    
    console.log('\n-- Yu00f6netici rolu00fcne tu00fcm izinleri ekle');
    console.log(`
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM public.roles WHERE name = 'System Admin'), 
    id 
FROM public.permissions
ON CONFLICT DO NOTHING;
`);
    
    console.log('\n-- Kullanu0131cu0131ya yu00f6netici rolu00fc ekle (kullanu0131cu0131 ID nizi buraya yazu0131n)');
    console.log(`
-- Au015fau011fu0131daki sorguyu kendi kullanu0131cu0131 ID niz ile gu00fcncelleyin`);
    console.log(`INSERT INTO public.user_roles (user_id, role_id)
VALUES 
('05e394a5-85ad-45a0-9fee-608293a45ba7', (SELECT id FROM public.roles WHERE name = 'System Admin'))
ON CONFLICT DO NOTHING;
`);
    
    console.log('\n--- SQL KOMUTLARI SONU ---');
    console.log('Bu komutlaru0131 Supabase yu00f6netim panelindeki SQL Editu00f6ru00fcnde u00e7alu0131u015ftu0131rdu0131ktan sonra uygulamayu0131 yeniden bau015flatu0131n.');
};

// Script dou011frudan u00e7alu0131u015ftu0131ru0131ldu0131u011fu0131nda
if (require.main === module) {
    generateFixSQL();
}

module.exports = { generateFixSQL };