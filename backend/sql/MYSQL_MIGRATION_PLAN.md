# MySQL Geçiş Planı

## 1. Tamamlanan Adımlar

- [x] MySQL bağlantı konfigürasyonu oluşturuldu
- [x] MySQLBaseModel temel sınıfı hazırlandı
- [x] Hayvanlar modeli oluşturuldu (HayvanlarModel.js)
- [x] Hayvanlar tablosu oluşturuldu ve veriler aktarıldı
- [x] Hayvanlar verileri standardize edildi
- [x] AnimalController MySQL'e uyarlandı

## 2. Yapılması Gerekenler

### 2.1. Diğer Tablolar ve Modeller
- [x] HayvanAsiModel.js oluşturuldu
- [x] HayvanSaglikModel.js oluşturuldu
- [x] HayvanAgirlikModel.js oluşturuldu
- [ ] HayvanGebeligiModel.js oluşturulmalı
- [ ] KullanicilarModel.js oluşturulmalı (users ve user_profiles)
- [ ] AyarlarModel.js oluşturulmalı (settings)
- [ ] YetkilerModel.js oluşturulmalı (permissions)

### 2.2. İş Mantığı Servisleri
- [ ] AnimalService MySQL ile çalışacak şekilde güncellenmeli
- [ ] AuthService MySQL ile çalışacak şekilde güncellenmeli
- [ ] HealthService MySQL ile çalışacak şekilde güncellenmeli
- [ ] ReportService MySQL ile çalışacak şekilde güncellenmeli

### 2.3. Kontrolcüler (Controllers)
- [x] animalController.js güncellendi
- [ ] authController.js güncellenmeli
- [ ] healthController.js güncellenmeli
- [ ] userController.js güncellenmeli
- [ ] reportController.js güncellenmeli
- [ ] settingsController.js güncellenmeli

### 2.4. Diğer Scriptler
- [ ] Veritabanı yedekleme scriptleri güncellenmeli
- [ ] Veri importu scriptleri güncellenmeli
- [ ] Kullanıcı izin kontrolleri güncellenmeli

### 2.5. Frontend
- [ ] Backend API'ye yapılan istekler kontrolü
- [ ] Supabase Auth yerine kendi Auth sistemine geçiş
- [ ] Frontend formlardaki alan isimleri kontrolü

## 3. Test ve Doğrulama Adımları

1. MySQL bağlantısını test edin
```bash
npm run mysql:test
```

2. Tabloları kurun
```bash
npm run mysql:setup
```

3. Hayvanlar verileri aktarın
```bash
npm run mysql:migrate-hayvanlar
```

4. Veri standardizasyonu yapın
```bash
npm run mysql:normalize-data
```

5. API uç noktalarını test edin
   - `/api/animals` - Tüm hayvanları listeleme
   - `/api/animals/:id` - Tek bir hayvan getirme
   - `/api/animals` (POST) - Yeni hayvan ekleme
   - `/api/animals/:id` (PUT) - Hayvan güncelleme
   - `/api/animals/:id` (DELETE) - Hayvan silme

## 4. Güvenlik Kontrolleri

- [ ] Kullanıcı kimlik doğrulama ve yetkilendirmesi
- [ ] Veritabanı erişim güvenliği
- [ ] API güvenliği ve rate limiting
- [ ] Kullanıcı şifre yönetimi
- [ ] Özel verilerin şifrelenmesi

## 5. Performans İyileştirmeleri

- [ ] Sorgu optimizasyonu
- [ ] İndekslerin kontrol edilmesi
- [ ] Connection pooling düzgün yapılandırma
- [ ] Asenkron işlemler ve iş parçacığı yönetimi
- [ ] Önbellek (cache) stratejileri

## 6. Yedekleme ve Felaket Kurtarma

- [ ] Düzenli MySQL yedekleme stratejisi
- [ ] Otomatik yedekleme script'leri
- [ ] Felaket kurtarma prosedürleri
- [ ] Veritabanı replikasyonu (opsiyonel)

## 7. Supabase'den Tamamen Çıkış

- [ ] Tüm Supabase referansları kaldırıldığından emin olun
- [ ] Kullanılmayan Supabase tabloları ve bağlantıları temizleyin
- [ ] Supabase'deki hassas verileri silin
- [ ] Supabase projesini arşivleyin veya kapatın

Bu plan, Supabase'den MySQL'e geçiş sürecinin her adımını detaylandırmaktadır. Her adım tamamlandıkça işaretlenmeli ve test edilmelidir. 