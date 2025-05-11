const pool = require('../config/database');

/**
 * Sistem loglarını veritabanına kaydet
 * @param {string} action - Yapılan işlem (TEST_CREATE, TEST_UPDATE, TEST_DELETE vb.)
 * @param {number} user_id - İşlemi yapan kullanıcının ID'si
 * @param {object} details - Log detayları
 */
async function createLog(action, user_id, details) {
    try {
        const query = `
            INSERT INTO logs (
                action,
                user_id,
                details,
                created_at
            ) VALUES (?, ?, ?, NOW())
        `;

        await pool.query(query, [
            action,
            user_id,
            JSON.stringify(details)
        ]);
    } catch (error) {
        console.error('Log kaydı oluşturulurken hata:', error);
        // Log kaydı oluşturulurken hata olsa bile uygulamanın çalışmaya devam etmesini sağla
    }
}

module.exports = {
    createLog
}; 