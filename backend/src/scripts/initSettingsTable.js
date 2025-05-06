/**
 * initSettingsTable.js - Settings tablosunu oluşturur ve varsayılan ayarları ekler
 */

require('dotenv').config();
const { supabase } = require('../config/supabaseClient');

const createSettingsTable = async () => {
    try {
        console.log('Settings tablosu kontrol ediliyor...');
        
        // Tablo var mı kontrol et
        const { data: existingTable, error: tableError } = await supabase
            .from('settings')
            .select('count')
            .limit(1);
            
        if (tableError && tableError.code === '42P01') {
            console.log('Settings tablosu bulunamadı, oluşturuluyor...');
            
            // Doğrudan SQL sorgusu çalıştırmak yerine, Supabase'in tablo oluşturma API'sini kullanıyoruz
            // Önce settings tablosunu oluştur
            const { error: createError } = await supabase
                .from('settings')
                .insert([
                    {
                        key: 'system.initialized',
                        value: 'true',
                        type: 'boolean',
                        group: 'sistem',
                        description: 'Sistem başlatıldı',
                        is_public: false
                    }
                ]);
            
            if (createError && createError.code === '42P01') {
                console.log('Tablo otomatik olarak oluşturulamadı, manuel oluşturma gerekiyor.');
                console.log('Lütfen Supabase yönetim panelinden settings tablosunu oluşturun:');
                console.log(`
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
                `);
                
                // Geçici olarak başarılı kabul edelim, kullanıcı tabloyu manuel oluşturacak
                console.log('Uygulama başlatılıyor, ancak settings tablosu oluşturulana kadar bazı özellikler çalışmayabilir.');
                return true;
            } else if (createError) {
                console.error('Tablo oluşturma hatası:', createError);
                return false;
            }
            
            console.log('Settings tablosu başarıyla oluşturuldu');
            
            // Varsayılan ayarları ekle
            await addDefaultSettings();
            
        } else if (tableError) {
            console.error('Tablo kontrolü sırasında hata:', tableError);
            // Hata olsa bile devam edelim
            console.log('Tablo kontrolünde hata oluştu, ancak uygulama başlatılıyor.');
            return true;
        } else {
            console.log('Settings tablosu zaten mevcut');
            
            // Tablo boş mu kontrol et
            const { count } = existingTable[0] || { count: 0 };
            
            if (count === 0) {
                console.log('Settings tablosu boş, varsayılan ayarlar ekleniyor...');
                await addDefaultSettings();
            }
        }
        
        console.log('Settings tablosu hazır');
        return true;
        
    } catch (error) {
        console.error('Settings tablosu oluşturma hatası:', error);
        // Hata olsa bile uygulamayı başlatalım
        console.log('Hata oluştu, ancak uygulama başlatılıyor.');
        return true;
    }
};

const addDefaultSettings = async () => {
    try {
        const defaultSettings = [
            {
                key: 'site.title',
                value: 'GDA FlowSystems',
                type: 'string',
                group: 'genel',
                description: 'Site başlığı',
                is_public: true
            },
            {
                key: 'site.description',
                value: 'Hayvancılık Yönetim Sistemi',
                type: 'string',
                group: 'genel',
                description: 'Site açıklaması',
                is_public: true
            },
            {
                key: 'animal.default_status',
                value: 'ACTIVE',
                type: 'string',
                group: 'hayvan',
                description: 'Varsayılan hayvan durumu',
                is_public: false
            },
            {
                key: 'system.maintenance_mode',
                value: 'false',
                type: 'boolean',
                group: 'sistem',
                description: 'Bakım modu',
                is_public: true
            }
        ];
        
        for (const setting of defaultSettings) {
            const { error } = await supabase
                .from('settings')
                .upsert(setting, { onConflict: 'key' });
                
            if (error) {
                console.error(`Ayar eklenirken hata (${setting.key}):`, error);
            }
        }
        
        console.log('Varsayılan ayarlar eklendi');
        return true;
        
    } catch (error) {
        console.error('Varsayılan ayarlar eklenirken hata:', error);
        return false;
    }
};

// Script doğrudan çalıştırıldığında tabloyu oluştur
if (require.main === module) {
    createSettingsTable()
        .then(result => {
            if (result) {
                console.log('İşlem başarılı');
                process.exit(0);
            } else {
                console.error('İşlem başarısız');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('Beklenmeyen hata:', error);
            process.exit(1);
        });
}

module.exports = { createSettingsTable, addDefaultSettings };