-- Kullanıcıları resetleme ve yeni admin kullanıcısı ekleme script'i
-- DİKKAT: Bu script tüm kullanıcıları ve ilgili verileri siler!

-- Başlamadan önce tanımlama alanı
DO $$
DECLARE
    admin_email TEXT := 'iki';
    admin_password TEXT := '518518';  -- Güçlü bir şifre kullanın!
    admin_username TEXT := 'admin';
    admin_id UUID;  -- admin_id değişkenini tanımlıyoruz
BEGIN
    -- 1. RLS kısıtlamalarını geçici olarak devre dışı bırak
    EXECUTE 'ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;';
    EXECUTE 'ALTER TABLE IF EXISTS public.user_roles DISABLE ROW LEVEL SECURITY;';

    -- 2. İlişkili verileri temizle (cascade silme çalışmayabilir, manuel siliyoruz)
    DELETE FROM public.user_roles;
    DELETE FROM public.user_profiles;
    
    -- 3. Auth tablosundaki tüm kullanıcıları ve oturumları temizle
    -- Oturumları temizle
    DELETE FROM auth.sessions;
    DELETE FROM auth.refresh_tokens;
    
    -- Identities temizle
    DELETE FROM auth.identities;
    
    -- Kullanıcıları temizle
    DELETE FROM auth.users;
    
    -- 4. Yeni admin kullanıcısı oluştur
    INSERT INTO auth.users (
        instance_id,
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        last_sign_in_at
    ) 
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(), -- rastgele UUID oluştur
        admin_email,
        crypt(admin_password, gen_salt('bf')), -- şifreyi güvenli bir şekilde hash'le
        now(),  -- email onay zamanı
        now(),  -- oluşturulma zamanı
        now(),  -- güncellenme zamanı
        now()   -- son giriş zamanı
    ) 
    RETURNING id INTO STRICT admin_id; -- admin_id değişkenine oluşturulan kullanıcının ID'sini ata
    
    -- 5. Admin kullanıcı için profil oluştur
    -- Hata nedeniyle tablo yapısını düzeltiyoruz (user_id sütunu yok)
    INSERT INTO public.user_profiles (
        id, -- Muhtemelen bu ID alanı hem birincil anahtar hem de user ID olarak kullanılıyor
        username, 
        email, 
        first_name, 
        last_name, 
        created_at, 
        updated_at
    )
    VALUES (
        admin_id, -- Kullanıcı ID'si olarak admin_id kullanılıyor
        admin_username,
        admin_email,
        'System',
        'Admin',
        now(),
        now()
    );
    
    -- 6. Admin kullanıcı için rol oluştur
    -- user_roles tablosunun yapısını kontrol edelim
    INSERT INTO public.user_roles (
        user_id, -- Eğer bu sütun adı da farklıysa güncellememiz gerekebilir
        role,
        created_at,
        updated_at
    )
    VALUES (
        admin_id,
        'SYSTEM_ADMIN',
        now(),
        now()
    );
    
    -- 7. RLS kısıtlamalarını tekrar etkinleştir (isteğe bağlı)
    -- EXECUTE 'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;';
    -- EXECUTE 'ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;';
    
    -- Başarı mesajı
    RAISE NOTICE 'Kullanıcı resetleme başarılı! Admin kullanıcısı oluşturuldu: %, ID: %', admin_email, admin_id;
END $$;