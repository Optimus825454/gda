/**
 * initSystemAdminPermissions.js
 * SYSTEM_ADMIN rolüne tüm sayfalara erişim izinleri ekler
 */

require('dotenv').config();
const { supabase } = require('../../config/supabaseClientImproved');
const Permission = require('../../models/Permission');

// Tüm modüller ve sayfalar için izinler
const pagePermissions = [
    // Hayvan yönetimi sayfaları
    { code: 'VIEW_ANIMALS_PAGE', name: 'Hayvanlar Sayfasını Görüntüleme', module: 'pages', description: 'Hayvanlar sayfasını görüntüleme izni' },
    { code: 'VIEW_ANIMAL_DETAILS_PAGE', name: 'Hayvan Detay Sayfasını Görüntüleme', module: 'pages', description: 'Hayvan detay sayfasını görüntüleme izni' },
    { code: 'VIEW_ADD_ANIMAL_PAGE', name: 'Hayvan Ekleme Sayfasını Görüntüleme', module: 'pages', description: 'Hayvan ekleme sayfasını görüntüleme izni' },
    
    // Barınak ve padok sayfaları
    { code: 'VIEW_SHELTERS_PAGE', name: 'Barınaklar Sayfasını Görüntüleme', module: 'pages', description: 'Barınaklar sayfasını görüntüleme izni' },
    { code: 'VIEW_SHELTER_DETAILS_PAGE', name: 'Barınak Detay Sayfasını Görüntüleme', module: 'pages', description: 'Barınak detay sayfasını görüntüleme izni' },
    { code: 'VIEW_PADDOCKS_PAGE', name: 'Padoklar Sayfasını Görüntüleme', module: 'pages', description: 'Padoklar sayfasını görüntüleme izni' },
    { code: 'VIEW_PADDOCK_DETAILS_PAGE', name: 'Padok Detay Sayfasını Görüntüleme', module: 'pages', description: 'Padok detay sayfasını görüntüleme izni' },
    
    // Test ve sağlık sayfaları
    { code: 'VIEW_TESTS_PAGE', name: 'Testler Sayfasını Görüntüleme', module: 'pages', description: 'Testler sayfasını görüntüleme izni' },
    { code: 'VIEW_TEST_DETAILS_PAGE', name: 'Test Detay Sayfasını Görüntüleme', module: 'pages', description: 'Test detay sayfasını görüntüleme izni' },
    { code: 'VIEW_HEALTH_RECORDS_PAGE', name: 'Sağlık Kayıtları Sayfasını Görüntüleme', module: 'pages', description: 'Sağlık kayıtları sayfasını görüntüleme izni' },
    
    // Satış ve lojistik sayfaları
    { code: 'VIEW_SALES_PAGE', name: 'Satışlar Sayfasını Görüntüleme', module: 'pages', description: 'Satışlar sayfasını görüntüleme izni' },
    { code: 'VIEW_SALE_DETAILS_PAGE', name: 'Satış Detay Sayfasını Görüntüleme', module: 'pages', description: 'Satış detay sayfasını görüntüleme izni' },
    { code: 'VIEW_LOGISTICS_PAGE', name: 'Lojistik Sayfasını Görüntüleme', module: 'pages', description: 'Lojistik sayfasını görüntüleme izni' },
    
    // Kullanıcı ve rol yönetimi sayfaları
    { code: 'VIEW_USERS_PAGE', name: 'Kullanıcılar Sayfasını Görüntüleme', module: 'pages', description: 'Kullanıcılar sayfasını görüntüleme izni' },
    { code: 'VIEW_USER_DETAILS_PAGE', name: 'Kullanıcı Detay Sayfasını Görüntüleme', module: 'pages', description: 'Kullanıcı detay sayfasını görüntüleme izni' },
    { code: 'VIEW_ROLES_PAGE', name: 'Roller Sayfasını Görüntüleme', module: 'pages', description: 'Roller sayfasını görüntüleme izni' },
    { code: 'VIEW_ROLE_DETAILS_PAGE', name: 'Rol Detay Sayfasını Görüntüleme', module: 'pages', description: 'Rol detay sayfasını görüntüleme izni' },
    
    // Raporlar ve ayarlar sayfaları
    { code: 'VIEW_REPORTS_PAGE', name: 'Raporlar Sayfasını Görüntüleme', module: 'pages', description: 'Raporlar sayfasını görüntüleme izni' },
    { code: 'VIEW_SETTINGS_PAGE', name: 'Ayarlar Sayfasını Görüntüleme', module: 'pages', description: 'Ayarlar sayfasını görüntüleme izni' },
    { code: 'VIEW_DASHBOARD_PAGE', name: 'Dashboard Sayfasını Görüntüleme', module: 'pages', description: 'Dashboard sayfasını görüntüleme izni' }
];

/**
 * SYSTEM_ADMIN rolünü bul
 */
async function findSystemAdminRole() {
    try {
        const { data: roles, error } = await supabase
            .from('roles')
            .select('id, name')
            .or('name.eq.SYSTEM_ADMIN,name.eq.SYSTEM-ADMIN');
        
        if (error) throw error;
        
        if (!roles || roles.length === 0) {
            throw new Error('SYSTEM_ADMIN rolü bulunamadı');
        }
        
        return roles[0];
    } catch (error) {
        console.error('SYSTEM_ADMIN rolü bulunurken hata:', error);
        throw error;
    }
}

/**
 * İzinleri oluştur ve SYSTEM_ADMIN rolüne ata
 */
async function initSystemAdminPagePermissions() {
    try {
        console.log('SYSTEM_ADMIN rolü için sayfa izinleri oluşturuluyor...');
        
        // SYSTEM_ADMIN rolünü bul
        const systemAdminRole = await findSystemAdminRole();
        console.log(`SYSTEM_ADMIN rolü bulundu: ${systemAdminRole.name} (ID: ${systemAdminRole.id})`);
        
        // Tüm izinleri oluştur veya var olanları bul
        for (const permissionData of pagePermissions) {
            // İzin var mı kontrol et
            let permission = await Permission.findByCode(permissionData.code);
            
            if (!permission) {
                // İzin yoksa oluştur
                console.log(`Yeni izin oluşturuluyor: ${permissionData.code}`);
                permission = await Permission.create({
                    code: permissionData.code,
                    name: permissionData.name,
                    description: permissionData.description,
                    module: permissionData.module,
                    isActive: true
                });
            } else {
                console.log(`İzin zaten mevcut: ${permissionData.code}`);
            }
            
            // İzin-rol ilişkisini kontrol et
            const { data: existingRelation, error: relationError } = await supabase
                .from('role_permissions')
                .select('*')
                .eq('role_id', systemAdminRole.id)
                .eq('permission_id', permission.id);
                
            if (relationError) throw relationError;
            
            // İlişki yoksa oluştur
            if (!existingRelation || existingRelation.length === 0) {
                console.log(`${permissionData.code} izni SYSTEM_ADMIN rolüne atanıyor...`);
                const { error: insertError } = await supabase
                    .from('role_permissions')
                    .insert({
                        role_id: systemAdminRole.id,
                        permission_id: permission.id
                    });
                    
                if (insertError) throw insertError;
            } else {
                console.log(`${permissionData.code} izni zaten SYSTEM_ADMIN rolüne atanmış.`);
            }
        }
        
        console.log('SYSTEM_ADMIN rolü için tüm sayfa izinleri başarıyla oluşturuldu ve atandı.');
    } catch (error) {
        console.error('SYSTEM_ADMIN izinleri oluşturulurken hata:', error);
        throw error;
    }
}

// Script doğrudan çalıştırıldığında
if (require.main === module) {
    initSystemAdminPagePermissions()
        .then(() => {
            console.log('İşlem başarıyla tamamlandı.');
            process.exit(0);
        })
        .catch(error => {
            console.error('İşlem sırasında hata oluştu:', error);
            process.exit(1);
        });
}

module.exports = { initSystemAdminPagePermissions };