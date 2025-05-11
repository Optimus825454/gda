-- hayvanlar tablosunun hayvanlar1 ile uyumlu hale getirilmesi

-- Eğer hayvanlar tablosu varsa önce sil
DROP TABLE IF EXISTS hayvanlar;

-- hayvanlar1 ile aynı yapıya sahip bir hayvanlar tablosu oluştur
CREATE TABLE hayvanlar (
    id INT(11) NOT NULL PRIMARY KEY,
    kupeno VARCHAR(255),
    durum VARCHAR(255),
    tohtar DATE,
    sagmal VARCHAR(255),
    anano VARCHAR(255),
    babano VARCHAR(255),
    dogtar DATE,
    cinsiyet VARCHAR(255),
    kategori VARCHAR(255),
    gebelikdurum VARBINARY(255),
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

-- Diğer tablolar için bağlantı kuralları
-- hayvan_saglik, hayvan_test ve diğer ilişkili tablolardaki FOREIGN KEY tanımlarını
-- hayvanlar tablosunun id alanına bağlı kalacak şekilde düzeltmek gerekir 