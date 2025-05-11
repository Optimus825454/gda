-- Temizleme işlemleri
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- UUID eklentisini etkinleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Temel fonksiyonları oluştur
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ana tabloları oluştur
CREATE TABLE animals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    animal_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(20) CHECK (gender IN ('ERKEK', 'DİŞİ')),
    breed VARCHAR(100),
    purpose VARCHAR(20) CHECK (purpose IN ('DAMIZLIK', 'KESIMLIK')),
    status VARCHAR(20) DEFAULT 'AKTIF' CHECK (status IN ('AKTIF', 'SATILDI', 'KESILDI')),
    price DECIMAL(10,2),
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    animal_id UUID NOT NULL,
    test_type VARCHAR(50) NOT NULL,
    test_date DATE NOT NULL,
    result VARCHAR(20) CHECK (result IN ('POZITIF', 'NEGATIF', 'BEKLIYOR')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
);

CREATE TABLE sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    animal_id UUID NOT NULL,
    sale_type VARCHAR(20) NOT NULL CHECK (sale_type IN ('DAMIZLIK', 'KESIM')),
    sale_date DATE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    buyer_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'BEKLIYOR' CHECK (status IN ('BEKLIYOR', 'SEVK_EDILDI', 'TAMAMLANDI')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'SAHA_PERSONELI',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT role_check CHECK (role IN ('GULVET_ADMIN', 'ASYAET_ADMIN', 'SAHA_PERSONELI', 'SYSTEM_ADMIN'))
);

-- İndeksleri oluştur
CREATE INDEX idx_animals_status ON animals(status);
CREATE INDEX idx_animals_purpose ON animals(purpose);
CREATE INDEX idx_tests_animal_id ON tests(animal_id);
CREATE INDEX idx_tests_result ON tests(result);
CREATE INDEX idx_sales_animal_id ON sales(animal_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE UNIQUE INDEX idx_user_profiles_lower_email ON user_profiles(LOWER(email));
CREATE UNIQUE INDEX idx_user_profiles_lower_username ON user_profiles(LOWER(username));

-- İzinleri ayarla
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- RLS ayarları
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Politikalar
CREATE POLICY "anon_select" ON animals FOR SELECT TO anon USING (true);
CREATE POLICY "auth_all" ON animals FOR ALL TO authenticated USING (true);

CREATE POLICY "anon_select" ON tests FOR SELECT TO anon USING (true);
CREATE POLICY "auth_all" ON tests FOR ALL TO authenticated USING (true);

CREATE POLICY "anon_select" ON sales FOR SELECT TO anon USING (true);
CREATE POLICY "auth_all" ON sales FOR ALL TO authenticated USING (true);

CREATE POLICY "anon_select" ON user_profiles FOR SELECT TO anon USING (true);
CREATE POLICY "auth_all" ON user_profiles FOR ALL TO authenticated USING (true);

-- Triggerlar
CREATE TRIGGER update_timestamp BEFORE UPDATE ON animals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
