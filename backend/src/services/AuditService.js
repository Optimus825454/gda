/**
 * AuditService.js - Kullanıcı işlem logları servisi
 */
const { pool } = require('../config/mysql');

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

class AuditService {
    static ACTIONS = LOG_ACTIONS;
    static ENTITIES = LOG_ENTITIES;

    /**
     * Aktivite kaydı oluşturur
     * @param {Object} params Aktivite parametreleri
     * @param {number} params.userId Kullanıcı ID
     * @param {string} params.action İşlem tipi (CREATE, UPDATE, DELETE)
     * @param {string} params.entity Modül adı (Hayvan, Kullanıcı, Satış vb.)
     * @param {number} params.entityId Kayıt ID
     * @param {Object} params.details İşlem detayları
     */
    static async logAction(params) {
        try {
            // Önce aktiviteler tablosunun varlığını kontrol et
            const [tables] = await pool.query(`
                SELECT TABLE_NAME 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'aktiviteler'
            `);

            // Tablo yoksa kayıt yapma
            if (tables.length === 0) {
                console.log('Aktiviteler tablosu mevcut değil, kayıt atlanıyor.');
                return;
            }

            // Aktivite kaydını oluştur
            const [result] = await pool.query(`
                INSERT INTO aktiviteler (
                    user_id, 
                    islem_tipi, 
                    modul, 
                    kayit_id, 
                    aciklama, 
                    detaylar
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                params.userId,
                params.action,
                params.entity,
                params.entityId,
                params.description || `${params.entity} kaydında ${params.action} işlemi yapıldı`,
                JSON.stringify(params.details || {})
            ]);

            return result;
        } catch (error) {
            console.error('Aktivite kaydı oluşturulurken hata:', error);
            // Hatayı yukarı fırlat
            throw error;
        }
    }

    /**
     * Son aktiviteleri getirir
     * @param {number} limit Kaç kayıt getirileceği
     */
    static async getRecentActivities(limit = 10) {
        try {
            // Önce aktiviteler tablosunun varlığını kontrol et
            const [tables] = await pool.query(`
                SELECT TABLE_NAME 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'aktiviteler'
            `);

            // Tablo yoksa boş liste döndür
            if (tables.length === 0) {
                return [];
            }

            // Son aktiviteleri getir
            const [activities] = await pool.query(`
                SELECT 
                    a.*,
                    u.full_name as kullanici_adi
                FROM aktiviteler a
                LEFT JOIN users u ON a.user_id = u.id
                ORDER BY a.olusturma_tarihi DESC
                LIMIT ?
            `, [limit]);

            return activities;
        } catch (error) {
            console.error('Son aktiviteler getirilirken hata:', error);
            throw error;
        }
    }
}

module.exports = AuditService;
