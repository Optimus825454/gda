const { supabaseAdmin } = require('../config/supabase');

/**
 * Settings tablosunu oluştur
 */
async function createSettingsTable() {
  try {
    // Temel ayarları tanımla
    const settings = [
      {
        key: "system_info",
        value: { name: "GDA FlowSystems", version: "1.0.0" },
        description: "Sistem bilgileri",
      },
      {
        key: "notification_settings",
        value: { email: true, sms: false },
        description: "Bildirim ayarları",
      },
      {
        key: "test_settings",
        value: { auto_schedule: true, reminder_days: 3 },
        description: "Test ayarları",
      },
    ];

    // Settings tablosunu kontrol et
    const { data: existingSettings, error: checkError } = await supabaseAdmin
      .from("settings")
      .select("key");

    if (checkError) throw checkError;

    // Eksik ayarları ekle
    const existingKeys = existingSettings.map((s) => s.key);
    const newSettings = settings.filter((s) => !existingKeys.includes(s.key));

    if (newSettings.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("settings")
        .insert(newSettings);

      if (insertError) throw insertError;
      console.log(`${newSettings.length} yeni ayar eklendi`);
    } else {
      console.log("Tüm ayarlar zaten mevcut");
    }
  } catch (error) {
    console.error("Settings tablosu oluşturulurken hata:", error);
  }
}

/**
 * İzinler tablosunu düzelt
 */
async function fixPermissionsTable() {
  try {
    // Temel rolleri tanımla
    const roles = [
      { name: "SYSTEM_ADMIN", description: "Sistem Yöneticisi" },
      { name: "GULVET_ADMIN", description: "Gülvet Yöneticisi" },
      { name: "DIMES_ADMIN", description: "Dimes Yöneticisi" },
      { name: "ASYAET_ADMIN", description: "Asyaet Yöneticisi" },
      { name: "USER", description: "Normal Kullanıcı" },
    ];

    // Rolleri kontrol et ve eksik olanları ekle
    const { data: existingRoles, error: checkError } = await supabaseAdmin
      .from("roles")
      .select("name");

    if (checkError) throw checkError;

    const existingRoleNames = existingRoles.map((r) => r.name);
    const newRoles = roles.filter((r) => !existingRoleNames.includes(r.name));

    if (newRoles.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("roles")
        .insert(newRoles);

      if (insertError) throw insertError;
      console.log(`${newRoles.length} yeni rol eklendi`);
    } else {
      console.log("Tüm roller zaten mevcut");
    }
  } catch (error) {
    console.error("İzinler tablosu düzeltilirken hata:", error);
  }
}

/**
 * Tüm izinleri başlat
 */
async function initAllPermissions() {
  try {
    // Temel izinleri tanımla
    const basePermissions = [
      // Kullanıcı yönetimi izinleri
      { code: "USER_CREATE", name: "Kullanıcı Oluşturma" },
      { code: "USER_READ", name: "Kullanıcı Görüntüleme" },
      { code: "USER_UPDATE", name: "Kullanıcı Güncelleme" },
      { code: "USER_DELETE", name: "Kullanıcı Silme" },

      // Rol yönetimi izinleri
      { code: "ROLE_MANAGE", name: "Rol Yönetimi" },
      { code: "PERMISSION_MANAGE", name: "İzin Yönetimi" },

      // Hayvan yönetimi izinleri
      { code: "ANIMAL_CREATE", name: "Hayvan Ekleme" },
      { code: "ANIMAL_READ", name: "Hayvan Görüntüleme" },
      { code: "ANIMAL_UPDATE", name: "Hayvan Güncelleme" },
      { code: "ANIMAL_DELETE", name: "Hayvan Silme" },

      // Test yönetimi izinleri
      { code: "TEST_CREATE", name: "Test Oluşturma" },
      { code: "TEST_READ", name: "Test Görüntüleme" },
      { code: "TEST_UPDATE", name: "Test Güncelleme" },
      { code: "TEST_DELETE", name: "Test Silme" },

      // Satış yönetimi izinleri
      { code: "SALE_CREATE", name: "Satış Oluşturma" },
      { code: "SALE_READ", name: "Satış Görüntüleme" },
      { code: "SALE_UPDATE", name: "Satış Güncelleme" },
      { code: "SALE_DELETE", name: "Satış Silme" },

      // Barınak yönetimi izinleri
      { code: "SHELTER_MANAGE", name: "Barınak Yönetimi" },
      { code: "LOCATION_MANAGE", name: "Lokasyon Yönetimi" },

      // Sağlık yönetimi izinleri
      { code: "HEALTH_MANAGE", name: "Sağlık Kaydı Yönetimi" },

      // Lojistik yönetimi izinleri
      { code: "LOGISTICS_MANAGE", name: "Lojistik Yönetimi" },

      // Rapor ve ayar izinleri
      { code: "REPORT_VIEW", name: "Rapor Görüntüleme" },
      { code: "SETTINGS_MANAGE", name: "Ayar Yönetimi" },

      // Dashboard izinleri
      { code: "DASHBOARD_VIEW", name: "Dashboard Görüntüleme" },
    ];

    // Mevcut izinleri kontrol et
    const { data: existingPermissions, error: fetchError } =
      await supabaseAdmin.from("permissions").select("code");

    if (fetchError) throw fetchError;

    // Eksik izinleri belirle
    const existingCodes = existingPermissions.map((p) => p.code);
    const newPermissions = basePermissions.filter(
      (p) => !existingCodes.includes(p.code)
    );

    if (newPermissions.length > 0) {
      // Yeni izinleri ekle
      const { error: insertError } = await supabaseAdmin
        .from("permissions")
        .insert(newPermissions);

      if (insertError) throw insertError;
      console.log(`${newPermissions.length} yeni izin eklendi`);
    } else {
      console.log("Tüm izinler zaten mevcut");
    }
  } catch (error) {
    console.error("İzinler başlatılırken hata:", error);
  }
}

module.exports = {
  createSettingsTable,
  fixPermissionsTable,
  initAllPermissions,
};