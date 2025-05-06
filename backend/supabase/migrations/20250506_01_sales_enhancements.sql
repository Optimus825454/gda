-- Satış tablosuna onaylama ve fatura alanları ekleniyor
ALTER TABLE sale_results 
    ADD COLUMN IF NOT EXISTS approved_by TEXT,
    ADD COLUMN IF NOT EXISTS approval_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS approval_notes TEXT,
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
    ADD COLUMN IF NOT EXISTS cancellation_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS invoice_number TEXT,
    ADD COLUMN IF NOT EXISTS invoice_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS payment_status TEXT,
    ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Ödeme durumu için kontrol kısıtlaması
ALTER TABLE sale_results
    ADD CONSTRAINT sale_payment_status_check 
    CHECK (payment_status IS NULL OR payment_status IN ('BEKLEMEDE', 'ODENDI', 'KISMEN_ODENDI', 'IPTAL'));

-- Ödeme yöntemi için kontrol kısıtlaması
ALTER TABLE sale_results
    ADD CONSTRAINT sale_payment_method_check 
    CHECK (payment_method IS NULL OR payment_method IN ('NAKIT', 'HAVALE', 'KREDI_KARTI', 'CARI_HESAP'));

-- Fatura numarası için indeks oluşturuluyor
CREATE INDEX IF NOT EXISTS idx_sale_results_invoice_number ON sale_results (invoice_number);

-- Onay tarihi için indeks oluşturuluyor
CREATE INDEX IF NOT EXISTS idx_sale_results_approval_date ON sale_results (approval_date);

-- Ödeme durumu için indeks oluşturuluyor
CREATE INDEX IF NOT EXISTS idx_sale_results_payment_status ON sale_results (payment_status);

COMMENT ON COLUMN sale_results.approved_by IS 'Satışı onaylayan kişi';
COMMENT ON COLUMN sale_results.approval_date IS 'Satış onay tarihi';
COMMENT ON COLUMN sale_results.approval_notes IS 'Satış onay notları';
COMMENT ON COLUMN sale_results.cancellation_reason IS 'Satış iptal nedeni';
COMMENT ON COLUMN sale_results.cancellation_date IS 'Satış iptal tarihi';
COMMENT ON COLUMN sale_results.invoice_number IS 'Fatura numarası';
COMMENT ON COLUMN sale_results.invoice_date IS 'Fatura tarihi';
COMMENT ON COLUMN sale_results.payment_status IS 'Ödeme durumu (BEKLEMEDE, ODENDI, KISMEN_ODENDI, IPTAL)';
COMMENT ON COLUMN sale_results.payment_date IS 'Ödeme tarihi';
COMMENT ON COLUMN sale_results.payment_method IS 'Ödeme yöntemi (NAKIT, HAVALE, KREDI_KARTI, CARI_HESAP)'; 