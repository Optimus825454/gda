/**
 * TestResult.js - Test sonuçları veri modeli
 */

// const { supabaseAdmin: supabase } = require( '../config/supabase' ); // Supabase kaldırıldı
const { pool } = require('../config/mysql'); // MySQL pool eklendi

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
        console.warn('TestResult.save() henüz MySQL için tam olarak uyarlanmadı.');
        throw new Error('TestResult.save() henüz MySQL için tam olarak uyarlanmadı.');
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query('SELECT * FROM blood_samples WHERE id = ?', [id]);
            if (rows.length === 0) {
                // throw new Error('Test sonucu bulunamadı'); // Controller zaten boş veri dönebilir veya 404 üretebilir
                return null; // Veya isteğe bağlı olarak hata fırlatılabilir
            }
            return new TestResult(rows[0]);
        } catch (error) {
            console.error(`Error in TestResult.findById for id ${id}:`, error);
            throw error;
        }
    }

    static async findByKupeno(kupeno) { // findByAnimalId -> findByKupeno, animalId -> kupeno
        try {
            // Önce hayvanlar tablosundan kupeno ile hayvanın id'sini bulalım
            const [hayvan] = await pool.query('SELECT id FROM hayvanlar WHERE kupeno = ?', [kupeno]);
            
            if (hayvan.length === 0) {
                // Küpe numarasına sahip hayvan bulunamadı
                return [];
            }
            
            const hayvanId = hayvan[0].id;
            
            // Şimdi blood_samples tablosunda bu hayvan id'si ile arama yapalım
            const [rows] = await pool.query('SELECT * FROM blood_samples WHERE animal_id = ? ORDER BY sample_date DESC', [hayvanId]);
            return rows.map(result => new TestResult(result));
        } catch (error) {
            console.error(`Error in TestResult.findByKupeno for kupeno ${kupeno}:`, error);
            throw error;
        }
    }

    static async findByStatus(status) {
        // const { data, error } = await supabase
        //     .from('blood_samples')
        //     .select('*')
        //     .eq('status', status)
        //     .order('sample_date', { ascending: false });

        // if (error) throw error;
        // return data.map(result => new TestResult(result));
        try {
            const [rows] = await pool.query('SELECT * FROM blood_samples WHERE status = ? ORDER BY sample_date DESC', [status]);
            return rows.map(result => new TestResult(result));
        } catch (error) {
            console.error(`Error in TestResult.findByStatus for status ${status}:`, error);
            throw error;
        }
    }

    static async findAll() {
        // const { data, error } = await supabase
        //     .from('blood_samples')
        //     .select('*')
        //     .order('sample_date', { ascending: false });

        // if (error) throw error;
        // return data.map(result => new TestResult(result));
        try {
            const [rows] = await pool.query('SELECT * FROM blood_samples ORDER BY sample_date DESC');
            return rows.map(result => new TestResult(result));
        } catch (error) {
            console.error('Error in TestResult.findAll:', error);
            throw error;
        }
    }

    static async findPendingTests() {
        console.warn('TestResult.findPendingTests() henüz MySQL için uyarlanmadı.');
        return []; // Geçici olarak boş dizi döndür
    }

    static async getTestStatistics() {
        console.warn('TestResult.getTestStatistics() henüz MySQL için uyarlanmadı.');
        return {}; // Geçici olarak boş obje döndür
    }

    // Toplu test sonucu kaydetme
    static async bulkCreate(testResults) {
        console.warn('TestResult.bulkCreate() henüz MySQL için uyarlanmadı.');
        return { success: [], errors: [{ data: testResults, error: 'Henüz MySQL için uyarlanmadı.' }] };
    }

    static async findByDetectionTag(tagNumber) {
        console.warn('TestResult.findByDetectionTag() henüz MySQL için uyarlanmadı.');
        return null; // Geçici olarak null döndür
    }
}

module.exports = TestResult;