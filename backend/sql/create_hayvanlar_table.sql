-- Hayvanlar tablosu oluşturma
CREATE TABLE IF NOT EXISTS hayvanlar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kupeno VARCHAR(50) NOT NULL UNIQUE,
    durum VARCHAR(30) NOT NULL DEFAULT 'aktif',
    tohtar DATE,
    sagmal TINYINT(1) DEFAULT 0,
    anano VARCHAR(50),
    babano VARCHAR(50),
    dogtar DATE,
    cinsiyet ENUM('erkek', 'disi') NOT NULL,
    kategori VARCHAR(50) NOT NULL,
    gebelikdurum VARCHAR(30),
    tespitno VARCHAR(50),
    isim VARCHAR(100),
    irk VARCHAR(100),
    agirlik DECIMAL(10,2),
    amac VARCHAR(50),
    fiyat DECIMAL(10,2),
    notlar TEXT,
    resim_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_kupeno (kupeno),
    INDEX idx_durum (durum),
    INDEX idx_kategori (kategori),
    INDEX idx_cinsiyet (cinsiyet),
    INDEX idx_anano (anano),
    INDEX idx_babano (babano),
    INDEX idx_sagmal (sagmal),
    INDEX idx_gebelikdurum (gebelikdurum)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- İlişkili tabloları oluşturma

-- Hayvan sağlık kayıtları tablosu
CREATE TABLE IF NOT EXISTS hayvan_saglik (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hayvan_id INT NOT NULL,
    muayene_tarihi DATE NOT NULL,
    teshis VARCHAR(255),
    tedavi TEXT,
    ilac VARCHAR(255),
    doz VARCHAR(100),
    durum VARCHAR(50),
    notlar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hayvan_id) REFERENCES hayvanlar(id) ON DELETE CASCADE,
    INDEX idx_hayvan_id (hayvan_id),
    INDEX idx_muayene_tarihi (muayene_tarihi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hayvan ağırlık kayıtları tablosu
CREATE TABLE IF NOT EXISTS hayvan_agirlik (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hayvan_id INT NOT NULL,
    tarih DATE NOT NULL,
    agirlik DECIMAL(10,2) NOT NULL,
    olcum_tipi VARCHAR(50) DEFAULT 'rutin',
    notlar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hayvan_id) REFERENCES hayvanlar(id) ON DELETE CASCADE,
    INDEX idx_hayvan_id (hayvan_id),
    INDEX idx_tarih (tarih)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hayvan test sonuçları tablosu
CREATE TABLE IF NOT EXISTS hayvan_test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hayvan_id INT NOT NULL,
    test_tipi VARCHAR(50) NOT NULL,
    test_tarihi DATE NOT NULL,
    sonuc VARCHAR(50),
    tespit_no VARCHAR(50),
    yapan_kisi VARCHAR(100),
    notlar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hayvan_id) REFERENCES hayvanlar(id) ON DELETE CASCADE,
    INDEX idx_hayvan_id (hayvan_id),
    INDEX idx_test_tarihi (test_tarihi),
    INDEX idx_sonuc (sonuc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hayvan aşı kayıtları tablosu
CREATE TABLE IF NOT EXISTS hayvan_asi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hayvan_id INT NOT NULL,
    asi_tarihi DATE NOT NULL,
    asi_turu VARCHAR(100) NOT NULL,
    doz VARCHAR(50),
    uygulayan VARCHAR(100),
    sonraki_asi_tarihi DATE,
    notlar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hayvan_id) REFERENCES hayvanlar(id) ON DELETE CASCADE,
    INDEX idx_hayvan_id (hayvan_id),
    INDEX idx_asi_tarihi (asi_tarihi),
    INDEX idx_asi_turu (asi_turu),
    INDEX idx_sonraki_asi_tarihi (sonraki_asi_tarihi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hayvan beslenme kayıtları tablosu
CREATE TABLE IF NOT EXISTS hayvan_beslenme (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hayvan_id INT NOT NULL,
    tarih DATE NOT NULL,
    yem_turu VARCHAR(100) NOT NULL,
    miktar DECIMAL(10,2),
    birim VARCHAR(20),
    notlar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hayvan_id) REFERENCES hayvanlar(id) ON DELETE CASCADE,
    INDEX idx_hayvan_id (hayvan_id),
    INDEX idx_tarih (tarih)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hayvan süt üretim kayıtları tablosu
CREATE TABLE IF NOT EXISTS hayvan_sut (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hayvan_id INT NOT NULL,
    tarih DATE NOT NULL,
    miktar DECIMAL(10,2) NOT NULL,
    sabah_miktar DECIMAL(10,2),
    aksam_miktar DECIMAL(10,2),
    kalite VARCHAR(50),
    notlar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hayvan_id) REFERENCES hayvanlar(id) ON DELETE CASCADE,
    INDEX idx_hayvan_id (hayvan_id),
    INDEX idx_tarih (tarih)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hayvan gebelik takip tablosu
CREATE TABLE IF NOT EXISTS hayvan_gebelik (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hayvan_id INT NOT NULL,
    tohumlama_tarihi DATE NOT NULL,
    boga_no VARCHAR(50),
    durum VARCHAR(50) NOT NULL DEFAULT 'beklemede',
    tespit_tarihi DATE,
    tahmini_dogum_tarihi DATE,
    gercek_dogum_tarihi DATE,
    dogum_sonucu VARCHAR(100),
    notlar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hayvan_id) REFERENCES hayvanlar(id) ON DELETE CASCADE,
    INDEX idx_hayvan_id (hayvan_id),
    INDEX idx_tohumlama_tarihi (tohumlama_tarihi),
    INDEX idx_tespit_tarihi (tespit_tarihi),
    INDEX idx_durum (durum)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hayvan satış kayıtları tablosu
CREATE TABLE IF NOT EXISTS hayvan_satis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hayvan_id INT NOT NULL,
    satis_tarihi DATE,
    satis_tipi VARCHAR(50),
    alici VARCHAR(100),
    fiyat DECIMAL(10,2),
    durum VARCHAR(50) DEFAULT 'beklemede',
    hedef_sirket VARCHAR(100),
    notlar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hayvan_id) REFERENCES hayvanlar(id) ON DELETE CASCADE,
    INDEX idx_hayvan_id (hayvan_id),
    INDEX idx_satis_tarihi (satis_tarihi),
    INDEX idx_durum (durum),
    INDEX idx_hedef_sirket (hedef_sirket)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 