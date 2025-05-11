-- MySQL Güncellemeleri
-- Bu dosya, Supabase'deki sütunlara uygun olarak MySQL tablolarını güncelleme işlemlerini içerir

-- Eksik sütunların eklenmesi
ALTER TABLE hayvanlar
    ADD COLUMN IF NOT EXISTS current_location_id INT NULL,
    ADD COLUMN IF NOT EXISTS photos JSON NULL COMMENT 'Birden fazla fotoğraf URL bilgisini JSON formatında saklar',
    ADD COLUMN IF NOT EXISTS test_group VARCHAR(50) NULL COMMENT 'Test grubu bilgisi',
    ADD COLUMN IF NOT EXISTS blood_test_tag VARCHAR(100) NULL COMMENT 'Kan testi etiketi',
    ADD COLUMN IF NOT EXISTS test_status VARCHAR(50) NULL COMMENT 'Test durumu',
    ADD COLUMN IF NOT EXISTS transport_status VARCHAR(50) NULL COMMENT 'Taşıma durumu',
    ADD COLUMN IF NOT EXISTS sinif VARCHAR(50) NULL COMMENT 'Hayvan sınıfı',
    ADD COLUMN IF NOT EXISTS animal_id VARCHAR(50) NULL COMMENT 'Alternatif hayvan ID';

-- hayvan_satis tablosundaki eksik sütunların eklenmesi
ALTER TABLE hayvan_satis
    ADD COLUMN IF NOT EXISTS tasima_durumu VARCHAR(50) NULL COMMENT 'Taşıma durum bilgisi',
    ADD COLUMN IF NOT EXISTS satis_tipi VARCHAR(50) NULL DEFAULT 'normal' COMMENT 'Satış tipi',
    ADD COLUMN IF NOT EXISTS satis_odeme_durumu VARCHAR(50) NULL DEFAULT 'beklemede' COMMENT 'Ödeme durumu';

-- hayvan_test tablosundaki eksik sütunların eklenmesi
ALTER TABLE hayvan_test
    ADD COLUMN IF NOT EXISTS test_grubu VARCHAR(50) NULL COMMENT 'Test grubu bilgisi',
    ADD COLUMN IF NOT EXISTS kan_testi_etiketi VARCHAR(100) NULL COMMENT 'Kan testi etiketi',
    ADD COLUMN IF NOT EXISTS test_durumu VARCHAR(50) NULL DEFAULT 'beklemede' COMMENT 'Test durumu',
    ADD COLUMN IF NOT EXISTS test_rapor_url VARCHAR(255) NULL COMMENT 'Test rapor URL';

-- İndekslerin eklenmesi
CREATE INDEX IF NOT EXISTS idx_hayvanlar_isim ON hayvanlar(isim);
CREATE INDEX IF NOT EXISTS idx_hayvanlar_irk ON hayvanlar(irk);
CREATE INDEX IF NOT EXISTS idx_hayvanlar_tespitno ON hayvanlar(tespitno);
CREATE INDEX IF NOT EXISTS idx_hayvanlar_test_status ON hayvanlar(test_status);
CREATE INDEX IF NOT EXISTS idx_hayvanlar_test_group ON hayvanlar(test_group);
CREATE INDEX IF NOT EXISTS idx_hayvanlar_animal_id ON hayvanlar(animal_id);

-- Örnek veri - test amaçlı
INSERT INTO hayvanlar (
    kupeno, durum, cinsiyet, kategori, isim, irk, dogtar, fiyat
) VALUES 
    ('TR12345678', 'aktif', 'disi', 'buyukbas', 'Sarıkız', 'Holstein', '2021-05-15', 15000.00),
    ('TR87654321', 'aktif', 'erkek', 'buyukbas', 'Karabaş', 'Simental', '2022-03-10', 18000.00);

-- Örnek sağlık kaydı
INSERT INTO hayvan_saglik (
    hayvan_id, muayene_tarihi, teshis, tedavi, ilac, durum, notlar
) VALUES 
    (1, '2023-10-15', 'Sağlıklı', 'Rutin kontrol', NULL, 'iyi', 'Düzenli kontrol yapıldı');

-- Örnek test kaydı
INSERT INTO hayvan_test (
    hayvan_id, test_tipi, test_tarihi, sonuc, tespit_no, yapan_kisi
) VALUES 
    (1, 'Tüberküloz', '2023-09-01', 'Negatif', 'TB12345', 'Dr. Ahmet Yılmaz');

-- Ek faydalı sorgular

-- Tüm aktif hayvanları getiren sorgu
-- SELECT * FROM hayvanlar WHERE durum = 'aktif';

-- Irka göre hayvanları getiren sorgu
-- SELECT * FROM hayvanlar WHERE irk LIKE '%Holstein%';

-- Test sonuçları ile hayvanları birleştiren sorgu
/* 
SELECT h.id, h.kupeno, h.isim, h.irk, t.test_tipi, t.test_tarihi, t.sonuc
FROM hayvanlar h
LEFT JOIN hayvan_test t ON h.id = t.hayvan_id
WHERE h.durum = 'aktif';
*/

-- Hayvanları sağlık kayıtları ile birleştiren sorgu
/*
SELECT h.id, h.kupeno, h.isim, h.irk, s.muayene_tarihi, s.teshis, s.tedavi
FROM hayvanlar h
LEFT JOIN hayvan_saglik s ON h.id = s.hayvan_id
WHERE h.durum = 'aktif';
*/ 