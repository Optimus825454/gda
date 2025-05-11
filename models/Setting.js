/**
 * Setting.js - Sistem ayarları veri modeli
 * Çeşitli sistem ayarlarını yönetmek için kullanılır
 * ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
 */

const { pool } = require('../config/mysql');

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
                    parsedValue = dbSetting.value === 'true' || dbSetting.value === true || dbSetting.value === 1 || dbSetting.value === '1';
                    break;
                case 'json':
                case 'array':
                    parsedValue = JSON.parse( dbSetting.value );
                    break;
            }
        } catch ( error ) {
            console.error( `Setting value conversion error for key '${dbSetting.key}': ${error.message}` );
        }

        return new Setting( {
            id: dbSetting.id,
            key: dbSetting.key,
            value: parsedValue,
            type: dbSetting.type,
            group: dbSetting.group,
            description: dbSetting.description,
            isPublic: Boolean(dbSetting.is_public),
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
        } else if ( typeof this.value === 'boolean' ) {
            stringValue = this.value ? 'true' : 'false';
        } else if ( this.value !== null && this.value !== undefined ) {
            stringValue = String( this.value );
        }

        return {
            key: this.key,
            value: stringValue,
            type: this.type,
            group: this.group,
            description: this.description,
            is_public: this.isPublic ? 1 : 0, // Boolean'ı integer'a çevir (0 veya 1)
        };
    }

    // Tüm ayarları listele
    static async findAll( options = {} ) {
        let queryBase = 'SELECT * FROM settings';
        const queryParams = [];
        const whereClauses = [];
        let orderByClauses = 'ORDER BY `key` ASC'; // Default order

        try {
            // Filtreler
            if ( options.group ) {
                whereClauses.push('`group` = ?');
                queryParams.push(options.group);
            }
            if ( options.isPublic !== undefined ) {
                whereClauses.push('is_public = ?');
                queryParams.push(options.isPublic ? 1 : 0); // Boolean'ı integer'a çevir (0 veya 1)
            }
            if ( options.keyPrefix ) {
                whereClauses.push('`key` LIKE ?');
                queryParams.push(`${options.keyPrefix}%\``);
            }

            if (whereClauses.length > 0) {
                queryBase += ' WHERE ' + whereClauses.join(' AND ');
            }
            
            // Sıralama - 'group' sütununa göre sıralama öncelikli olabilir
            // Bu kısım Supabase'deki gibi iki ayrı order call'a benzemez, tek ORDER BY içinde yönetilir.
            // Şimdilik sadece key'e göre sıralıyoruz, gerekirse `group, key` olarak güncellenebilir.
            // if (options.sortByGroupFirst) { orderByClauses = 'ORDER BY `group` ASC, `key` ASC'; }
            queryBase += ' ' + orderByClauses;

            const [rows] = await pool.query(queryBase, queryParams);
            return rows.map( s => Setting.fromDatabase( s ) );

        } catch (dbError) {
            console.error('Setting.findAll - Veritabanı hatası, varsayılan ayarlar kullanılacak:', dbError.message);
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
    }

    // ID'ye göre ayar bulma
    static async findById( id ) {
        try {
            const [rows] = await pool.query('SELECT * FROM settings WHERE id = ?', [id]);
            if (!rows || rows.length === 0) throw new Error(`ID'si ${id} olan ayar bulunamadı`);
            return Setting.fromDatabase(rows[0]);
        } catch ( error ) {
            console.error( 'Setting.findById - ID\'ye göre ayar bulunurken hata:', error );
            throw error;
        }
    }

    // Anahtar'a göre ayar bulma
    static async findByKey( key ) {
        try {
            const [rows] = await pool.query('SELECT * FROM settings WHERE `key` = ?', [key]);
            if (!rows || rows.length === 0) return null;
            return Setting.fromDatabase(rows[0]);
        } catch ( error ) {
            console.error( 'Setting.findByKey - Anahtara göre ayar bulunurken hata:', error );
            throw error;
        }
    }

    // Grup tarafından ayarları bulma
    static async findByGroup( group ) {
        try {
            const [rows] = await pool.query('SELECT * FROM settings WHERE `group` = ? ORDER BY `key` ASC', [group]);
            return rows.map( s => Setting.fromDatabase( s ) );
        } catch ( error ) {
            console.error( 'Setting.findByGroup - Gruba göre ayarlar bulunurken hata:', error );
            throw error;
        }
    }

    // Grupları listele (benzersiz grup adları)
    static async getAllGroups() {
        try {
            const [rows] = await pool.query('SELECT DISTINCT `group` FROM settings WHERE `group` IS NOT NULL AND `group` != \'\' ORDER BY `group` ASC');
            return rows.map(row => row.group);
        } catch (error) {
            console.error('Setting.getAllGroups - Ayar grupları alınırken hata:', error);
            // Hata durumunda boş dizi veya anlamlı bir varsayılan değer döndürülebilir
            return [];
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
            const { data: setting, error } = await pool.query(
                'INSERT INTO settings (key, value, type, group, description, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *',
                [key, formattedValue, type, group, description, isPublic, new Date(), new Date()]
            );

            if ( error ) {
                // Tablo bulunamadı hatası için özel işlem
                if (error.code === '42P01') {
                    console.error('Settings tablosu bulunamadı:', error.message);
                    throw new Error(`Settings tablosu bulunamadı: ${error.message}`);
                }
                throw error;
            }

            return Setting.fromDatabase( setting );
        } catch ( error ) {
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
            const { error } = await pool.query('DELETE FROM settings WHERE id = ?', [id]);

            if ( error ) {
                // Tablo bulunamadı hatası için özel işlem
                if (error.code === '42P01') {
                    console.error('Settings tablosu bulunamadı:', error.message);
                    throw new Error(`Settings tablosu bulunamadı: ${error.message}`);
                }
                throw error;
            }

            return true;
        } catch ( error ) {
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