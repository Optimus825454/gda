-- hayvanlar tablosunun iyileştirilmiş versiyonu
-- Erkan'ın belirttiği değerlere göre düzenlenmiştir

-- Eğer hayvanlar tablosu varsa önce sil
DROP TABLE IF EXISTS hayvanlar;

-- Sütun değerleri daha doğru tanımlanmış hayvanlar tablosu
CREATE TABLE hayvanlar (
    id INT(11) NOT NULL PRIMARY KEY,
    kupeno VARCHAR(255),
    -- Durum için enum kullanabiliriz (İnek, Kuru, Gebe, Tohum, Düve, Taze, Buzğ., E Bzğ)
    durum ENUM('İnek', 'Kuru', 'Gebe', 'Tohum', 'Düve', 'Taze', 'Buzğ.', 'E Bzğ', 'Diğer'),
    tohtar DATE,
    -- Evet veya Hayır değerleri için
    sagmal ENUM('Evet', 'Hayır'),
    anano VARCHAR(255),
    babano VARCHAR(255),
    dogtar DATE,
    -- Dişi veya Erkek değerleri için
    cinsiyet ENUM('Dişi', 'Erkek'),
    -- Kategori için enum (İnek, Gebe Düve, Düve, İnek., Erkek)
    kategori ENUM('İnek', 'Gebe Düve', 'Düve', 'İnek.', 'Erkek', 'Diğer'),
    -- Gebelik durumu (gebe veya null)
    gebelikdurum ENUM('gebe', 'boş'),
    tespitno INT(11),
    isim VARCHAR(255),
    irk VARCHAR(255),
    agirlik DECIMAL(10,2),
    amac VARCHAR(255),
    fiyat DECIMAL(10,2),
    notlar TEXT,
    resim_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- İndeksler ekle
CREATE INDEX idx_kupeno ON hayvanlar(kupeno);
CREATE INDEX idx_durum ON hayvanlar(durum);
CREATE INDEX idx_kategori ON hayvanlar(kategori);
CREATE INDEX idx_cinsiyet ON hayvanlar(cinsiyet);
CREATE INDEX idx_anano ON hayvanlar(anano);
CREATE INDEX idx_babano ON hayvanlar(babano);
CREATE INDEX idx_dogtar ON hayvanlar(dogtar);

-- NOT: MySQL'e import yaparken, mevcut verilerle enum değerleri uyuşmadığı durumda
-- sorun yaşanabilir. Bu durumda önce varchar olarak alıp sonra update ile düzeltmek gerekebilir.

-- hayvanlar1 tablosunda olup burada enum ile tanımlanmış alanlardaki değerleri kontrol etmek için:
-- SELECT DISTINCT durum FROM hayvanlar1;
-- SELECT DISTINCT sagmal FROM hayvanlar1;
-- SELECT DISTINCT cinsiyet FROM hayvanlar1;
-- SELECT DISTINCT kategori FROM hayvanlar1;
-- SELECT DISTINCT gebelikdurum FROM hayvanlar1; 