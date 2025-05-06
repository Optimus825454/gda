# GLV (GÜLVET-ASYA ET) Hayvancılık Yönetim Sistemi - Sistem Mimarisi

## 1. Sistem Genel Bakışı

GLV, mikroservis mimarisi üzerine kurulu, modern bir hayvancılık yönetim sistemidir. Sistem, GÜLVET ve ASYA ET konsorsiyumunun ihtiyaçlarını karşılamak üzere tasarlanmıştır.

### 1.1 Sistem Mimarisi

```mermaid
graph TB
    subgraph "Frontend Katmanı"
        Web[Web Uygulaması]
        Mobile[Mobil Uygulama]
    end

    subgraph "API Gateway"
        Gateway[API Gateway /<br/>Load Balancer]
    end

    subgraph "Servis Katmanı"
        AuthService[Kimlik Doğrulama<br/>Servisi]
        AnimalService[Hayvan Yönetim<br/>Servisi]
        HealthService[Sağlık Takip<br/>Servisi]
        FinanceService[Finansal Yönetim<br/>Servisi]
        LogisticsService[Lojistik Yönetim<br/>Servisi]
        NotificationService[Bildirim<br/>Servisi]
    end

    subgraph "Veritabanı Katmanı"
        MainDB[(Ana Veritabanı)]
        CacheDB[(Redis Cache)]
        TimeseriesDB[(Zaman Serisi DB)]
    end

    Web --> Gateway
    Mobile --> Gateway
    Gateway --> AuthService
    Gateway --> AnimalService
    Gateway --> HealthService
    Gateway --> FinanceService
    Gateway --> LogisticsService
    Gateway --> NotificationService

    AuthService --> MainDB
    AnimalService --> MainDB
    HealthService --> MainDB
    FinanceService --> MainDB
    LogisticsService --> MainDB
    NotificationService --> MainDB

    AnimalService --> CacheDB
    HealthService --> TimeseriesDB
```

### 1.2 Mikroservis Yapılandırması

Her bir servis bağımsız olarak çalışan ve ölçeklenebilen bir mikroservis olarak tasarlanmıştır:

1. **Kimlik Doğrulama Servisi**
   - Kullanıcı yönetimi
   - Rol bazlı yetkilendirme
   - JWT token yönetimi
   - Oturum kontrolü

2. **Hayvan Yönetim Servisi**
   - Hayvan kaydı ve takibi
   - Soy ağacı yönetimi
   - Lokasyon takibi
   - Durum güncellemeleri

3. **Sağlık Takip Servisi**
   - Test sonuçları yönetimi
   - Aşı takibi
   - Sağlık raporları
   - Karantina yönetimi

4. **Finansal Yönetim Servisi**
   - Konsorsiyum muhasebesi
   - DIMES entegrasyonu
   - Ödeme takibi
   - Finansal raporlama

5. **Lojistik Yönetim Servisi**
   - Kesimhane sevkiyat
   - Damızlık satış
   - Stok yönetimi
   - Transfer işlemleri

6. **Bildirim Servisi**
   - Email bildirimleri
   - SMS entegrasyonu
   - Push notifications
   - Alarm yönetimi

## 2. Veri Modeli ve Servis İlişkileri

### 2.1 Veritabanı Şeması

```mermaid
erDiagram
    ANIMALS ||--o{ HEALTH_RECORDS : has
    ANIMALS ||--o{ TEST_RESULTS : has
    ANIMALS ||--o{ LOCATION_HISTORY : tracks
    ANIMALS ||--o{ SALES : involves
    ANIMALS {
        uuid id
        string animal_id
        string tag_number
        date birth_date
        string gender
        string breed
        string purpose
        string status
        decimal price
        uuid current_location
    }
    HEALTH_RECORDS {
        uuid id
        uuid animal_id
        date record_date
        string type
        string description
        string status
    }
    TEST_RESULTS {
        uuid id
        uuid animal_id
        string test_type
        date test_date
        string result
        text notes
    }
    LOCATION_HISTORY {
        uuid id
        uuid animal_id
        uuid location_id
        timestamp start_date
        timestamp end_date
    }
    SALES {
        uuid id
        uuid animal_id
        string sale_type
        date sale_date
        decimal price
        string status
    }
    FINANCIAL_RECORDS {
        uuid id
        uuid reference_id
        string type
        decimal amount
        string currency
        string status
    }
```

### 2.2 Servis İletişim Modeli

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant AnimalService
    participant HealthService
    participant NotificationService
    participant Database

    Client->>Gateway: Hayvan Test Sonucu Girişi
    Gateway->>AnimalService: Hayvan Bilgisi Kontrolü
    AnimalService->>Database: Hayvan Durumu Sorgusu
    Database-->>AnimalService: Hayvan Bilgileri
    AnimalService-->>Gateway: Hayvan Doğrulama
    Gateway->>HealthService: Test Sonucu Kayıt
    HealthService->>Database: Test Kaydı
    Database-->>HealthService: Kayıt Onayı
    HealthService->>NotificationService: Bildirim Talebi
    NotificationService->>Client: Sonuç Bildirimi
```

## 3. Güvenlik Katmanı

### 3.1 Güvenlik Mimarisi

```mermaid
graph TD
    subgraph "Güvenlik Katmanları"
        L1[API Gateway<br/>Rate Limiting]
        L2[JWT Authentication]
        L3[Role Based Access Control]
        L4[Database RLS]
    end

    subgraph "Yetki Seviyeleri"
        R1[GULVET_ADMIN]
        R2[ASYAET_ADMIN]
        R3[SAHA_PERSONELI]
        R4[SISTEM_ADMIN]
    end

    L1 --> L2
    L2 --> L3
    L3 --> L4

    R1 --> L3
    R2 --> L3
    R3 --> L3
    R4 --> L3
```

### 3.2 Yetkilendirme Matrisi

| Rol | Hayvan Yönetimi | Test Yönetimi | Finansal İşlemler | Sistem Ayarları |
|-----|-----------------|---------------|-------------------|-----------------|
| GULVET_ADMIN | Tam Yetki | Tam Yetki | Kısıtlı | Kısıtlı |
| ASYAET_ADMIN | Tam Yetki | Görüntüleme | Tam Yetki | Kısıtlı |
| SAHA_PERSONELI | Kısıtlı | Veri Giriş | Yok | Yok |
| SISTEM_ADMIN | Tam Yetki | Tam Yetki | Tam Yetki | Tam Yetki |

## 4. İş Akışları

### 4.1 Hayvan Kayıt ve Test Süreci

```mermaid
stateDiagram-v2
    [*] --> HayvanKayit
    HayvanKayit --> TestPlanlamasi
    
    state TestPlanlamasi {
        [*] --> KanAlma
        KanAlma --> NumuneKayit
        NumuneKayit --> TestSonucBekleme
    }
    
    TestPlanlamasi --> SonucDegerlendirme
    
    state SonucDegerlendirme {
        [*] --> SonucKontrol
        state SonucKontrol <<choice>>
        SonucKontrol --> Pozitif : ASYA ET
        SonucKontrol --> Negatif : GÜLVET
    }
    
    Pozitif --> KesimPlanlamasi
    Negatif --> DamizlikPlanlama
```

### 4.2 Finansal İşlem Süreci

```mermaid
stateDiagram-v2
    [*] --> IslemBaslangic
    
    state IslemBaslangic {
        [*] --> TipBelirleme
        state TipBelirleme <<choice>>
        TipBelirleme --> KesimFaturasi
        TipBelirleme --> DamizlikSatis
    }
    
    KesimFaturasi --> DIMESKayit
    DamizlikSatis --> AliciBilgileri
    
    DIMESKayit --> OdemeTakip
    AliciBilgileri --> OdemeTakip
    
    state OdemeTakip {
        [*] --> OdemeKontrol
        OdemeKontrol --> TahsilatOnay
        TahsilatOnay --> IslemKapama
    }
    
    OdemeTakip --> [*]
```

## 5. Geliştirme Öncelikleri

### 5.1 Faz 1: Temel Altyapı (4-6 Hafta)
- Mikroservis altyapısının kurulumu
- API Gateway implementasyonu
- Temel güvenlik katmanı
- Veritabanı migrasyonları

### 5.2 Faz 2: Çekirdek Modüller (6-8 Hafta)
- Hayvan yönetim servisi
- Test takip sistemi
- Lokasyon yönetimi
- Kullanıcı yetkilendirme sistemi

### 5.3 Faz 3: Finansal Modüller (4-6 Hafta)
- DIMES entegrasyonu
- Konsorsiyum muhasebesi
- Ödeme takip sistemi
- Finansal raporlama

### 5.4 Faz 4: Operasyonel Modüller (4-6 Hafta)
- Kesimhane entegrasyonu
- Damızlık satış sistemi
- Lojistik yönetimi
- Bildirim sistemi

### 5.5 Faz 5: İyileştirmeler (4-6 Hafta)
- Performans optimizasyonları
- UI/UX geliştirmeleri
- Raporlama sistemi
- Mobil uygulama

## 6. Deployment Mimarisi

```mermaid
graph TB
    subgraph "Production Environment"
        LB[Load Balancer]
        
        subgraph "Service Cluster"
            API1[API Instance 1]
            API2[API Instance 2]
            API3[API Instance 3]
        end
        
        subgraph "Database Cluster"
            DB_Master[(Master DB)]
            DB_Slave1[(Slave DB 1)]
            DB_Slave2[(Slave DB 2)]
        end
        
        subgraph "Cache Layer"
            Redis1[(Redis Primary)]
            Redis2[(Redis Replica)]
        end
        
        subgraph "Monitoring"
            Prometheus[Prometheus]
            Grafana[Grafana]
            ELK[ELK Stack]
        end
    end
    
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 --> DB_Master
    API2 --> DB_Master
    API3 --> DB_Master
    
    DB_Master --> DB_Slave1
    DB_Master --> DB_Slave2
    
    API1 --> Redis1
    API2 --> Redis1
    API3 --> Redis1
    
    Redis1 --> Redis2
    
    API1 --> Prometheus
    API2 --> Prometheus
    API3 --> Prometheus
    
    Prometheus --> Grafana
    API1 --> ELK
    API2 --> ELK
    API3 --> ELK