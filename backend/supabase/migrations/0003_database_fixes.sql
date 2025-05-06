-- 1. notifications tablosunu oluştur
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    status VARCHAR(20) DEFAULT 'UNREAD' CHECK (status IN ('READ', 'UNREAD')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- notifications tablosu için updated_at trigger
CREATE TRIGGER update_notifications_timestamp
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- notifications için RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- notifications için politikalar
CREATE POLICY "users_read_own_notifications" 
    ON notifications FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_notifications" 
    ON notifications FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id);

-- 2. health_records tablosunu snake_case formatına dönüştür
ALTER TABLE health_records 
    RENAME COLUMN "animalId" TO "animal_id";
ALTER TABLE health_records 
    RENAME COLUMN "testType" TO "test_type";
ALTER TABLE health_records 
    RENAME COLUMN "testResult" TO "test_result";
ALTER TABLE health_records 
    RENAME COLUMN "performedBy" TO "performed_by";
ALTER TABLE health_records 
    RENAME COLUMN "testDate" TO "test_date";

-- 3. health_records için RLS politikaları
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

-- Authenticated kullanıcılar için tüm işlemlere izin ver
CREATE POLICY "authenticated_users_all_operations"
    ON health_records
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Anon kullanıcılar için sadece okuma izni
CREATE POLICY "anon_users_select_only"
    ON health_records
    FOR SELECT
    TO anon
    USING (true);

-- İndeksler
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_health_records_animal_id ON health_records(animal_id);