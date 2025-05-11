-- Önce kullanicilar tablosunun varlığını kontrol et
CREATE TABLE IF NOT EXISTS kullanicilar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ad VARCHAR(50) NOT NULL,
    soyad VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    sifre VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'USER',
    aktif BOOLEAN DEFAULT true,
    olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Varsayılan admin kullanıcısı ekle (eğer yoksa)
INSERT IGNORE INTO kullanicilar (ad, soyad, email, sifre, rol) 
VALUES ('Admin', 'User', 'admin@example.com', '$2b$10$YourHashedPasswordHere', 'ADMIN');

-- Aktiviteler tablosunu oluştur
CREATE TABLE IF NOT EXISTS aktiviteler (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    islem_tipi VARCHAR(50) NOT NULL COMMENT 'CREATE, UPDATE, DELETE gibi işlem tipleri',
    modul VARCHAR(50) NOT NULL COMMENT 'Hayvan, Kullanıcı, Satış gibi modül isimleri',
    kayit_id INT COMMENT 'İşlem yapılan kaydın ID''si',
    aciklama TEXT COMMENT 'İşlem açıklaması',
    detaylar JSON COMMENT 'İşlem detayları JSON formatında',
    olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_aktivite_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Örnek aktivite kayıtları (admin kullanıcısı için)
INSERT INTO aktiviteler (user_id, islem_tipi, modul, kayit_id, aciklama, detaylar) 
SELECT 
    id as user_id,
    'CREATE' as islem_tipi,
    'Hayvan' as modul,
    1 as kayit_id,
    'Yeni hayvan eklendi' as aciklama,
    '{"kupeno": "TR123456789", "tur": "İnek"}' as detaylar
FROM users 
WHERE role = 'ADMIN'
LIMIT 1; 