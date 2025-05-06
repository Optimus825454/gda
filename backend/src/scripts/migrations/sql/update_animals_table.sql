-- update_animals_table.sql
-- Hayvanlar tablosunu gu00fcnceller ve gerekli alanlaru0131 ekler

-- animal_id alanu0131nu0131 ekle (eu011fer yoksa)
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS animal_id VARCHAR;

-- birth_date alanu0131nu0131 ekle (eu011fer yoksa)
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS birth_date DATE;

-- category alanu0131nu0131 ekle (eu011fer yoksa)
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS category VARCHAR;

-- Eksik alanlaru0131 doldurabilmek iu00e7in u00f6rnek gu00fcncelleme sorgusu
-- UPDATE public.animals SET animal_id = CONCAT('ANM-', id) WHERE animal_id IS NULL;

-- Yau015f hesaplama iu00e7in yardimci fonksiyon
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    age_in_days INTEGER;
    age_text TEXT;
BEGIN
    IF birth_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    age_in_days := EXTRACT(DAY FROM (CURRENT_DATE - birth_date))::INTEGER;
    
    IF age_in_days < 30 THEN
        age_text := age_in_days || ' gu00fcn';
    ELSIF age_in_days < 365 THEN
        age_text := (age_in_days / 30)::INTEGER || ' ay';
    ELSE
        age_text := (age_in_days / 365)::INTEGER || ' yu0131l';
    END IF;
    
    RETURN age_text;
END;
$$;