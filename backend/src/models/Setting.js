/**
 * Setting.js - Sistem ayarları veri modeli
 * Çeşitli sistem ayarlarını yönetmek için kullanılır
 * ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
 */

const { supabase } = require('../config/supabaseClient');

class Setting {
    constructor( {
        id,
        key,
        value,
        type,
        group,
        description,
        isPublic = false,
        createdAt,
        updatedAt
    } ) {
        this.id = id;
        this.key = key; // Ayar anahtarı (örn: "site.title")
        this.value = value; // Ayarın değeri (farklı veri tipleri olabilir)
        this.type = type; // Değer tipi (string, number, boolean, json, array)
        this.group = group; // Ayarların gruplandırılması (örn: "genel", "hayvan", "satış")
        this.description = description; // Ayarın açıklaması
        this.isPublic = isPublic; // Genel erişime açık mı? (ön yüzden erişilebilir)
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Veritabanı kaydından Setting nesnesi oluşturur
    static fromDatabase( dbSetting ) {
        let parsedValue = dbSetting.value;

        try {
            // Değer tipine göre uygun çevirme işlemini yap
            switch ( dbSetting.type ) {
                case 'number':
                    parsedValue = Number( dbSetting.value );
                    break;
                case 'boolean':
                    parsedValue = dbSetting.value === 'true' || dbSetting.value === true;
                    break;
                case 'json':
                case 'array':
                    parsedValue = JSON.parse( dbSetting.value );
                    break;
            }
        } catch ( error ) {
            console.error( `Ayar değeri dönüştürülürken hata: ${error.message}` );
            // Hata durumunda orijinal değeri kullan
        }

        return new Setting( {
            id: dbSetting.id,
            key: dbSetting.key,
            value: parsedValue,
            type: dbSetting.type,
            group: dbSetting.group,
            description: dbSetting.description,
            isPublic: dbSetting.is_public,
            createdAt: dbSetting.created_at,
            updatedAt: dbSetting.updated_at
        } );
    }

    // Setting nesnesini veritabanı formatına dönüştürür
    toDatabase() {
        let stringValue = this.value;

        // Değer tipine göre string'e dönüştür
        if ( this.type === 'json' || this.type === 'array' ) {
            stringValue = JSON.stringify( this.value );
        } else if ( this.type === 'boolean' || this.type === 'number' ) {
            stringValue = String( this.value );
        }

        return {
            id: this.id,
            key: this.key,
            value: stringValue,
            type: this.type,
            group: this.group,
            description: this.description,
            is_public: this.isPublic,
            created_at: this.createdAt || new Date(),
            updated_at: new Date()
        };
    }

    // Tüm ayarları listele
    static async findAll( options = {} ) {
        try {
            try {
                let query = supabase
                    .from( 'settings' )
                    .select( '*' )
                    .order( 'key', { ascending: true } );
                    
                // group sütunu varsa, ona göre sırala
                try {
                    query = query.order( 'group', { ascending: true } );
                } catch (groupError) {
                    console.warn('Settings tablosunda group sütunu bulunamadı, sıralama key\'e göre yapılacak');
                }

                // Gruba göre filtreleme
                if ( options.group ) {
                    try {
                        query = query.eq( 'group', options.group );
                    } catch (groupError) {
                        console.warn('Settings tablosunda group sütunu bulunamadı, grup filtreleme atlanıyor');
                        console.warn('Lütfen db:fix-settings komutunu çalıştırın');
                    }
                }

                // Erişim seviyesine göre filtreleme
                if ( options.isPublic !== undefined ) {
                    query = query.eq( 'is_public', options.isPublic );
                }

                // Anahtar filtreleme (prefix ile)
                if ( options.keyPrefix ) {
                    query = query.ilike( 'key', `${options.keyPrefix}%` );
                }

                const { data: settings, error } = await query;

                if ( error ) {
                    // Tablo bulunamadı hatası için özel işlem
                    if (error.code === '42P01' || error.code === '42501') {
                        console.error('Settings tablosu bulunamadı veya erişim reddedildi:', error.message);
                        // Varsayılan boş dizi döndür
                        return [];
                    }
                    throw error;
                }

                return settings.map( s => Setting.fromDatabase( s ) );
            } catch (dbError) {
                console.error('Veritabanı hatası, varsayılan ayarlar kullanılacak:', dbError);
                // Varsayılan ayarları döndür
                return [
                    new Setting({
                        id: '1',
                        key: 'site.title',
                        value: 'GDA FlowSystems',
                        type: 'string',
                        group: 'genel',
                        description: 'Site başlığı',
                        isPublic: true,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }),
                    new Setting({
                        id: '2',
                        key: 'system.version',
                        value: '1.0.0',
                        type: 'string',
                        group: 'sistem',
                        description: 'Sistem versiyonu',
                        isPublic: true,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    })
                ];
            }
        } catch ( error ) {
            console.error( 'Ayarlar listelenirken hata:', error );
            return []; // Hata durumunda boş dizi döndür
        }
    }

    // ID'ye göre ayar bulma
    static async findById( id ) {
        try {
            const { data: setting, error } = await supabase
                .from( 'settings' )
                .select( '*' )
                .eq( 'id', id )
                .single();

            if ( error ) {
                // Tablo bulunamadı hatası için özel işlem
                if (error.code === '42P01') {
                    console.error('Settings tablosu bulunamadı:', error.message);
                    throw new Error(`Settings tablosu bulunamadı: ${error.message}`);
                }
                throw error;
            }
            if ( !setting ) throw new Error( `ID'si ${id} olan ayar bulunamadı` );

            return Setting.fromDatabase( setting );
        } catch ( error ) {
            console.error( `ID'ye göre ayar bulunurken hata:`, error );
            throw error;
        }
    }

    // Anahtar'a göre ayar bulma
    static async findByKey( key ) {
        try {
            const { data: setting, error } = await supabase
                .from( 'settings' )
                .select( '*' )
                .eq( 'key', key )
                .single();

            if ( error ) {
                // Kayıt bulunamadı hatası değilse
                if (error.code !== 'PGRST116') {
                    // Tablo bulunamadı hatası için özel işlem
                    if (error.code === '42P01') {
                        console.error('Settings tablosu bulunamadı:', error.message);
                        return null;
                    }
                    throw error;
                }
            }
            if ( !setting ) return null;

            return Setting.fromDatabase( setting );
        } catch ( error ) {
            console.error( 'Anahtara göre ayar bulunurken hata:', error );
            throw error;
        }
    }

    // Grup tarafından ayarları bulma
    static async findByGroup( group ) {
        try {
            const { data: settings, error } = await supabase
                .from( 'settings' )
                .select( '*' )
                .eq( 'group', group )
                .order( 'key' );

            if ( error ) {
                // Tablo bulunamadı hatası için özel işlem
                if (error.code === '42P01') {
                    console.error('Settings tablosu bulunamadı:', error.message);
                    return [];
                }
                throw error;
            }

            return settings.map( s => Setting.fromDatabase( s ) );
        } catch ( error ) {
            console.error( 'Gruba göre ayarlar bulunurken hata:', error );
            throw error;
        }
    }

    // Grupları listele (benzersiz grup adları)
    static async getAllGroups() {
        try {
            // Veritabanı tablosu henüz oluşturulmamış olabilir, bu durumda varsayılan grupları döndür
            try {
                const { data, error } = await supabase
                    .from( 'settings' )
                    .select( 'group' )
                    .order( 'group' );

                if (error) {
                    console.warn('Settings tablosu sorgulanırken hata, varsayılan gruplar kullanılacak:', error.message);
                    return ['genel', 'sistem', 'hayvan', 'kullanıcı', 'finans'];
                }

                // Tekrar eden grup adlarını filtrele
                const uniqueGroups = [...new Set( data.map( s => s.group ) )];
                return uniqueGroups.length > 0 ? uniqueGroups : ['genel', 'sistem', 'hayvan', 'kullanıcı', 'finans'];
            } catch (dbError) {
                console.error('Veritabanı hatası, varsayılan gruplar kullanılacak:', dbError);
                return ['genel', 'sistem', 'hayvan', 'kullanıcı', 'finans'];
            }
        } catch ( error ) {
            console.error( 'Gruplar listelenirken hata:', error );
            return ['genel', 'sistem', 'hayvan', 'kullanıcı', 'finans']; // Hata durumunda varsayılan grupları döndür
        }
    }

    // Yeni ayar oluştur
    static async create( {
        key,
        value,
        type = 'string',
        group = 'genel',
        description = '',
        isPublic = false
    } ) {
        try {
            // Gerekli alan kontrolü
            if ( !key ) {
                throw new Error( 'Ayar anahtarı zorunludur' );
            }

            // Anahtar benzersiz mi kontrol et
            const existingSetting = await Setting.findByKey( key );
            if ( existingSetting ) {
                throw new Error( `'${key}' anahtarlı ayar zaten mevcut` );
            }

            // Değer tipini doğrula
            if ( !['string', 'number', 'boolean', 'json', 'array'].includes( type ) ) {
                throw new Error( 'Geçersiz değer tipi. Geçerli tipler: string, number, boolean, json, array' );
            }

            // Değeri tipe göre formatla
            let formattedValue = value;
            if ( type === 'json' || type === 'array' ) {
                if ( typeof value !== 'string' ) {
                    formattedValue = JSON.stringify( value );
                }
            } else if ( type === 'boolean' || type === 'number' ) {
                formattedValue = String( value );
            }

            // Ayar oluştur
            const { data: setting, error } = await supabase
                .from( 'settings' )
                .insert( {
                    key,
                    value: formattedValue,
                    type,
                    group,
                    description,
                    is_public: isPublic,
                    created_at: new Date(),
                    updated_at: new Date()
                } )
                .select()
                .single();

            if ( error ) {
                // Tablo bulunamadı hatası için özel işlem
                if (error.code === '42P01') {
                    console.error('Settings tablosu bulunamadı:', error.message);
                    throw new Error(`Settings tablosu bulunamadı: ${error.message}`);
                }
                throw error;
            }

            return Setting.fromDatabase( setting );        } catch ( error ) {
            console.error( 'Ayar oluşturulurken hata:', error );
            throw error;
        }
    }

    // Ayar silme
    static async delete( id ) {
        try {
            // Gerekli alan kontrolü
            if ( !id ) {
                throw new Error( 'Ayar ID zorunludur' );
            }

            // Ayarı sil
            const { error } = await supabase
                .from( 'settings' )
                .delete()
                .eq( 'id', id );

            if ( error ) {
                // Tablo bulunamadı hatası için özel işlem
                if (error.code === '42P01') {
                    console.error('Settings tablosu bulunamadı:', error.message);
                    throw new Error(`Settings tablosu bulunamadı: ${error.message}`);
                }
                throw error;
            }

            return true;        } catch ( error ) {
            console.error( 'Ayar silinirken hata:', error );
            throw error;
        }
    }

    // Anahtar ile ayar değerini al
    static async getValue( key, defaultValue = null ) {
        try {
            const setting = await Setting.findByKey( key );
            return setting ? setting.value : defaultValue;
        } catch ( error ) {
            console.error( 'Ayar değeri alınırken hata:', error );
            return defaultValue;
        }
    }

    // Anahtar ile ayar değerini güncelle (varsa güncelle, yoksa oluştur)
    static async setValue( key, value, options = {} ) {
        try {
            const existingSetting = await Setting.findByKey( key );

            if ( existingSetting ) {
                // Mevcut ayarı güncelle
                existingSetting.value = value;
                return await existingSetting.save();
            } else {
                // Yeni ayar oluştur
                return await Setting.create( {
                    key,
                    value,
                    type: options.type || 'string',
                    group: options.group || 'genel',
                    description: options.description || '',
                    isPublic: options.isPublic || false
                } );
            }
        } catch ( error ) {
            console.error( 'Ayar değeri güncellenirken hata:', error );
            throw error;
        }
    }

    // Birden fazla ayarı toplu güncelle
    static async bulkUpdate( settings ) {
        try {
            if ( !Array.isArray( settings ) || settings.length === 0 ) {
                throw new Error( 'Geçerli ayar dizisi gereklidir' );
            }

            const results = [];

            // Her ayarı tek tek güncelle
            for ( const setting of settings ) {
                if ( !setting.key ) continue;

                try {
                    const updatedSetting = await Setting.setValue(
                        setting.key,
                        setting.value,
                        {
                            type: setting.type,
                            group: setting.group,
                            description: setting.description,
                            isPublic: setting.isPublic
                        }
                    );

                    results.push( {
                        key: setting.key,
                        success: true,
                        data: updatedSetting
                    } );
                } catch ( error ) {
                    results.push( {
                        key: setting.key,
                        success: false,
                        error: error.message
                    } );
                }
            }

            return results;
        } catch ( error ) {
            console.error( 'Ayarlar toplu güncellenirken hata:', error );
            throw error;
        }
    }

    // Tüm genel (public) ayarları getir
    static async getPublicSettings() {
        try {
            const settings = await Setting.findAll( { isPublic: true } );

            // Anahtar-değer formatında bir nesne oluştur
            const publicSettings = {};
            settings.forEach( setting => {
                publicSettings[setting.key] = setting.value;
            } );

            return publicSettings;
        } catch ( error ) {
            console.error( 'Genel ayarlar alınırken hata:', error );
            throw error;
        }
    }

    // API yanıtı için formatlama
    toJSON() {
        return {
            id: this.id,
            key: this.key,
            value: this.value,
            type: this.type,
            group: this.group,
            description: this.description,
            isPublic: this.isPublic,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Setting;