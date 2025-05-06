const permissions = {
    // Kullanıcı yönetimi yetkileri
    'user:create': ['SUPERADMIN'],
    'user:read': ['SUPERADMIN', 'GULVET_ADMIN', 'ASYAET_ADMIN', 'DIMES_ADMIN'],
    'user:update': ['SUPERADMIN'],
    'user:delete': ['SUPERADMIN'],

    // Lokasyon yönetimi yetkileri
    'location:create': ['SUPERADMIN', 'GULVET_ADMIN'],
    'location:read': ['SUPERADMIN', 'GULVET_ADMIN', 'ASYAET_ADMIN', 'DIMES_ADMIN', 'SAHA_PERSONELI'],
    'location:update': ['SUPERADMIN', 'GULVET_ADMIN'],
    'location:delete': ['SUPERADMIN', 'GULVET_ADMIN'],

    // Hayvan yönetimi yetkileri
    'animal:create': ['SUPERADMIN', 'GULVET_ADMIN', 'SAHA_PERSONELI'],
    'animal:read': ['SUPERADMIN', 'GULVET_ADMIN', 'ASYAET_ADMIN', 'DIMES_ADMIN', 'SAHA_PERSONELI'],
    'animal:update': ['SUPERADMIN', 'GULVET_ADMIN', 'SAHA_PERSONELI'],
    'animal:delete': ['SUPERADMIN', 'GULVET_ADMIN'],
    'animal:transfer': ['SUPERADMIN', 'GULVET_ADMIN', 'SAHA_PERSONELI'],

    // Test yönetimi yetkileri
    'test:create': ['SUPERADMIN', 'GULVET_ADMIN', 'SAHA_PERSONELI'],
    'test:read': ['SUPERADMIN', 'GULVET_ADMIN', 'ASYAET_ADMIN', 'SAHA_PERSONELI'],
    'test:update': ['SUPERADMIN', 'GULVET_ADMIN', 'SAHA_PERSONELI'],
    'test:delete': ['SUPERADMIN', 'GULVET_ADMIN'],

    // Satış yönetimi yetkileri
    'sale:create': ['SUPERADMIN', 'GULVET_ADMIN', 'ASYAET_ADMIN'],
    'sale:read': ['SUPERADMIN', 'GULVET_ADMIN', 'ASYAET_ADMIN', 'DIMES_ADMIN'],
    'sale:update': ['SUPERADMIN', 'GULVET_ADMIN', 'ASYAET_ADMIN'],
    'sale:delete': ['SUPERADMIN'],

    // Finans yönetimi yetkileri
    'finance:create': ['SUPERADMIN', 'DIMES_ADMIN'],
    'finance:read': ['SUPERADMIN', 'GULVET_ADMIN', 'ASYAET_ADMIN', 'DIMES_ADMIN'],
    'finance:update': ['SUPERADMIN', 'DIMES_ADMIN'],
    'finance:delete': ['SUPERADMIN'],

    // Rapor yönetimi yetkileri
    'report:generate': ['SUPERADMIN', 'GULVET_ADMIN', 'ASYAET_ADMIN', 'DIMES_ADMIN'],
    'report:view': ['SUPERADMIN', 'GULVET_ADMIN', 'ASYAET_ADMIN', 'DIMES_ADMIN'],

    // Sistem ayarları yetkileri
    'settings:update': ['SUPERADMIN'],
    'settings:view': ['SUPERADMIN', 'GULVET_ADMIN', 'ASYAET_ADMIN', 'DIMES_ADMIN'],

    // Audit log yetkileri
    'audit:view': ['SUPERADMIN']
};

const hasPermission = ( userRole, permission ) => {
    if ( !permissions[permission] ) {
        return false;
    }
    return permissions[permission].includes( userRole );
};

module.exports = {
    permissions,
    hasPermission
};