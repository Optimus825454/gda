/**
 * AuditService.js - Kullanıcı işlem logları servisi
 */
const AuditLog = require('../models/AuditLog');

// Sabit log tipleri
const LOG_ACTIONS = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    READ: 'READ',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    EXPORT: 'EXPORT',
    IMPORT: 'IMPORT'
};

// Sabit entity tipleri
const LOG_ENTITIES = {
    USER: 'USER',
    ANIMAL: 'ANIMAL',
    TEST: 'TEST',
    SALE: 'SALE',
    HEALTH_RECORD: 'HEALTH_RECORD',
    SETTING: 'SETTING'
};

const AuditService = {
    ACTIONS: LOG_ACTIONS,
    ENTITIES: LOG_ENTITIES,

    /**
     * Kullanıcı işlemini logla
     * @param {Object} logData Log verisi
     * @param {string} logData.userId Kullanıcı ID
     * @param {string} logData.action İşlem tipi (LOG_ACTIONS sabitlerine bakınız)
     * @param {string} logData.entity İşlem yapılan varlık tipi (LOG_ENTITIES sabitlerine bakınız)
     * @param {string} logData.entityId İşlem yapılan varlık ID
     * @param {Object} logData.details İşlem detayları
     * @param {Object} req Express request objesi (opsiyonel)
     */
    async logAction(logData, req = null) {
        try {
            // IP adresi ve user agent bilgilerini topla
            const ipAddress = req?.ip || req?.connection?.remoteAddress || null;
            const userAgent = req?.headers?.['user-agent'] || null;

            // Log kaydı oluştur
            await AuditLog.create({
                userId: logData.userId,
                action: logData.action,
                entity: logData.entity,
                entityId: logData.entityId,
                details: logData.details || {},
                ipAddress,
                userAgent
            });
        } catch (err) {
            // Log hatalarını sessizce yut, sistem akışını bozmasın
            console.error('Audit log kaydı hatası:', err);
        }
    },

    /**
     * Kullanıcının log kayıtlarını getir
     * @param {string} userId Kullanıcı ID
     * @param {Object} options Filtreleme ve sayfalama seçenekleri
     */
    async getUserLogs(userId, options = {}) {
        return AuditLog.findByUserId(userId, options);
    },

    /**
     * Tüm log kayıtlarını getir (sadece yöneticiler için)
     * @param {Object} options Filtreleme ve sayfalama seçenekleri
     */
    async getAllLogs(options = {}) {
        return AuditLog.findAll(options);
    }
};

module.exports = AuditService;
