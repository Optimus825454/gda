const mysql = require('mysql2/promise');
const config = require('../../src/config/database');

async function up() {
  const connection = await mysql.createConnection(config);

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        animal_id INT NOT NULL,
        detection_number VARCHAR(50) NOT NULL UNIQUE,
        result ENUM('POZİTİF', 'NEGATİF') NULL,
        notes TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (animal_id) REFERENCES hayvanlar(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Tests tablosu başarıyla oluşturuldu');
  } catch (error) {
    console.error('Tests tablosu oluşturulurken hata:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function down() {
  const connection = await mysql.createConnection(config);

  try {
    await connection.query('DROP TABLE IF EXISTS tests;');
    console.log('Tests tablosu başarıyla silindi');
  } catch (error) {
    console.error('Tests tablosu silinirken hata:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

module.exports = { up, down }; 