-- Supabase'den MySQL'e Sütun Eşleştirme
-- Bu dosya Supabase'den MySQL'e geçiş yaparken kullanılacak sütun eşleştirmelerini ve dönüşüm önerilerini içerir

/*
TEMEL TABLO EŞLEŞTIRME: 
Supabase'deki Animal tablosu -> MySQL'deki hayvanlar tablosu + ilişkili tablolar
*/

-- MEVCUT SÜTUN EŞLEŞTİRMELERİ
-- --------------------------------------------
-- Supabase Sütunu    | MySQL Tablosu.Sütunu
-- --------------------------------------------
-- id                 | hayvanlar.id
-- birth_date         | hayvanlar.dogtar
-- price              | hayvanlar.fiyat
-- created_at         | hayvanlar.created_at
-- updated_at         | hayvanlar.updated_at
-- tohumlama_tarihi   | hayvanlar.tohtar
-- cinsiyet           | hayvanlar.cinsiyet
-- durum              | hayvanlar.durum
-- category           | hayvanlar.kategori
-- tespit_no          | hayvanlar.tespitno
-- tag_number         | hayvanlar.kupeno
-- pregnancy_status   | hayvanlar.gebelikdurum
-- name               | hayvanlar.isim
-- anne_no            | hayvanlar.anano
-- gender (tekrar)    | hayvanlar.cinsiyet
-- breed              | hayvanlar.irk
-- purpose            | hayvanlar.amac
-- status (tekrar)    | hayvanlar.durum
-- baba_no            | hayvanlar.babano
-- notes              | hayvanlar.notlar
-- image_url          | hayvanlar.resim_url

-- İLİŞKİLİ TABLOLARA TAŞINAN SÜTUNLAR
-- --------------------------------------------
-- Supabase Sütunu    | MySQL Tablosu.Sütunu
-- --------------------------------------------
-- sale_date          | hayvan_satis.satis_tarihi
-- sale_price         | hayvan_satis.fiyat
-- destination_company| hayvan_satis.hedef_sirket
-- sale_status        | hayvan_satis.durum
-- transport_status   | hayvan_satis.durum (ilave not ile)
-- test_group         | hayvan_test.test_tipi
-- test_result        | hayvan_test.sonuc
-- blood_test_tag     | hayvan_test.tespit_no
-- test_status        | hayvan_test.sonuc (durum olarak)
-- current_location_id| [yeni tablo gerekebilir]
-- photos             | [JSON biçiminde hayvanlar.resim_url'de tutulabilir]
-- sinif              | hayvanlar.kategori ile birleştirilebilir
-- animal_id          | hayvanlar.id (gerek yok)

-- MYSQL HAYVANLAR TABLOSU MEVCUT YAPISI
DESCRIBE hayvanlar;

-- MYSQL HAYVAN_SATIS TABLOSU MEVCUT YAPISI
DESCRIBE hayvan_satis;

-- MYSQL HAYVAN_TEST TABLOSU MEVCUT YAPISI
DESCRIBE hayvan_test;

-- HAYVANLAR TABLOSUNA GEREKEN SÜTUN EKLEMELERİ
-- (İhtiyaç duyulması halinde)
ALTER TABLE hayvanlar 
    ADD COLUMN konum_id INT NULL,
    ADD COLUMN ek_fotolar JSON NULL,
    ADD COLUMN sinif VARCHAR(50) NULL;

-- HAYVAN_SATIS TABLOSUNA GEREKEN SÜTUN EKLEMELERİ
-- (İhtiyaç duyulması halinde)
ALTER TABLE hayvan_satis
    ADD COLUMN tasima_durumu VARCHAR(50) NULL;

-- HAYVAN_TEST TABLOSUNA GEREKEN SÜTUN EKLEMELERİ
-- (İhtiyaç duyulması halinde)
ALTER TABLE hayvan_test
    ADD COLUMN kan_testi_etiketi VARCHAR(100) NULL,
    ADD COLUMN test_grubu VARCHAR(50) NULL;

-- ÖRNEK VERİ GEÇİŞ SORGUSU (SUPABASE -> MYSQL)
-- (Bu sorgu, Supabase verileri bir geçici tabloya aktarıldıktan sonra kullanılacak şekilde tasarlanmıştır)
/*
INSERT INTO hayvanlar (
    id, kupeno, durum, tohtar, sagmal, anano, babano, dogtar, 
    cinsiyet, kategori, gebelikdurum, tespitno, isim, irk, 
    agirlik, amac, fiyat, notlar, resim_url
)
SELECT 
    id, tag_number, status, tohumlama_tarihi, 
    CASE WHEN category = 'sagmal' THEN 1 ELSE 0 END, 
    anne_no, baba_no, birth_date, 
    gender, category, pregnancy_status, tespit_no, name, breed, 
    NULL, purpose, price, notes, image_url
FROM 
    temp_supabase_animals;
*/

-- ÖRNEK TEST VERİLERİ AKTARMA SORGUSU
/*
INSERT INTO hayvan_test (
    hayvan_id, test_tipi, test_tarihi, sonuc, tespit_no, 
    yapan_kisi, notlar
)
SELECT 
    id, test_group, created_at, test_result, blood_test_tag,
    'Sistem', 'Supabase''den aktarıldı'
FROM 
    temp_supabase_animals
WHERE 
    test_result IS NOT NULL;
*/

-- ÖRNEK SATIŞ VERİLERİ AKTARMA SORGUSU
/*
INSERT INTO hayvan_satis (
    hayvan_id, satis_tarihi, satis_tipi, alici, fiyat, 
    durum, hedef_sirket, notlar
)
SELECT 
    id, sale_date, 'Doğrudan Satış', NULL, sale_price,
    sale_status, destination_company, 'Supabase''den aktarıldı'
FROM 
    temp_supabase_animals
WHERE 
    sale_date IS NOT NULL;
*/ 