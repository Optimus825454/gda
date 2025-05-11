const mysql = require('mysql2/promise');
const config = require('../../src/config/database');

async function up() {
  const connection = await mysql.createConnection(config);

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        action VARCHAR(50) NOT NULL,
        user_id INT NOT NULL,
        details JSON,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Logs tablosu başarıyla oluşturuldu');
  } catch (error) {
    console.error('Logs tablosu oluşturulurken hata:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function down() {
  const connection = await mysql.createConnection(config);

  try {
    await connection.query('DROP TABLE IF EXISTS logs;');
    console.log('Logs tablosu başarıyla silindi');
  } catch (error) {
    console.error('Logs tablosu silinirken hata:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

module.exports = { up, down }; 