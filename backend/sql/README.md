# Veritabanı Düzeltme Talimatları

Bu klasör, veritabanı şeması için SQL betiklerini içerir. Şu anda karşılaşılan hataları düzeltmek için aşağıdaki adımları izleyin.

## Tespit Edilen Sorunlar

1. `user_profiles` tablosunda `user_id` sütunu eksik
2. `tests` tablosunda `status` sütunu eksik

## Düzeltme Adımları

1. Supabase SQL Editörü'ne giriş yapın
2. `fix_db_schema.sql` dosyasının içeriğini kopyalayın
3. Supabase SQL Editörüne yapıştırın ve çalıştırın

Bu düzeltmeler yapıldıktan sonra uygulamanız düzgün çalışmalıdır. Düzeltmeler şunları sağlar:

1. `user_profiles` tablosuna `user_id` sütunu ekler ve mevcut ID değerlerini bu yeni sütuna kopyalar
2. `tests` tablosuna `status` sütunu ekler ve mevcut test verilerine uygun durum değerleri atar
3. Gerekli izinleri güncelleyerek tüm kullanıcıların bu tablolara erişmesini sağlar

## Alternatif Çözüm

Eğer Supabase SQL Editörüne erişiminiz yoksa, aşağıdaki komutu kullanarak düzeltme betiğini çalıştırabilirsiniz:

```bash
psql -U <username> -h <host> -d <database> -f fix_db_schema.sql
```

veya:

```bash
cat fix_db_schema.sql | supabase db execute
```

Supabase CLI kurulu ise.