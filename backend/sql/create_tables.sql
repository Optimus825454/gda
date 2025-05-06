-- Supabase için gerekli tabloları oluştur

-- User Profiles Tablosu
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

-- Row Level Security kuralları
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcıların kendi profillerini görüntülemelerine izin ver
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcıların kendi profillerini güncellemelerine izin ver
CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- User Roles Tablosu
CREATE TABLE IF NOT EXISTS public.user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Row Level Security kuralları
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Admin kullanıcılar tüm rolleri görüntüleyebilir (daha sonra izin kurallarına göre düzenlenecek)
CREATE POLICY "Admin users can view all roles" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'SYSTEM_ADMIN'
        )
    );

-- Kullanıcılar kendi rollerini görüntüleyebilir
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- İlk sistem admin kullanıcısı için bir fonksiyon
-- NOT: Bu fonksiyonu kullanmadan önce Supabase'de bir admin kullanıcısını
-- auth.users tablosuna manuel olarak ekleyin
CREATE OR REPLACE FUNCTION create_initial_admin(admin_email TEXT, admin_username TEXT)
RETURNS VOID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Kullanıcı ID'sini al
    SELECT id INTO user_id FROM auth.users WHERE email = admin_email;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Belirtilen e-posta adresiyle kullanıcı bulunamadı: %', admin_email;
    END IF;
    
    -- Kullanıcı profili ekle
    INSERT INTO public.user_profiles (id, user_id, username, email)
    VALUES (user_id, user_id, admin_username, admin_email)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Admin rolü ekle
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_id, 'SYSTEM_ADMIN')
    ON CONFLICT (user_id) DO UPDATE SET role = 'SYSTEM_ADMIN';
    
END;
$$ language 'plpgsql';

-- Kullanım örneği:
-- SELECT create_initial_admin('admin@example.com', 'admin');