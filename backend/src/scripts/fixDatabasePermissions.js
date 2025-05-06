/**
 * fixDatabasePermissions.js - Veritabanu0131 izin sorunlaru0131nu0131 du00fczeltir
 * Tu00fcm tablolar iu00e7in izin sorunlaru0131nu0131 kontrol eder ve du00fczeltme yu00f6nergelerini gu00f6sterir
 */

require('dotenv').config();
const { supabase, testConnection, testTableAccess, testServiceRolePermissions } = require('../config/supabaseClientImproved');

// Kontrol edilecek tablolar listesi
const TABLES_TO_CHECK = [
    'settings',
    'user_roles',
    'user_profiles',
    'permissions',
    'animals',
    'paddocks',
    'shelters',
    'sales',
    'users' // Users tablosunu ekledik
];

const fixDatabasePermissions = async () => {
    try {
        console.log('Veritabanu0131 bau011flantu0131su0131 ve izinler kontrol ediliyor...');
        
        // u00d6nce bau011flantu0131yu0131 test et
        const connectionResult = await testConnection();
        if (!connectionResult.success) {
            console.error('Veritabanu0131 bau011flantu0131 hatasu0131:', connectionResult.error);
            console.log('Lu00fctfen .env dosyasu0131ndaki Supabase bau011flantu0131 bilgilerini kontrol edin.');
            return false;
        }
        
        console.log('Veritabanu0131 bau011flantu0131su0131 bau015faru0131lu0131!');
        
        // API anahtaru0131 tu00fcru00fcnu00fc kontrol et
        const apiKeyResult = await testServiceRolePermissions();
        if (!apiKeyResult.success) {
            console.error('API anahtaru0131 sorunu:', apiKeyResult.message);
            console.log('Lu00fctfen .env dosyasu0131nda SUPABASE_SERVICE_ROLE_KEY deu011ferinin dou011fru olduu011funu kontrol edin.');
            console.log('Supabase yu00f6netim panelinden service_role anahtaru0131nu0131 kullanmanu0131z gerekiyor.');
            return false;
        }
        
        console.log('API anahtaru0131 dou011fru: Service Role kullanu0131lu0131yor');
        
        // Tablolaru0131 kontrol et
        const tableResults = {};
        const tablesWithIssues = [];
        
        for (const table of TABLES_TO_CHECK) {
            console.log(`${table} tablosu kontrol ediliyor...`);
            
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('count')
                    .limit(1);
                    
                if (error) {
                    if (error.code === '42P01') {
                        console.log(`${table} tablosu bulunamadu0131 (oluu015fturulmamu0131u015f olabilir).`);
                        tableResults[table] = {
                            exists: false,
                            accessible: false,
                            error: 'Tablo bulunamadu0131',
                            errorCode: error.code
                        };
                    } else if (error.code === '42501') {
                        console.error(`${table} tablosuna eriu015fim izni yok:`, error.message);
                        tableResults[table] = {
                            exists: true,
                            accessible: false,
                            error: 'Eriu015fim izni yok',
                            errorCode: error.code
                        };
                        tablesWithIssues.push(table);
                    } else {
                        console.error(`${table} tablosu kontrolu00fc su0131rasu0131nda hata:`, error);
                        tableResults[table] = {
                            exists: true,
                            accessible: false,
                            error: error.message,
                            errorCode: error.code
                        };
                        tablesWithIssues.push(table);
                    }
                } else {
                    console.log(`${table} tablosuna eriu015fim bau015faru0131lu0131!`);
                    tableResults[table] = {
                        exists: true,
                        accessible: true,
                        error: null
                    };
                }
            } catch (err) {
                console.error(`${table} tablosu kontrolu00fc su0131rasu0131nda beklenmeyen hata:`, err);
                tableResults[table] = {
                    exists: false,
                    accessible: false,
                    error: err.message
                };
                tablesWithIssues.push(table);
            }
        }
        
        // Sonuu00e7laru0131 gu00f6ster
        console.log('\n--- TABLO ERu0130u015eu0130M DURUMU ---');
        for (const table in tableResults) {
            const status = tableResults[table];
            if (status.accessible) {
                console.log(`u2705 ${table}: Eriu015filebilir`);
            } else if (!status.exists) {
                console.log(`u26a0ufe0f ${table}: Bulunamadu0131 (${status.errorCode || 'bilinmeyen hata'})`);
            } else {
                console.log(`u274c ${table}: Eriu015fim sorunu (${status.errorCode || 'bilinmeyen hata'})`);
            }
        }
        
        // Sorunlu tablolar iu00e7in u00e7u00f6zu00fcm u00f6nerileri
        if (tablesWithIssues.length > 0) {
            console.log('\n--- u00c7u00d6Zu00dcM u00d6NERu0130LERu0130 ---');
            console.log('Au015fau011fu0131daki tablolarda eriu015fim sorunlaru0131 tespit edildi. Bu sorunlaru0131 u00e7u00f6zmek iu00e7in:');
            console.log('1. Supabase yu00f6netim panelinde SQL editu00f6ru00fcnu00fc au00e7u0131n');
            console.log('2. Her tablo iu00e7in au015fau011fu0131daki SQL komutlaru0131nu0131 u00e7alu0131u015ftu0131ru0131n:\n');
            
            for (const table of tablesWithIssues) {
                console.log(`-- ${table} tablosu iu00e7in:`);
                console.log(`ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`);
                console.log(`-- VEYA alternatif olarak RLS politikasu0131 ekleyin:`);
                console.log(`CREATE POLICY "${table} tablosuna tam eriu015fim" ON public.${table}`);
                console.log(`    USING (true)`);
                console.log(`    WITH CHECK (true);\n`);
            }
            
            console.log('3. Deu011fiu015fiklikleri yaptu0131ktan sonra bu scripti tekrar u00e7alu0131u015ftu0131ru0131n.');
            return false;
        }
        
        console.log('\nTu00fcm tablolara eriu015fim sau011flandu0131, izinler dou011fru yapu0131landu0131ru0131lmu0131u015f gu00f6ru00fcnu00fcyor.');
        return true;
        
    } catch (error) {
        console.error('Veritabanu0131 izinleri kontrol edilirken beklenmeyen hata:', error);
        return false;
    }
};

// Script dou011frudan u00e7alu0131u015ftu0131ru0131ldu0131u011fu0131nda izinleri kontrol et
if (require.main === module) {
    fixDatabasePermissions()
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

module.exports = { fixDatabasePermissions };