-- 0002_create_role_permissions_table.sql

-- Role Permissions İlişki Tablosu
CREATE TABLE public.role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    PRIMARY KEY (role_id, permission_id), -- İki sütun birlikte birincil anahtar

    -- Foreign Key Constraints
    CONSTRAINT fk_role
        FOREIGN KEY(role_id)
        REFERENCES public.roles(id) -- roles tablosunun var olduğunu varsayıyoruz
        ON DELETE CASCADE, -- Rol silinirse ilişkili izinler de silinir

    CONSTRAINT fk_permission
        FOREIGN KEY(permission_id)
        REFERENCES public.permissions(id)
        ON DELETE CASCADE -- İzin silinirse ilişkili rollerden de kaldırılır
);

-- RLS (Row Level Security) Aktifleştirme
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Politikalar (Örnek: Sadece yöneticiler okuyabilir/yazabilir)
-- Bu politikalar projenizin güvenlik gereksinimlerine göre ayarlanmalıdır.
CREATE POLICY "Allow authenticated read access" ON public.role_permissions
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- İndeksler (Performans için)
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- Başlangıçta rollere izin atamaları (Örnek)
-- Bu kısım, roller tablosu oluşturulduktan ve ID'leri bilindikten sonra doldurulmalı
-- VEYA uygulama içinden yönetilmelidir.
-- Örnek: SYSTEM_ADMIN rolüne tüm izinleri atama (Rol ID'si 1 varsayıldı)
-- INSERT INTO public.role_permissions (role_id, permission_id)
-- SELECT 1, id FROM public.permissions;

-- Örnek: GULVET_ADMIN rolüne belirli izinleri atama (Rol ID'si 2 varsayıldı)
-- INSERT INTO public.role_permissions (role_id, permission_id)
-- SELECT 2, id FROM public.permissions WHERE code IN ('READ_ANIMAL', 'WRITE_ANIMAL', 'MANAGE_TESTS', 'MANAGE_SALES', 'VIEW_REPORTS', 'MANAGE_USERS');
