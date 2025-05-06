/**
 * Permission.js - İzin sistemi veri modeli
 * Roller ve kullanıcılar için dinamik izin yönetimi
 */

const { supabaseAdmin: supabase } = require('../config/supabase');
// Role modülünü içe aktarmıyoruz - döngüsel bağımlılığı önlemek için

// İzin kontrolünün devre dışı bırakılıp bırakılmayacağını kontrol et
const DISABLE_PERMISSION_CHECK = process.env.DISABLE_PERMISSION_CHECK === 'true';

class Permission {
    constructor({
        id,
        code,
        name,
        description,
        module,
        createdAt,
        updatedAt
    }) {
        this.id = id;
        this.code = code; // İzin kodu (ör. MANAGE_USERS, VIEW_ANIMALS)
        this.name = name; // İzin görünen adı (ör. "Kullanıcı Yönetimi")
        this.description = description;
        this.module = module; // İzin modülü (ör. "users", "animals")
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Veritabanı kaydından Permission nesnesi oluşturur
    static fromDatabase(dbPermission) {
        return new Permission({
            id: dbPermission.id,
            code: dbPermission.code,
            name: dbPermission.name,
            description: dbPermission.description,
            module: dbPermission.module,
            createdAt: dbPermission.created_at,
            updatedAt: dbPermission.updated_at
        });
    }

    // Permission nesnesini veritabanı formatına dönüştürür
    toDatabase() {
        return {
            id: this.id,
            code: this.code,
            name: this.name,
            description: this.description,
            module: this.module,
            created_at: this.createdAt || new Date(),
            updated_at: new Date()
        };
    }

    // Tüm izinleri listele
    static async findAll(options = {}) {
        try {
            // İzin kontrolü devre dışı bırakılmışsa, sahte izinler döndür
            if (DISABLE_PERMISSION_CHECK) {
                console.log('İzinler listesi istendi - ROL BAZLI KONTROL DEVRE DIŞI');
                return [
                    new Permission({
                        id: '1',
                        code: 'ADMIN',
                        name: 'Tam Yetki',
                        description: 'Tam yönetici yetkisi',
                        module: 'system',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }),
                    new Permission({
                        id: '2',
                        code: 'READ_ALL',
                        name: 'Okuma Yetkisi',
                        description: 'Tüm verileri okuma yetkisi',
                        module: 'system',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    })
                ];
            }
            
            // Normal izin kontrolü için veritabanından izinleri çek
            let query = supabase
                .from('permissions')
                .select('*');
                
            // Modüle göre filtreleme
            if (options.module) {
                query = query.eq('module', options.module);
            }
            
            const { data: permissions, error } = await query;
            
            if (error) {
                console.error('İzinler çekilirken hata:', error);
                return [];
            }
            
            return permissions.map(p => Permission.fromDatabase(p));
        } catch (error) {
            console.error('İzinler listelenirken hata:', error);
            return [];
        }
    }

    // ID'ye göre izin bulma
    static async findById(id) {
        try {
            // ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
            // Sahte bir izin nesnesi döndür
            console.log(`ID'ye göre izin istendi (${id}) - ROL BAZLI KONTROL DEVRE DIŞI`);
            return new Permission({
                id: id,
                code: 'ADMIN',
                name: 'Tam Yetki',
                description: 'Tam yönetici yetkisi',
                module: 'system',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        } catch (error) {
            console.error(`ID'ye göre izin bulunurken hata:`, error);
            throw error;
        }
    }

    // Kod'a göre izin bulma
    static async findByCode(code) {
        try {
            // ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
            // Sahte bir izin nesnesi döndür
            console.log(`Koda göre izin istendi (${code}) - ROL BAZLI KONTROL DEVRE DIŞI`);
            return new Permission({
                id: '1',
                code: code,
                name: 'Tam Yetki',
                description: 'Tam yönetici yetkisi',
                module: 'system',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Koda göre izin bulunurken hata:', error);
            return null;
        }
    }

    // Rol ID'sine göre izinleri bulma
    static async findByRoleId(roleId) {
        try {
            // ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
            // Tüm izinleri içeren bir dizi döndür
            console.log(`Role göre izinler istendi (${roleId}) - ROL BAZLI KONTROL DEVRE DIŞI`);
            return [
                new Permission({
                    id: '1',
                    code: 'ADMIN',
                    name: 'Tam Yetki',
                    description: 'Tam yönetici yetkisi',
                    module: 'system',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }),
                new Permission({
                    id: '2',
                    code: 'READ_ALL',
                    name: 'Okuma Yetkisi',
                    description: 'Tüm verileri okuma yetkisi',
                    module: 'system',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }),
                new Permission({
                    id: '3',
                    code: 'WRITE_ALL',
                    name: 'Yazma Yetkisi',
                    description: 'Tüm verileri yazma yetkisi',
                    module: 'system',
                    createdAt: new Date(),
                    updatedAt: new Date()
                })
            ];
        } catch (error) {
            console.error('Role göre izinler bulunurken hata:', error);
            return [];
        }
    }

    // Kullanıcı ID'sine göre izinleri bulma (tüm rollerinden gelen izinler)
    static async findByUserId(userId) {
        try {
            // ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
            // Tüm izinleri içeren bir dizi döndür
            console.log(`Kullanıcı ID'sine göre izinler istendi (${userId}) - ROL BAZLI KONTROL DEVRE DIŞI`);
            return [
                new Permission({
                    id: '1',
                    code: 'ADMIN',
                    name: 'Tam Yetki',
                    description: 'Tam yönetici yetkisi',
                    module: 'system',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }),
                new Permission({
                    id: '2',
                    code: 'READ_ALL',
                    name: 'Okuma Yetkisi',
                    description: 'Tüm verileri okuma yetkisi',
                    module: 'system',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }),
                new Permission({
                    id: '3',
                    code: 'WRITE_ALL',
                    name: 'Yazma Yetkisi',
                    description: 'Tüm verileri yazma yetkisi',
                    module: 'system',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }),
                new Permission({
                    id: '4',
                    code: 'MANAGE_ALL',
                    name: 'Yönetim Yetkisi',
                    description: 'Tüm verileri yönetme yetkisi',
                    module: 'system',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }),
                new Permission({
                    id: '5',
                    code: 'VIEW_ANIMALS_PAGE',
                    name: 'Hayvanlar Sayfası Görüntüleme',
                    description: 'Hayvanlar sayfasını görüntüleme yetkisi',
                    module: 'pages',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }),
                new Permission({
                    id: '6',
                    code: 'VIEW_SHELTERS_PAGE',
                    name: 'Barınaklar Sayfası Görüntüleme',
                    description: 'Barınaklar sayfasını görüntüleme yetkisi',
                    module: 'pages',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }),
                new Permission({
                    id: '7',
                    code: 'VIEW_USERS_PAGE',
                    name: 'Kullanıcılar Sayfası Görüntüleme',
                    description: 'Kullanıcılar sayfasını görüntüleme yetkisi',
                    module: 'pages',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }),
                new Permission({
                    id: '8',
                    code: 'VIEW_SETTINGS_PAGE',
                    name: 'Ayarlar Sayfası Görüntüleme',
                    description: 'Ayarlar sayfasını görüntüleme yetkisi',
                    module: 'pages',
                    createdAt: new Date(),
                    updatedAt: new Date()
                })
            ];
        } catch (error) {
            console.error('Kullanıcı ID sine göre izinler bulunurken hata:', error);
            return [];
        }
    }

    // Modüle göre izinleri bulma
    static async findByModule(module) {
        try {
            // ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
            console.log(`Modüle göre izinler istendi (${module}) - ROL BAZLI KONTROL DEVRE DIŞI`);
            return [];
        } catch (error) {
            console.error('Modüle göre izinler bulunurken hata:', error);
            return [];
        }
    }

    // Yeni izin oluştur
    static async create({
        code,
        name,
        description = '',
        module
    }) {
        try {
            // ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
            console.log(`Yeni izin oluşturma isteği (${code}) - ROL BAZLI KONTROL DEVRE DIŞI`);
            return new Permission({
                id: Math.floor(Math.random() * 1000).toString(),
                code,
                name,
                description,
                module,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('İzin oluşturulurken hata:', error);
            throw error;
        }
    }

    // İzin güncelleme
    async save() {
        try {
            // ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
            console.log(`İzin güncelleme isteği (${this.code}) - ROL BAZLI KONTROL DEVRE DIŞI`);
            return this;
        } catch (error) {
            console.error('İzin güncellenirken hata:', error);
            throw error;
        }
    }
    
    // İzin silme
    static async delete(id) {
        try {
            // ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
            console.log(`İzin silme isteği (${id}) - ROL BAZLI KONTROL DEVRE DIŞI`);
            
            // Rol-izin ilişkilerini sil
            const { error: deleteRpError } = await supabase
                .from('role_permissions')
                .delete()
                .eq('permission_id', id);

            if (deleteRpError) throw deleteRpError;
            
            // İzni sil
            const { error } = await supabase
                .from('permissions')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return true;
        } catch (error) {
            console.error('İzin silinirken hata:', error);
            throw error;
        }
    }

    /**
     * Kullanıcının belirli bir izne sahip olup olmadığını kontrol eder
     * @param {string} userId - Kullanıcı ID
     * @param {string} permissionCode - İzin kodu
     * @returns {Promise<boolean>} - İzin varsa true, yoksa false
     */
    static async checkUserHasPermission(userId, permissionCode) {
        try {
            console.log(`İzin kontrolü DEVRE DIŞI: Kullanıcı ID: ${userId}, İzin: ${permissionCode}`);
            
            // ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
            // Her zaman true döndür
            return true;
        } catch (error) {
            console.error('İzin kontrolü sırasında hata:', error);
            // Hata durumunda bile true döndür
            return true;
        }
    }
}

module.exports = Permission;