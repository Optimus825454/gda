-- Veritabanı şema düzeltmeleri
-- 4 Mayıs 2025 tarihinde güncellendi

-- =========================================
-- 1. user_profiles tablosu düzeltmeleri
-- =========================================

-- Önce user_profiles tablosunda user_id sütunu olup olmadığını kontrol et
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'user_id'
    ) THEN
        -- user_id sütunu yoksa ekle
        ALTER TABLE public.user_profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- id değerlerini user_id sütununa kopyala (geçici çözüm)
        UPDATE public.user_profiles SET user_id = id;
        
        -- Benzersizlik kısıtlaması ekle
        ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
        
        -- İndeks oluştur
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
    END IF;
END
$$;

-- phone_number sütunu varsa kaldır
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE public.user_profiles DROP COLUMN phone_number;
    END IF;
END
$$;

-- =========================================
-- 2. tests tablosu düzeltmeleri
-- =========================================

-- tests tablosunda status sütunu olup olmadığını kontrol et
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tests'
        AND column_name = 'status'
    ) THEN
        -- status sütunu yoksa ekle
        ALTER TABLE public.tests ADD COLUMN status VARCHAR(20) DEFAULT 'BEKLIYOR' 
        CHECK (status IN ('BEKLIYOR', 'DEVAM_EDIYOR', 'TAMAMLANDI'));
        
        -- Varsayılan değerleri doldur
        -- POZITIF veya NEGATIF sonucu olan testlerin durumunu TAMAMLANDI yap
        UPDATE public.tests SET status = 'TAMAMLANDI' 
        WHERE result IN ('POZITIF', 'NEGATIF');
        
        -- BEKLIYOR sonucu olan testleri DEVAM_EDIYOR olarak güncelle
        UPDATE public.tests SET status = 'DEVAM_EDIYOR' 
        WHERE result = 'BEKLIYOR';
        
        -- İndeks oluştur
        CREATE INDEX IF NOT EXISTS idx_tests_status ON public.tests(status);
    END IF;
END
$$;

-- =========================================
-- 3. İzinleri güncelle
-- =========================================

-- Tüm tablolar için izinleri yenile
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- =========================================
-- 4. sale_results tablosu düzeltmeleri
-- =========================================

-- Önce sale_results tablosunun varlığını kontrol et ve yoksa oluştur
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema='public' 
        AND table_name='sale_results'
    ) THEN
        -- Tablo yoksa oluştur
        CREATE TABLE IF NOT EXISTS public.sale_results (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            animal_id UUID NOT NULL,
            sale_type VARCHAR(20) DEFAULT 'KESIM' CHECK (sale_type IN ('DAMIZLIK', 'KESIM')),
            sale_date TIMESTAMPTZ DEFAULT NOW(),
            sale_price DECIMAL DEFAULT 0,
            company_name VARCHAR(100),
            buyer_info TEXT,
            transport_info TEXT,
            status VARCHAR(20) DEFAULT 'BEKLEMEDE' CHECK (status IN ('BEKLEMEDE', 'TAMAMLANDI', 'IPTAL')),
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- İndeks oluştur
        CREATE INDEX IF NOT EXISTS idx_sale_results_status ON public.sale_results(status);
        CREATE INDEX IF NOT EXISTS idx_sale_results_animal_id ON public.sale_results(animal_id);
        
        -- İzinleri ayarla
        ALTER TABLE public.sale_results ENABLE ROW LEVEL SECURITY;
        GRANT ALL ON TABLE public.sale_results TO authenticated;
        GRANT ALL ON TABLE public.sale_results TO service_role;
    ELSE
        -- Tablo varsa sütunları kontrol et ve gerekirse ekle
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'sale_results'
            AND column_name = 'sale_type'
        ) THEN
            -- sale_type sütunu yoksa ekle
            ALTER TABLE public.sale_results ADD COLUMN sale_type VARCHAR(20) DEFAULT 'KESIM' 
            CHECK (sale_type IN ('DAMIZLIK', 'KESIM'));
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'sale_results'
            AND column_name = 'sale_price'
        ) THEN
            -- sale_price sütunu yoksa ekle
            ALTER TABLE public.sale_results ADD COLUMN sale_price DECIMAL DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'sale_results'
            AND column_name = 'status'
        ) THEN
            -- status sütunu yoksa ekle
            ALTER TABLE public.sale_results ADD COLUMN status VARCHAR(20) DEFAULT 'BEKLEMEDE' 
            CHECK (status IN ('BEKLEMEDE', 'TAMAMLANDI', 'IPTAL'));
            
            -- İndeks oluştur
            CREATE INDEX IF NOT EXISTS idx_sale_results_status ON public.sale_results(status);
        END IF;
    END IF;
END
$$;

-- =========================================
-- 5. animals tablosu düzeltmeleri
-- =========================================

DO $$
BEGIN
    -- category sütunu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'animals' AND column_name = 'category'
    ) THEN
        ALTER TABLE public.animals ADD COLUMN category VARCHAR(20) DEFAULT 'INEK' 
            CHECK (category IN ('INEK', 'GEBE_DUVE', 'GENC_DISI', 'BUZAGI'));
    END IF;

    -- test_result sütunu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'animals' AND column_name = 'test_result'
    ) THEN
        ALTER TABLE public.animals ADD COLUMN test_result VARCHAR(20) DEFAULT NULL 
            CHECK (test_result IN ('BEKLEMEDE', 'POZITIF', 'NEGATIF'));
    END IF;

    -- destination_company sütunu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'animals' AND column_name = 'destination_company'
    ) THEN
        ALTER TABLE public.animals ADD COLUMN destination_company VARCHAR(20) DEFAULT NULL 
            CHECK (destination_company IN ('GULVET', 'ASYAET'));
    END IF;

    -- sale_status sütunu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'animals' AND column_name = 'sale_status'
    ) THEN
        ALTER TABLE public.animals ADD COLUMN sale_status VARCHAR(20) DEFAULT 'BEKLEMEDE' 
            CHECK (sale_status IN ('SATISA_HAZIR', 'SATILDI', 'BEKLEMEDE'));
    END IF;

    -- sale_date sütunu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'animals' AND column_name = 'sale_date'
    ) THEN
        ALTER TABLE public.animals ADD COLUMN sale_date TIMESTAMPTZ DEFAULT NULL;
    END IF;

    -- sale_price sütunu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'animals' AND column_name = 'sale_price'
    ) THEN
        ALTER TABLE public.animals ADD COLUMN sale_price DECIMAL DEFAULT 0;
    END IF;
END
$$;

-- =========================================
-- 6. audit_logs tablosunu oluştur
-- =========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema='public' 
        AND table_name='audit_logs'
    ) THEN
        CREATE TABLE IF NOT EXISTS public.audit_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES auth.users(id),
            action VARCHAR(50) NOT NULL,
            entity VARCHAR(50) NOT NULL,
            entity_id UUID,
            details JSONB,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- İndeksler
        CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
        CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
        CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity);
        CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

        -- RLS politikaları
        ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
        
        -- Yöneticiler tüm logları görebilir
        CREATE POLICY "Admins can view all logs" ON public.audit_logs
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles up
                    WHERE up.user_id = auth.uid()
                    AND up.role IN ('SYSTEM_ADMIN', 'ADMIN')
                )
            );

        -- Kullanıcılar kendi loglarını görebilir
        CREATE POLICY "Users can view own logs" ON public.audit_logs
            FOR SELECT USING (user_id = auth.uid());
            
        -- Yetkilendirmeler
        GRANT ALL ON public.audit_logs TO service_role;
        GRANT SELECT ON public.audit_logs TO authenticated;
    END IF;
END
$$;