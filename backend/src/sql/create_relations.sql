-- Kan örnekleri tablosu için foreign key
ALTER TABLE blood_samples
ADD CONSTRAINT fk_blood_samples_hayvan
FOREIGN KEY (tag_number) REFERENCES hayvanlar(kupeno)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Hayvan satış tablosu için foreign key
ALTER TABLE hayvan_satis
ADD CONSTRAINT fk_hayvan_satis_hayvan
FOREIGN KEY (hayvan_id) REFERENCES hayvanlar(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Hayvanlar tablosunda indeksler
CREATE INDEX idx_hayvanlar_kategori ON hayvanlar(kategori);
CREATE INDEX idx_hayvanlar_durum ON hayvanlar(durum);
CREATE INDEX idx_hayvanlar_cinsiyet ON hayvanlar(cinsiyet);
CREATE INDEX idx_hayvanlar_gebelikdurum ON hayvanlar(gebelikdurum);
CREATE INDEX idx_hayvanlar_amac ON hayvanlar(amac);
CREATE INDEX idx_hayvanlar_kupeno ON hayvanlar(kupeno); 