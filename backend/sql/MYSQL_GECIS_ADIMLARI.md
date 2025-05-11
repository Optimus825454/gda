# MySQL Geçiş Adımları

Bu doküman, sistemi Supabase'den MySQL'e geçirme adımlarını detaylandırmaktadır.

## 1. Tabloları Oluşturma ve Verileri Taşıma

### 1.1. Tablo Yapısı Oluşturma

Mevcut `hayvanlar1` tablosuna uyumlu bir `hayvanlar` tablosu oluşturmak için aşağıdaki adımları izleyin:

```sql
-- hayvanlar_table_fix.sql dosyasını MySQL'de çalıştırın
-- Bu dosya, hayvanlar1 tablosuna benzer yapıda bir hayvanlar tablosu oluşturur
```

SQL dosyasını MySQL'de çalıştırmak için:
- PHPMyAdmin kullanabilirsiniz
- MySQL Workbench kullanabilirsiniz
- MySQL komut satırı aracını kullanabilirsiniz:

```bash
mysql -h 213.238.183.232 -u djerkan96 -p518518Erkan gdaflv < backend/sql/hayvanlar_table_fix.sql
```

### 1.2. Verileri Aktarma

```bash
# hayvanlar1 tablosundan hayvanlar tablosuna verileri aktarma
npm run mysql:migrate-hayvanlar
```

Bu komut şunları yapacaktır:
- İki tablo arasında veri taşıma işlemi gerçekleştirir
- Aktarılan kayıt sayısını kontrol eder
- Örnek kayıtları gösterir

## 2. Verileri Düzenleme

Tablodaki verileri standardize etmek için aşağıdaki adımları izleyin:

```bash
# Hayvanlar tablosundaki verileri normalize etme
npm run mysql:normalize-data
```

Bu komut şunları yapacaktır:
- `durum`, `sagmal`, `cinsiyet`, `kategori` ve `gebelikdurum` alanlarındaki değerler standart formata dönüştürülür
- Örneğin "Inek", "inek", "İNEK" değerleri hepsi "İnek" olarak düzenlenir
- Mevcut değerler ve düzenlenmiş değerler listelenir

## 3. İyileştirilmiş Tablo Yapısı (Opsiyonel)

Daha iyi bir veritabanı yapısı için, şu SQL dosyasını çalıştırabilirsiniz:

```sql
-- hayvanlar_table_duzeltme.sql dosyasını MySQL'de çalıştırın
-- Bu dosya ENUM tiplerini kullanarak daha doğru bir tablo yapısı oluşturur
```

Bu adım isteğe bağlıdır ve mevcut sistemi bozmamak için dikkatli şekilde test edilmelidir.

## 4. Backend Kodunu Güncelleme

### 4.1. HayvanlarModel.js Dosyasını Kontrol Etme

`HayvanlarModel.js` dosyası zaten MySQL ile çalışacak şekilde oluşturulmuş. Sadece kodun doğru çalıştığından emin olun.

### 4.2. Kontrolleri Güncelleme

`animalController.js` veya ilgili kontrol dosyalarını güncelleyerek, Supabase referansları yerine yeni MySQL modellerini kullanın.

## 5. Test Etme

```bash
# MySQL bağlantısını ve tabloları test etme
npm run mysql:test
```

Bu komut, MySQL bağlantısını ve tabloları test ederek her şeyin doğru çalıştığından emin olmanızı sağlar.

## 6. Uygulama Yapılandırmasını Güncelleme

`.env` dosyasındaki veritabanı yapılandırmasını kontrol edin:

```
# MySQL Bağlantı Bilgileri
MYSQL_HOST=213.238.183.232
MYSQL_USER=djerkan96
MYSQL_PASSWORD=518518Erkan
MYSQL_DATABASE=gdaflv
MYSQL_PORT=3306
```

## 7. Uygulamayı Başlatma

```bash
# Backend'i başlatma
npm run start:backend

# Veya tüm uygulamayı başlatma (frontend + backend)
npm run start
```

## 8. Sorun Giderme

- Hata mesajlarını, log dosyalarını kontrol edin
- Veritabanı tablo yapısını ve bağlantı bilgilerini kontrol edin
- Hatalı verileri düzeltmek için `mysql:normalize-data` komutunu tekrar çalıştırın

## Durum Kodları ve Karşılıkları

Uygulama içinde kullanılan durum kodları:

### Durum değerleri:
- İnek
- Kuru
- Gebe
- Tohum
- Düve
- Taze
- Buzğ.
- E Bzğ

### Kategori değerleri:
- İnek
- Gebe Düve
- Düve
- İnek.
- Erkek

### Cinsiyet değerleri:
- Dişi
- Erkek

### Sağmal durumu:
- Evet
- Hayır

### Gebelik durumu:
- gebe
- boş 