-- Ahır/Padok yönetimi için gerekli tablolar ve güncellemeler
CREATE TABLE locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('AHIR', 'PADOK')),
    capacity INTEGER,
    status VARCHAR(20) DEFAULT 'AKTIF',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hayvan lokasyon geçmişi
CREATE TABLE animal_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    animal_id UUID REFERENCES animals(id),
    location_id UUID REFERENCES locations(id),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hayvan tablosuna yeni alanlar ekleme
ALTER TABLE animals 
    ADD COLUMN IF NOT EXISTS tag_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS blood_test_tag VARCHAR(50),
    ADD COLUMN IF NOT EXISTS current_location_id UUID REFERENCES locations(id),
    ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- Kan alma süreci için tablo
CREATE TABLE blood_samples (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    animal_id UUID REFERENCES animals(id),
    tag_number VARCHAR(50) NOT NULL,
    sample_date TIMESTAMPTZ NOT NULL,
    photo_urls JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_animal_locations_animal_id ON animal_locations(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_locations_location_id ON animal_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_blood_samples_animal_id ON blood_samples(animal_id);
CREATE INDEX IF NOT EXISTS idx_blood_samples_tag_number ON blood_samples(tag_number);
CREATE INDEX IF NOT EXISTS idx_animals_current_location ON animals(current_location_id);
CREATE INDEX IF NOT EXISTS idx_animals_tag_number ON animals(tag_number);

-- RLS Politikaları
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_samples ENABLE ROW LEVEL SECURITY;

-- Lokasyon yönetimi politikaları
CREATE POLICY "locations_select_all" ON locations
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "locations_insert_admin" ON locations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('SUPERADMIN', 'GULVET_ADMIN')
        )
    );

CREATE POLICY "locations_update_admin" ON locations
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('SUPERADMIN', 'GULVET_ADMIN')
        )
    );

-- Hayvan lokasyon geçmişi politikaları
CREATE POLICY "animal_locations_select_all" ON animal_locations
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "animal_locations_insert_staff" ON animal_locations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('SUPERADMIN', 'GULVET_ADMIN', 'SAHA_PERSONELI')
        )
    );

-- Kan örneği politikaları
CREATE POLICY "blood_samples_select_all" ON blood_samples
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "blood_samples_insert_staff" ON blood_samples
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role IN ('SUPERADMIN', 'GULVET_ADMIN', 'SAHA_PERSONELI')
        )
    );

-- Triggerlar
CREATE OR REPLACE FUNCTION update_animal_location()
RETURNS TRIGGER AS $$
BEGIN
    -- Önceki aktif lokasyonu kapat
    UPDATE animal_locations
    SET end_date = NEW.start_date
    WHERE animal_id = NEW.animal_id 
    AND end_date IS NULL;

    -- Hayvanın current_location_id'sini güncelle
    UPDATE animals
    SET current_location_id = NEW.location_id
    WHERE id = NEW.animal_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_animal_location
    BEFORE INSERT ON animal_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_animal_location();

-- Lokasyon kapasitesi kontrolü için fonksiyon
CREATE OR REPLACE FUNCTION check_location_capacity()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_capacity INTEGER;
BEGIN
    -- Mevcut hayvan sayısını hesapla
    SELECT COUNT(*) 
    INTO current_count
    FROM animals
    WHERE current_location_id = NEW.location_id
    AND status = 'AKTIF';

    -- Lokasyon kapasitesini al
    SELECT capacity 
    INTO max_capacity
    FROM locations
    WHERE id = NEW.location_id;

    -- Kapasite kontrolü
    IF current_count >= max_capacity THEN
        RAISE EXCEPTION 'Lokasyon kapasitesi dolu. Maksimum kapasite: %', max_capacity;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_location_capacity
    BEFORE INSERT ON animal_locations
    FOR EACH ROW
    EXECUTE FUNCTION check_location_capacity();