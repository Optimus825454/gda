-- İzin Hatalarını Düzeltme Komutları
-- Bu SQL dosyası, Supabase'deki izin hatalarını gidermek için tasarlanmıştır.
-- "permission denied for table user_roles" gibi hatalar için çözümler içerir.

-- =========================================
-- 1. TEMEL TABLO ERİŞİM POLİTİKALARI
-- =========================================

-- RLS'yi (Row Level Security) tablolar için devre dışı bırakma
-- Geçici olarak tüm güvenlik kısıtlamalarını kaldırır
ALTER TABLE IF EXISTS public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;

-- =========================================
-- 2. SCHEMA ERİŞİM İZİNLERİ
-- =========================================

-- Public şemasına erişim izni verme
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- =========================================
-- 3. TABLO ERİŞİM İZİNLERİ
-- =========================================

-- Servis rolüne tam erişim verme
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Spesifik tablolara yetki verme (eğer yukarıdaki komutlar çalışmazsa)
GRANT ALL ON TABLE public.user_roles TO service_role;
GRANT ALL ON TABLE public.user_profiles TO service_role;

-- Anonim ve kimliği doğrulanmış rollere okuma izni verme
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.user_roles TO anon, authenticated;
GRANT SELECT ON TABLE public.user_profiles TO anon, authenticated;

-- =========================================
-- 4. RLS POLİTİKALARI OLUŞTURMA (İsteğe Bağlı)
-- =========================================

-- EĞER RLS'yi yeniden etkinleştirmek istiyorsanız, aşağıdaki politikalar yararlı olabilir
-- Bu adım isteğe bağlıdır, gerekirse yorum işaretini kaldırın

-- ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Servis rolüne bypass yetkisi verme
CREATE POLICY IF NOT EXISTS "Service Role Bypass Policy for user_roles" 
ON public.user_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service Role Bypass Policy for user_profiles" 
ON public.user_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anonim ve kimliği doğrulanmış rollere SELECT izni verme
CREATE POLICY IF NOT EXISTS "Allow Select for anon and authenticated on user_roles" 
ON public.user_roles FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Allow Select for anon and authenticated on user_profiles" 
ON public.user_profiles FOR SELECT TO anon, authenticated USING (true);

-- =========================================
-- 5. ERROR REPORTING FONKSIYONU
-- =========================================

-- Hata ayıklama için izin durumunu kontrol eden fonksiyon
CREATE OR REPLACE FUNCTION check_table_permissions()
RETURNS TABLE (
    table_name text,
    has_select boolean,
    has_insert boolean,
    has_update boolean,
    has_delete boolean,
    has_rls boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.tablename::text,
        pg_catalog.has_table_privilege(current_user, 'public.' || t.tablename, 'SELECT'),
        pg_catalog.has_table_privilege(current_user, 'public.' || t.tablename, 'INSERT'),
        pg_catalog.has_table_privilege(current_user, 'public.' || t.tablename, 'UPDATE'),
        pg_catalog.has_table_privilege(current_user, 'public.' || t.tablename, 'DELETE'),
        r.oid IS NOT NULL AS has_rls
    FROM pg_catalog.pg_tables t
    LEFT JOIN pg_catalog.pg_class r ON r.relname = t.tablename AND r.relnamespace = (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = t.schemaname)
    LEFT JOIN pg_catalog.pg_rewrite w ON w.ev_class = r.oid
    WHERE t.schemaname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;