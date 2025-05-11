-- hayvanlar tablosunun gebelikdurum sütununu varbinary olarak değiştirme
ALTER TABLE hayvanlar MODIFY COLUMN gebelikdurum VARBINARY(255);

-- sagmal sütununu varchar olarak değiştirme (hayvanlar1 tablosunda varchar olarak tanımlanmış)
ALTER TABLE hayvanlar MODIFY COLUMN sagmal VARCHAR(255);

-- tespitno sütununu int olarak değiştirme
ALTER TABLE hayvanlar MODIFY COLUMN tespitno INT(11);

-- Veri aktarımı için hayvanlar tablosunu temizleme
TRUNCATE TABLE hayvanlar;

-- hayvanlar1 tablosundan hayvanlar tablosuna veri aktarımı
INSERT INTO hayvanlar (
    id, kupeno, durum, tohtar, sagmal, anano, babano, 
    dogtar, cinsiyet, kategori, gebelikdurum, tespitno
)
SELECT 
    id, kupeno, durum, tohtar, sagmal, anano, babano, 
    dogtar, cinsiyet, kategori, gebelikdurum, tespitno
FROM 
    hayvanlar1;

-- Aktarılan kayıt sayısını kontrol etme
SELECT COUNT(*) as aktarilan_kayit_sayisi FROM hayvanlar;

-- Örnek kayıtları kontrol etme
SELECT * FROM hayvanlar LIMIT 10; 