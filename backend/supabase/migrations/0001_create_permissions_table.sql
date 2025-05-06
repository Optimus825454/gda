-- 0001_create_permissions_table.sql

-- Permissions Tablosu
CREATE TABLE public.permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL, -- İzin kodu (örn: MANAGE_USERS)
    name VARCHAR(255) NOT NULL,        -- İzin adı (örn: Kullanıcıları Yönet)
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS (Row Level Security) Aktifleştirme
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- İzinler için politikalar (Örnek: Sadece yöneticiler okuyabilir/yazabilir)
-- Bu politikalar projenizin güvenlik gereksinimlerine göre ayarlanmalıdır.
-- Şimdilik basit bir politika ekleyelim (authenticated kullanıcılar okuyabilir)
CREATE POLICY "Allow authenticated read access" ON public.permissions
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Service role için açıkça SELECT izni ver (Normalde gerekli olmamalı)
GRANT SELECT ON TABLE public.permissions TO service_role;

-- Gerekli izinleri ekle (Projenizdeki tüm izinleri buraya ekleyin)
INSERT INTO public.permissions (code, name, description) VALUES
    ('MANAGE_USERS', 'Kullanıcı Yönetimi', 'Kullanıcıları ekleme, silme, güncelleme ve rollerini yönetme'),
    ('READ_ANIMAL', 'Hayvanları Görüntüle', 'Hayvan listesini ve detaylarını görüntüleme'),
    ('WRITE_ANIMAL', 'Hayvan Ekle/Düzenle', 'Yeni hayvan ekleme ve mevcut hayvanları düzenleme'),
    ('MANAGE_TESTS', 'Testleri Yönet', 'Hayvan test sonuçlarını kaydetme ve yönetme'),
    ('MANAGE_SALES', 'Satışları Yönet', 'Hayvan satış işlemlerini yönetme'),
    ('VIEW_REPORTS', 'Raporları Görüntüle', 'Sistem raporlarını görüntüleme'),
    ('READ_SETTINGS', 'Ayarları Görüntüle', 'Uygulama ayarlarını görüntüleme'),
    ('WRITE_SETTINGS', 'Ayarları Düzenle', 'Uygulama ayarlarını düzenleme'),
    ('MANAGE_ROLES', 'Rolleri Yönet', 'Kullanıcı rollerini ve izinlerini yönetme'),
    ('VIEW_AUDIT_LOGS', 'Denetim Kayıtlarını Görüntüle', 'Sistemdeki işlem kayıtlarını görüntüleme');
    -- Diğer gerekli izinleri buraya ekleyin...

-- updated_at trigger fonksiyonu (varsa kullan, yoksa oluştur)
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- permissions tablosu için updated_at trigger'ı
CREATE TRIGGER set_permissions_timestamp
BEFORE UPDATE ON public.permissions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
