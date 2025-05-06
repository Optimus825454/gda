-- Tabloların varlığını kontrol etme ve eksikse oluşturma
-- Bu dosya backend ekibine yardımcı olmak için hazırlandı

-- Settings tablosunun varlığını kontrol et
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'settings'
    ) THEN
        -- settings tablosu yoksa oluştur
        CREATE TABLE public.settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'string',
            group TEXT NOT NULL DEFAULT 'genel',
            description TEXT,
            is_public BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Varsayılan ayarları ekle
        INSERT INTO public.settings (key, value, type, group, description, is_public) VALUES
        ('site.title', 'Hayvancılık Yönetim Sistemi', 'string', 'genel', 'Site başlığı', TRUE),
        ('site.description', 'Hayvancılık işletmeleri için yönetim sistemi', 'string', 'genel', 'Site açıklaması', TRUE),
        ('company.name', 'Gülvet & AsyaEt', 'string', 'genel', 'Şirket adı', TRUE),
        ('notification.email', 'bildirim@example.com', 'string', 'bildirimler', 'Bildirimler için e-posta adresi', FALSE);

        -- RLS Politikaları
        ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

        -- Admin kullanıcılar için tam erişim
        CREATE POLICY admin_settings_policy ON public.settings 
            USING (auth.uid() IN (SELECT id FROM public.users WHERE role_id IN (SELECT id FROM public.roles WHERE name = 'admin')))
            WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role_id IN (SELECT id FROM public.roles WHERE name = 'admin')));

        -- Public ayarlara herkes erişebilir (sadece okuma)
        CREATE POLICY public_settings_policy ON public.settings 
            FOR SELECT
            USING (is_public = TRUE);

        RAISE NOTICE 'settings tablosu oluşturuldu ve varsayılan ayarlar eklendi.';
    ELSE
        RAISE NOTICE 'settings tablosu zaten mevcut.';
    END IF;
END $$;

-- Roles tablosunun varlığını kontrol et
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'roles'
    ) THEN
        -- roles tablosu yoksa oluştur
        CREATE TABLE public.roles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Varsayılan rolleri ekle
        INSERT INTO public.roles (name, description) VALUES
        ('admin', 'Tüm sistem yetkilerine sahip yönetici rolü'),
        ('manager', 'İşletme yöneticisi rolü'),
        ('veteriner', 'Veteriner rolü'),
        ('çalışan', 'Standart çalışan rolü');

        -- RLS Politikaları
        ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

        -- Admin kullanıcılar için tam erişim
        CREATE POLICY admin_roles_policy ON public.roles 
            USING (auth.uid() IN (SELECT id FROM public.users WHERE role_id IN (SELECT id FROM public.roles WHERE name = 'admin')))
            WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role_id IN (SELECT id FROM public.roles WHERE name = 'admin')));

        -- Herkes rolleri görebilir (sadece okuma)
        CREATE POLICY read_roles_policy ON public.roles 
            FOR SELECT
            USING (true);

        RAISE NOTICE 'roles tablosu oluşturuldu ve varsayılan roller eklendi.';
    ELSE
        RAISE NOTICE 'roles tablosu zaten mevcut.';
    END IF;
END $$;

-- Users tablosunun varlığını kontrol et
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
    ) THEN
        -- users tablosu yoksa oluştur
        CREATE TABLE public.users (
            id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
            email TEXT UNIQUE NOT NULL,
            role_id UUID REFERENCES public.roles(id),
            first_name TEXT,
            last_name TEXT,
            username TEXT UNIQUE,
            phone TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- RLS Politikaları
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

        -- Admin kullanıcılar için tam erişim
        CREATE POLICY admin_users_policy ON public.users 
            USING (auth.uid() IN (SELECT id FROM public.users WHERE role_id IN (SELECT id FROM public.roles WHERE name = 'admin')))
            WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role_id IN (SELECT id FROM public.roles WHERE name = 'admin')));

        -- Kullanıcılar kendi bilgilerini görebilir
        CREATE POLICY user_self_read_policy ON public.users 
            FOR SELECT
            USING (auth.uid() = id);

        RAISE NOTICE 'users tablosu oluşturuldu.';
    ELSE
        RAISE NOTICE 'users tablosu zaten mevcut.';
    END IF;
END $$;

-- User Profiles tablosunun yapısını kontrol et
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' AND 
    table_name = 'user_profiles'
ORDER BY 
    ordinal_position;

-- User Roles tablosunun yapısını da kontrol et
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' AND 
    table_name = 'user_roles'
ORDER BY 
    ordinal_position;