-- fix-permissions.sql
-- Veritabanı izinlerini düzeltmek için SQL sorguları

-- Permissions tablosunda eksik modül sütununu ekle
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS module VARCHAR(50) DEFAULT 'general';

-- Settings tablosu için RLS kurallarını düzelt
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- Users tablosu için RLS kurallarını düzelt
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Gerekli tabloları servis rolüne erişilebilir yap
GRANT ALL PRIVILEGES ON TABLE public.users TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.settings TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.permissions TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.roles TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.user_permissions TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.role_permissions TO service_role;

-- Anon role için de okuma izinleri ver
GRANT SELECT ON TABLE public.settings TO anon;
GRANT SELECT ON TABLE public.users TO anon;
GRANT SELECT ON TABLE public.permissions TO anon;
GRANT SELECT ON TABLE public.roles TO anon;
GRANT SELECT ON TABLE public.user_permissions TO anon;
GRANT SELECT ON TABLE public.role_permissions TO anon;

-- Authenticated role için izinler
GRANT ALL PRIVILEGES ON TABLE public.settings TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.users TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.permissions TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.roles TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.user_permissions TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.role_permissions TO authenticated; 