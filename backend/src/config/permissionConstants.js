/**
 * permissionConstants.js - Permission constants for the application
 */

const PERMISSIONS = {
    // Animal permissions
    READ_ANIMAL: 'animal:read',
    WRITE_ANIMAL: 'animal:create',
    UPDATE_ANIMAL: 'animal:update',
    DELETE_ANIMAL: 'animal:delete',
    TRANSFER_ANIMAL: 'animal:transfer',
    
    // User permissions
    READ_USER: 'user:read',
    WRITE_USER: 'user:create',
    UPDATE_USER: 'user:update',
    DELETE_USER: 'user:delete',
    MANAGE_USERS: 'user:manage',
    
    // Location permissions
    READ_LOCATION: 'location:read',
    WRITE_LOCATION: 'location:create',
    UPDATE_LOCATION: 'location:update',
    DELETE_LOCATION: 'location:delete',    
    // Shelter permissions
    READ_SHELTER: 'shelter:read',
    WRITE_SHELTER: 'shelter:create',
    UPDATE_SHELTER: 'shelter:update',
    DELETE_SHELTER: 'shelter:delete',    
    // Test permissions
    READ_TEST: 'test:read',
    WRITE_TEST: 'test:create',
    UPDATE_TEST: 'test:update',
    DELETE_TEST: 'test:delete',
    MANAGE_TESTS: 'test:manage',
    
    // Sale permissions
    READ_SALE: 'sale:read',
    WRITE_SALE: 'sale:create',
    UPDATE_SALE: 'sale:update',
    DELETE_SALE: 'sale:delete',
    MANAGE_SALES: 'sale:manage',
    
    // Finance permissions
    READ_FINANCE: 'finance:read',
    WRITE_FINANCE: 'finance:create',
    UPDATE_FINANCE: 'finance:update',
    DELETE_FINANCE: 'finance:delete',
    
    // Report permissions
    GENERATE_REPORT: 'report:generate',
    VIEW_REPORT: 'report:view',
    VIEW_REPORTS: 'reports:view',
    
    // Settings permissions
    VIEW_SETTINGS: 'settings:view',
    UPDATE_SETTINGS: 'settings:update',
    
    // Audit permissions
    VIEW_AUDIT: 'audit:view',
    
    // Permission management
    MANAGE_PERMISSIONS: 'permissions:manage',    
    // Role management
    MANAGE_ROLES: 'roles:manage',    
    // DIMES integration
    DIMES_SYNC: 'dimes:sync',
    DIMES_READ: 'dimes:read'
};

module.exports = { PERMISSIONS };