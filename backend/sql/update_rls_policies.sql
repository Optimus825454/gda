-- RLS Politikalarını Güncelleme

-- 1. Servis rolü için politikalar
-- Service role için geçici olarak RLS'yi atla
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 2. Servis rolüne bypass yetkisi ver
DROP POLICY IF EXISTS "Service role bypass RLS" ON public.user_roles;
CREATE POLICY "Service role bypass RLS for user_roles" ON public.user_roles
    USING (true)
    WITH CHECK (true);

-- 3. Kullanıcı profilleri tablosu için benzer işlemleri yap
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role bypass RLS" ON public.user_profiles;
CREATE POLICY "Service role bypass RLS for user_profiles" ON public.user_profiles
    USING (true)
    WITH CHECK (true);

-- 4. Anon rolüne görüntüleme yetkisi ver
DROP POLICY IF EXISTS "Anon can view profiles" ON public.user_profiles;
CREATE POLICY "Anon can view profiles" ON public.user_profiles 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon can view roles" ON public.user_roles;
CREATE POLICY "Anon can view roles" ON public.user_roles
    FOR SELECT USING (true);

-- 5. Public şemaları için anon rolüne yetki ver
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 6. Tabloları anon ve authenticated rolüne görüntüleme yetkisi ver
GRANT SELECT ON TABLE public.user_roles TO anon;
GRANT SELECT ON TABLE public.user_roles TO authenticated;
GRANT SELECT ON TABLE public.user_profiles TO anon;
GRANT SELECT ON TABLE public.user_profiles TO authenticated;

-- YENİ EKLENDİ: role_permissions, roles, permissions tabloları için RLS politikaları
-- 1. role_permissions tablosu için RLS devre dışı bırak
ALTER TABLE public.role_permissions DISABLE ROW LEVEL SECURITY;

-- 2. role_permissions tablosu için RLS politikası tanımla
DROP POLICY IF EXISTS "Service role bypass RLS" ON public.role_permissions;
DROP POLICY IF EXISTS "Service role bypass RLS for role_permissions" ON public.role_permissions;
CREATE POLICY "Service role bypass RLS for role_permissions" ON public.role_permissions
    USING (true)
    WITH CHECK (true);

-- 3. roles tablosu için RLS devre dışı bırak
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;

-- 4. roles tablosu için RLS politikası tanımla
DROP POLICY IF EXISTS "Service role bypass RLS" ON public.roles;
DROP POLICY IF EXISTS "Service role bypass RLS for roles" ON public.roles;
CREATE POLICY "Service role bypass RLS for roles" ON public.roles
    USING (true)
    WITH CHECK (true);

-- 5. permissions tablosu için RLS devre dışı bırak
ALTER TABLE public.permissions DISABLE ROW LEVEL SECURITY;

-- 6. permissions tablosu için RLS politikası tanımla
DROP POLICY IF EXISTS "Service role bypass RLS" ON public.permissions;
DROP POLICY IF EXISTS "Service role bypass RLS for permissions" ON public.permissions;
CREATE POLICY "Service role bypass RLS for permissions" ON public.permissions
    USING (true)
    WITH CHECK (true);

-- 7. authenticated ve anon rollerine izin ver
DROP POLICY IF EXISTS "Anon can view role_permissions" ON public.role_permissions;
CREATE POLICY "Anon can view role_permissions" ON public.role_permissions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon can view roles" ON public.roles;
CREATE POLICY "Anon can view roles" ON public.roles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon can view permissions" ON public.permissions;
CREATE POLICY "Anon can view permissions" ON public.permissions
    FOR SELECT USING (true);

-- Yeni: Ek yetkilendirmeler
GRANT ALL ON TABLE public.role_permissions TO postgres, service_role;
GRANT ALL ON TABLE public.roles TO postgres, service_role;
GRANT ALL ON TABLE public.permissions TO postgres, service_role;
GRANT ALL ON TABLE public.user_roles TO postgres, service_role;
GRANT ALL ON TABLE public.user_profiles TO postgres, service_role;

GRANT SELECT ON TABLE public.role_permissions TO anon;
GRANT SELECT ON TABLE public.role_permissions TO authenticated;
GRANT SELECT ON TABLE public.roles TO anon;
GRANT SELECT ON TABLE public.roles TO authenticated;
GRANT SELECT ON TABLE public.permissions TO anon;
GRANT SELECT ON TABLE public.permissions TO authenticated;

-- 7. Servis rolüne tam yetki ver (istenirse tekrar RLS etkinleştirilebilir)
-- ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;