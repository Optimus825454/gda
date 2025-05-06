-- Supabase Auth Şema Sorunları İçin Düzeltme Script'i
-- "Database error querying schema" hatasını çözmek için

-- =========================================
-- 1. AUTH ŞEMASINA ERİŞİM İZİNLERİ
-- =========================================

-- Auth şemasına erişim izinleri
GRANT USAGE ON SCHEMA auth TO service_role, anon, authenticated;

-- Auth şemasındaki tablolara okuma izni
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA auth TO service_role;

-- =========================================
-- 2. AUTH KULLANICI TABLOSUNA ERİŞİM
-- =========================================

-- Kullanıcılar tablosuna özel izinler
GRANT SELECT ON TABLE auth.users TO service_role, anon, authenticated;
GRANT SELECT ON TABLE auth.identities TO service_role;
GRANT SELECT ON TABLE auth.sessions TO service_role;

-- =========================================
-- 3. EKSIK OLABILECEK TABLOLARI OLUŞTUR
-- =========================================

-- Auth schema extension kontrolü ve eksik tabloların eklenmesi
-- Bu adım sadece tabloların eksik olması durumunda gerekli

DO $$
BEGIN
    -- Auth extension kontrol et
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
    END IF;

    -- Auth extension kontrolü
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'auth') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
END
$$;

-- =========================================
-- 4. KULLANICI ŞEMA İLİŞKİLERİ
-- =========================================

-- user_profiles ve user_roles tablolarını kontrol et ve gerekirse oluştur
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id),
    UNIQUE(username)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- =========================================
-- 5. SERVICE ROLE BYPASS YETKİLERİ
-- =========================================

-- RLS'yi tablolar için devre dışı bırak
ALTER TABLE IF EXISTS public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;

-- =========================================
-- 6. SUPABASE AUTH FONKSİYONLARINI DÜZELT
-- =========================================

-- Kimlik doğrulama fonksiyonlarını güncelle
ALTER FUNCTION auth.authenticate() OWNER TO service_role;
ALTER FUNCTION auth.get_config() OWNER TO service_role;

GRANT EXECUTE ON FUNCTION auth.authenticate() TO service_role;
GRANT EXECUTE ON FUNCTION auth.get_config() TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO service_role;

-- =========================================
-- 7. ÖRNEK BİR KULLANICI OLUŞTUR (İSTEĞE BAĞLI)
-- =========================================

-- Bu adım isteğe bağlıdır ve sistem test için temel bir kullanıcı ekler
-- Eğer zaten kullanıcınız varsa bu adımı atlayabilirsiniz

/* 
INSERT INTO auth.users (
    instance_id,
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'admin@example.com',
    crypt('password', gen_salt('bf')),
    now(),
    now(),
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;

-- Profil bilgilerini ekle
WITH new_user AS (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)
INSERT INTO public.user_profiles (id, user_id, username, email, first_name, last_name)
SELECT id, id, 'admin', 'admin@example.com', 'Admin', 'User'
FROM new_user
ON CONFLICT (user_id) DO NOTHING;

-- Admin rolü ekle
WITH new_user AS (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'SYSTEM_ADMIN'
FROM new_user
ON CONFLICT (user_id) DO UPDATE SET role = 'SYSTEM_ADMIN';
*/