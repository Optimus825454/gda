/**
 * TestResult.js - Test sonuçları veri modeli
 */

const { supabaseAdmin: supabase } = require( '../config/supabase' );

class TestResult {
    static TEST_STATUSES = {
        BEKLEMEDE: 'BEKLEMEDE',
        TAMAMLANDI: 'TAMAMLANDI',
        IPTAL: 'IPTAL'
    };

    static TEST_RESULTS = {
        POZITIF: 'POZITIF',
        NEGATIF: 'NEGATIF'
    };

    constructor( data = {} ) {
        this.id = data.id;
        this.animalId = data.animal_id;
        this.tagNumber = data.tag_number;
        
        // Tarih alanı için güvenli dönüşüm
        if (data.sample_date) {
            if (data.sample_date instanceof Date) {
                this.sampleDate = data.sample_date;
            } else if (typeof data.sample_date === 'string') {
                this.sampleDate = new Date(data.sample_date);
            } else {
                this.sampleDate = new Date();
            }
        } else {
            this.sampleDate = new Date();
        }

        this.notes = data.notes;
        this.createdBy = data.created_by;
        this.createdAt = data.created_at ? new Date(data.created_at) : new Date();
        this.updatedAt = data.updated_at ? new Date(data.updated_at) : new Date();
        this.photoUrls = data.photo_urls || [];
        this.status = data.status || TestResult.TEST_STATUSES.BEKLEMEDE;
        this.result = data.result;
    }

    // Tarih formatını güvenli bir şekilde döndüren yardımcı metod
    formatDate(date) {
        try {
            if (date instanceof Date) {
                return date.toISOString();
            } else if (typeof date === 'string') {
                return new Date(date).toISOString();
            }
            return new Date().toISOString();
        } catch (error) {
            console.warn('Tarih formatlanırken hata:', error);
            return new Date().toISOString();
        }
    }

    validate() {
        // Sadece hayvan ID kontrolü yapılacak, diğer tüm kontroller kaldırıldı
        const errors = [];

        if ( !this.animalId ) {
            errors.push( 'Hayvan ID zorunludur' );
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    async save() {
        try {
            // Detaylı validasyon
            if (!this.animalId) {
                throw new Error('Hayvan ID (UUID) zorunludur');
            }

            if (!this.tagNumber) {
                throw new Error('Tespit numarası zorunludur');
            }

            // Veri hazırlama
            const testData = {
                id: this.id,
                animal_id: this.animalId,
                tag_number: this.tagNumber,
                sample_date: this.formatDate(this.sampleDate),
                notes: this.notes,
                created_by: this.createdBy,
                created_at: this.formatDate(this.createdAt),
                updated_at: this.formatDate(this.updatedAt),
                photo_urls: this.photoUrls,
                status: this.status,
                result: this.result
            };

            console.log('Kan numunesi kaydediliyor:', {
                ...testData,
                sample_date: testData.sample_date
            });

            const { data, error } = await supabase
                .from('blood_samples')
                .insert(testData)
                .select()
                .single();

            if (error) {
                if (error.code === '42501') {
                    throw new Error('Kan numunesi kaydetme yetkiniz yok');
                } else if (error.code === '23503') {
                    throw new Error('Belirtilen hayvan ID\'si (UUID) geçersiz');
                }
                console.error('Kan numunesi kaydetme hatası:', error);
                throw error;
            }
            
            if (!data) {
                throw new Error('Kan numunesi kaydedildi ancak veri dönmedi');
            }
            
            console.log('Kan numunesi başarıyla kaydedildi:', data);
            return new TestResult(data);
        } catch (error) {
            console.error('Kan numunesi kaydetme hatası:', error);
            throw error;
        }
    }

    static async findById(id) {
        const { data, error } = await supabase
            .from('blood_samples')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) throw new Error('Test sonucu bulunamadı');
        return new TestResult(data);
    }

    static async findByAnimalId(animalId) {
        const { data, error } = await supabase
            .from('blood_samples')
            .select('*')
            .eq('animal_id', animalId)
            .order('sample_date', { ascending: false });

        if (error) throw error;
        return data.map(result => new TestResult(result));
    }

    static async findByStatus(status) {
        const { data, error } = await supabase
            .from('blood_samples')
            .select('*')
            .eq('status', status)
            .order('sample_date', { ascending: false });

        if (error) throw error;
        return data.map(result => new TestResult(result));
    }

    static async findAll() {
        const { data, error } = await supabase
            .from('blood_samples')
            .select('*')
            .order('sample_date', { ascending: false });

        if (error) throw error;
        return data.map(result => new TestResult(result));
    }

    static async findPendingTests() {
        const { data, error } = await supabase
            .from('blood_samples')
            .select('*')
            .eq('status', TestResult.TEST_STATUSES.BEKLEMEDE)
            .order('sample_date', { ascending: true });

        if (error) throw error;
        return data.map(result => new TestResult(result));
    }

    static async getTestStatistics() {
        const { data, error } = await supabase
            .from('blood_samples')
            .select(`
                result,
                destination_company,
                count(*)
            `)
            .not('result', 'is', null)
            .group('result, destination_company');

        if (error) throw error;
        return data;
    }

    // Toplu test sonucu kaydetme
    static async bulkCreate(testResults) {
        const results = {
            success: [],
            errors: []
        };

        for (const testData of testResults) {
            try {
                const test = new TestResult(testData);
                const savedTest = await test.save();

                // Hayvan modelini güncelle
                const { data: animal } = await supabase
                    .from('animals')
                    .update({
                        test_result: test.result,
                        destination_company: test.destinationCompany,
                        test_date: test.sampleDate
                    })
                    .eq('id', test.animalId)
                    .select()
                    .single();

                results.success.push({
                    test: savedTest,
                    animal
                });
            } catch (error) {
                results.errors.push({
                    data: testData,
                    error: error.message
                });
            }
        }

        return results;
    }

    static async findByDetectionTag(tagNumber) {
        try {
            const { data, error } = await supabase
                .from('blood_samples')
                .select('*')
                .eq('tag_number', tagNumber)
                .maybeSingle();

            if (error) {
                throw error;
            }

            return data ? new TestResult(data) : null;
        } catch (error) {
            console.error('Tespit No ile test aranırken hata:', error);
            return null;
        }
    }
}

module.exports = TestResult;