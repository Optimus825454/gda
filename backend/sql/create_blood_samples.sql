-- blood_samples tablosu için CREATE TABLE ifadesi (MySQL)

CREATE TABLE IF NOT EXISTS blood_samples (
    id CHAR(36) NOT NULL PRIMARY KEY,
    animal_id CHAR(36) NOT NULL,               -- hayvanlar tablosundaki hayvanın UUID'si
    tag_number VARCHAR(100),                   -- Tespit Numarası (uzunluğu ihtiyaca göre ayarlanmalı)
    sample_date TIMESTAMP NULL DEFAULT NULL,   -- Numune alınma tarihi
    photo_urls JSON,                           -- Fotoğraf URL'leri (JSON dizisi olarak)
    notes TEXT,                                -- Notlar
    created_by CHAR(36),                       -- Kaydı oluşturan kullanıcının UUID'si
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'BEKLEMEDE',     -- Test durumu (örn: BEKLEMEDE, TAMAMLANDI, IPTAL)
    result VARCHAR(50),                        -- Test sonucu (örn: POZITIF, NEGATIF)
    
    -- Foreign Key Kısıtlamaları (hayvanlar ve users tablolarının var olduğunu ve id sütunlarının CHAR(36) olduğunu varsayar)
    -- CONSTRAINT fk_blood_sample_animal FOREIGN KEY (animal_id) REFERENCES hayvanlar(id) ON DELETE CASCADE,
    -- CONSTRAINT fk_blood_sample_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- İndeksler (performans için)
    INDEX idx_animal_id (animal_id),
    INDEX idx_tag_number (tag_number),
    INDEX idx_status (status),
    INDEX idx_sample_date (sample_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Eğer UUID'leri MySQL içinde otomatik üretmek isterseniz (MySQL 8.0+):
-- id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,

-- ÖNEMLİ NOTLAR:
-- 1. `animal_id` ve `created_by` için Foreign Key kısıtlamalarını aktif etmeden önce,
--    `hayvanlar` ve `users` tablolarının var olduğundan ve referans verilen `id` sütunlarının
--    CHAR(36) tipinde olduğundan emin olun. Gerekirse referansları kendi şemanıza göre düzeltin.
-- 2. VARCHAR uzunluklarını (tag_number, status, result) ihtiyacınıza göre ayarlayın.
-- 3. `sample_date` için `DEFAULT NULL` kullandım, eğer her zaman bir değer alması gerekiyorsa `NOT NULL` yapabilirsiniz. 