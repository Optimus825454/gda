## İşleyiş Diyagramı

Sistemin temel işleyiş akışı şu şekilde:

1. **Hayvanların Sisteme Kaydı**
   - Manuel olarak bireysel kayıt
   - Toplu kayıt işlemi

2. **Test Süreci**
   - Kupe numarası ile kan alınan hayvanların güncellenmesi
   - Toplu veya bireysel test sonuçlarının girilmesi

3. **Sonuca Göre Akıbet Belirleme**
   - Pozitif hayvanlar → AsyaEt'e kesime sevk
   - Negatif hayvanlar → Gülvet tarafından damızlık satışa sunma

4. **Sağlık Takibi**
   - Gebelik durumu
   - Tohumlama kaydı
   - Doğum kaydı
   - Hastalık bilgileri

5. **Finansal İşlemler ve Takip**
   - Dimes firması ile cari hesap yönetimi
   - Gülvet ve AsyaEt konsorsiyum yapısı
   - Borç/alacak takibi

## Eksik Modüller ve İyileştirme Alanları

İncelemelerimde tespit ettiğim eksik modüller ve iyileştirilmesi gereken alanlar:

### 1. Konsorsiyum Yönetim Modülü

Mevcut durum: Gülvet ve AsyaEt'in oluşturduğu konsorsiyum yapısı için özel bir modül bulunmuyor. Finans modülü altında kısmi işlevler bulunsa da, konsorsiyum işlemleri için özel bir modül eksik.

Önerilen İyileştirme:

- Konsorsiyumun Dimes ile olan finansal ilişkilerinin takibi
- Konsorsiyum bazında raporlama

### 2. Dimes Entegrasyon Modülü

Mevcut durum: Finans modülü altında Dimes entegrasyonu için bazı API rotaları bulunsa da, tam entegrasyon özellikli bir modül eksik.

Önerilen İyileştirme:

- Dimes'ten alınan hayvanların excell ile toplu olaraksisteme kaydı
- Dimes'e yapılan ödemelerin detaylı takibi
- Dimes'e borç ödeme planı ve takibi

### 3. Gelişmiş Kesimhane/Sevkiyat Modülü

Mevcut durum: Lojistik modülü altında temel sevkiyat işlemleri bulunuyor ancak, AsyaEt'e kesime giden hayvanların özel takibi için yeterli değil.

Önerilen İyileştirme:

- Kesime gönderilen hayvanların ağırlık, et verimi takibi
- Kesimhaneye sevkiyat planlaması (tarih, araç, sürücü bilgileri)
- Kesim sonrası raporlama ve analiz

### 5. Üreme ve Genetik Takip Modülü

Mevcut durum: Sağlık modülü altında gebelik ve tohumlama kayıtları kısmen bulunuyor ancak kapsamlı bir üreme/genetik takip eksik.

Önerilen İyileştirme:

- Gebelik takibi ve doğum planlaması
- Doğum sonrası yavru takibi ve eşleştirme

### 6. Finansal Raporlama ve Analiz Modülü

Mevcut durum: Temel finansal işlemler ve genel raporlar mevcut ancak kapsamlı finansal analiz eksik.

Önerilen İyileştirme:

- Konsorsiyum bazlı finansal raporlar
- Farklı operasyon alanlarının (damızlık, kesim) finansal karşılaştırması

### 7. Toplu İşlem ve İthalat Modülü

Mevcut durum: Bazı toplu işlem özellikleri var ancak kapsamlı bir toplu veri yönetimi eksik.

Önerilen İyileştirme:

- Excel/CSV dosyaları ile toplu hayvan kaydı
- Toplu test sonucu girişi ve güncelleme
- Veri doğrulama ve temizleme özellikleri
- Toplu güncelleme raporları

## İşleyiş Diyagramı ve Sistemi Geliştirilmesi Önerisi

```
[Hayvan Tedariki (DIMES)] --> [Hayvan Kaydı] --> [Test Sonucu Girişi] --> [Sonuca Göre Yönlendirme]
                                    |                     |
                                    v                     v
                              [Sağlık Takibi]      [Finansal İşlemler]
                                    |                     |
                                    v                     v
[Pozitif Sonuç] --> [AsyaEt] --> [Kesimhane] --> [Konsorsiyuma Borç Kaydı] --> [Dimes'e Ödeme]
        |
        v
[Negatif Sonuç] --> [Gülvet] --> [Damızlık Satış] --> [Konsorsiyuma Borç Kaydı] --> [Dimes'e Ödeme]
                        |
                        v
                  [Gebelik/Tohumlama
                   Takibi]
```

## BU ŞEKİLDE İLERLEYELİM

Tespit edilen eksik modüller ve iyileştirme alanları doğrultusunda aşağıdaki geliştirme planını uygulayacağız:

1. **Acil Öncelikli Modüller (İlk 2 Hafta)**
   - Toplu İşlem ve İthalat Modülü (Excel/CSV ile hayvan kaydı)
   - Dimes Entegrasyon Modülü (finansal takip)


2. **Orta Öncelikli Modüller (3-6 Hafta)**
   - Gelişmiş Kesimhane/Sevkiyat Modülü
   - Finansal Raporlama ve Analiz Modülü
   - Üreme ve Genetik Takip Modülü (gebelik/doğum)

3. **Geliştirme Adımları**
   - Her modül için backend API rotalarının oluşturulması
   - Frontend arayüzlerinin geliştirilmesi
   - Birim testlerin yazılması
   - Kullanıcı kabul testleri
   - Dokümantasyon

4. **Teknik Hedefler**
   - Kod tekrarını azaltmak için ortak bileşenler
   - Tutarlı hata yönetimi
   - Performans optimizasyonu (büyük veri setleri için)
   - Kullanıcı deneyiminin iyileştirilmesi

5. **İş Hedefleri**
   - Dimes ile finansal mutabakatın kolaylaştırılması
   - Kesim ve damızlık süreçlerinin tam izlenebilirliği
   - Hayvan sağlığı ve üreme performansının artırılması
   - Genel operasyonel verimliliğin artırılması

Sistem geliştikçe ek ihtiyaçlar belirlenecek ve bu plan doğrultusunda güncellenecektir.