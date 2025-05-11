/**
 * Animal.js - Hayvan veri modeli
 */

const { supabaseAdmin } = require( '../config/supabase' );
const MySQLBaseModel = require('./MySQLBaseModel');
const { pool } = require('../config/mysql');
const moment = require('moment');

class Animal extends MySQLBaseModel {
    static CATEGORIES = {
        INEK: 'INEK',
        GEBE_DUVE: 'GEBE_DUVE',
        TOHUMLU_DUVE: 'TOHUMLU_DUVE',
        DUVE: 'DUVE',
        BUZAGI: 'BUZAGI'
    };

    static TEST_RESULTS = {
        BEKLEMEDE: 'BEKLEMEDE',
        POZITIF: 'POZITIF',
        NEGATIF: 'NEGATIF',
        IPTAL: 'IPTAL'
    };

    static SALE_STATUS = {
        BEKLEMEDE: 'BEKLEMEDE',
        SATISTA: 'SATISTA',
        SATILDI: 'SATILDI',
        IPTAL: 'IPTAL'
    };

    static DESTINATION_COMPANIES = {
        ASYAET: 'ASYAET',
        GULVET: 'GULVET',
        KESIMHANE_A: 'KESIMHANE_A',
        KESIMHANE_B: 'KESIMHANE_B',
        CIFTLIK_A: 'CIFTLIK_A',
        CIFTLIK_B: 'CIFTLIK_B'
    };

    static SALE_PRIORITY = {
        DUSUK: 1,   // İnekler için
        ORTA: 2,    // Buzağılar için
        YUKSEK: 3   // Gebe düve ve genç dişiler için
    };

    static TEST_GROUPS = {
        TEMIZ: 'TEMIZ',       // Negatif test sonuçlu
        SUSPECT: 'SUSPECT',    // Test bekleyen
        IZOLE: 'IZOLE'        // Pozitif test sonuçlu
    };

    constructor( data = {} ) {
        super('hayvanlar');
        this.id = data.id;
        this.animalId = data.animal_id;
        this.type = data.type;
        this.birthDate = data.birth_date;
        this.gender = data.gender;
        this.weight = data.weight;
        this.category = data.category || this.determineCategory();
        this.testResult = data.test_result || Animal.TEST_RESULTS.BEKLEMEDE;
        this.saleStatus = data.sale_status || Animal.SALE_STATUS.BEKLEMEDE;
        this.destinationCompany = data.destination_company;
        this.salePrice = data.sale_price;
        this.healthStatus = data.health_status || 'healthy';
        this.pregnancyStatus = data.pregnancy_status || 'not_pregnant';
        this.status = data.status || 'active';
        this.notes = data.notes || '';
        this.salePriority = this.determineSalePriority();
        this.testDate = data.test_date;
        this.saleDate = data.sale_date;
        this.currentLocationId = data.current_location_id; // Lokasyon ID'si
        this.testGroup = this.determineTestGroup();
        this.createdAt = data.created_at || new Date();
        this.updatedAt = data.updated_at || new Date();
    }

    /**
     * Satış önceliğini belirle
     */
    determineSalePriority() {
        switch (this.category) {
            case Animal.CATEGORIES.INEK:
                return Animal.SALE_PRIORITY.DUSUK;
            case Animal.CATEGORIES.BUZAGI:
                return Animal.SALE_PRIORITY.ORTA;
            case Animal.CATEGORIES.GEBE_DUVE:
            case Animal.CATEGORIES.TOHUMLU_DUVE:
            case Animal.CATEGORIES.DUVE:
                return Animal.SALE_PRIORITY.YUKSEK;
            default:
                return Animal.SALE_PRIORITY.DUSUK;
        }
    }

    /**
     * Kategoriyi belirle
     */
    determineCategory() {
        return Animal.CATEGORIES.INEK; // Varsayılan kategori
    }

    /**
     * Test sonucuna göre grubu belirle
     */
    determineTestGroup() {
        switch ( this.testResult ) {
            case Animal.TEST_RESULTS.NEGATIF:
                return Animal.TEST_GROUPS.TEMIZ;
            case Animal.TEST_RESULTS.POZITIF:
                return Animal.TEST_GROUPS.IZOLE;
            default:
                return Animal.TEST_GROUPS.SUSPECT;
        }
    }

    /**
     * Test grubuna göre hayvanları listele
     */
    static async findByTestGroup( testGroup ) {
        let query = supabaseAdmin
            .from( 'animals' )
            .select( '*' );

        switch ( testGroup ) {
            case Animal.TEST_GROUPS.TEMIZ:
                query = query.eq( 'test_result', Animal.TEST_RESULTS.NEGATIF );
                break;
            case Animal.TEST_GROUPS.IZOLE:
                query = query.eq( 'test_result', Animal.TEST_RESULTS.POZITIF );
                break;
            case Animal.TEST_GROUPS.SUSPECT:
                query = query.eq( 'test_result', Animal.TEST_RESULTS.BEKLEMEDE );
                break;
        }

        const { data, error } = await query;
        if ( error ) throw error;
        return data.map( animal => new Animal( animal ) );
    }

    /**
     * Lokasyon ID'sine göre hayvanları listele
     */
    static async findByLocationId( locationId ) {
        const { data, error } = await supabaseAdmin
            .from( 'animals' )
            .select( '*' )
            .eq( 'current_location_id', locationId ); // current_location_id kullanıldı

        if ( error ) throw error;
        return data.map( animal => new Animal( animal ) );
    }

    /**
     * Hayvanın lokasyonunu güncelle (Lokasyon ID'si alacak)
     */
    async updateLocation( newLocationId, reason = '' ) {
        // Mevcut lokasyon ID'sini al
        const previousLocationId = this.currentLocationId;

        // Lokasyon değişikliği geçmişini kaydet
        const { error: historyError } = await supabaseAdmin
            .from( 'animal_location_history' )
            .insert( {
                animal_id: this.id,
                previous_location: previousLocationId, // Önceki lokasyon ID'si
                new_location: newLocationId,     // Yeni lokasyon ID'si
                change_reason: reason,
                change_date: new Date()
            } );

        if ( historyError ) throw historyError;

        // Hayvanın mevcut lokasyon ID'sini güncelle
        this.currentLocationId = newLocationId;
        return await this.save();
    }

    /**
     * Lokasyon değişikliği geçmişini getir
     */
    async getLocationHistory() {
        const { data, error } = await supabaseAdmin
            .from( 'animal_location_history' )
            .select( '*' )
            .eq( 'animal_id', this.id )
            .order( 'change_date', { ascending: false } );

        if ( error ) throw error;
        return data;
    }

    /**
     * Test grubuna göre hayvanları yeni lokasyonlara dağıt
     */
    static async organizeByTestGroups() {
        try {
            // Lokasyon ID'lerini al (Örnek olarak, gerçek uygulamada veritabanından alınmalı)
            // Bu kısım, lokasyonların nasıl yönetildiğine bağlı olarak değişebilir.
            // Şimdilik sabit ID'ler kullanalım veya locations tablosundan çekelim.
            const { data: locations, error: locationError } = await supabaseAdmin
                .from( 'locations' )
                .select( 'id, name' );

            if ( locationError ) throw locationError;

            const temizBolgeId = locations.find( loc => loc.name === 'Temiz Bölge' )?.id;
            const izolasyonBolgeId = locations.find( loc => loc.name === 'İzolasyon Bölgesi' )?.id;
            const karantinaBolgeId = locations.find( loc => loc.name === 'Karantina Bölgesi' )?.id;


            // Test gruplarına göre hayvanları al
            const temizGrup = await Animal.findByTestGroup( Animal.TEST_GROUPS.TEMIZ );
            const izoleGrup = await Animal.findByTestGroup( Animal.TEST_GROUPS.IZOLE );
            const suspectGrup = await Animal.findByTestGroup( Animal.TEST_GROUPS.SUSPECT );

            // Her grup için lokasyon güncellemelerini yap
            const updatePromises = [
                ...temizGrup.map( animal => animal.updateLocation( temizBolgeId, 'Test sonucu negatif' ) ),
                ...izoleGrup.map( animal => animal.updateLocation( izolasyonBolgeId, 'Test sonucu pozitif' ) ),
                ...suspectGrup.map( animal => animal.updateLocation( karantinaBolgeId, 'Test bekleniyor' ) )
            ];

            await Promise.all( updatePromises );

            return {
                temizGrup: temizGrup.length,
                izoleGrup: izoleGrup.length,
                suspectGrup: suspectGrup.length,
                total: temizGrup.length + izoleGrup.length + suspectGrup.length
            };
        } catch ( error ) {
            console.error( 'Hayvanları organize ederken hata:', error );
            throw error;
        }
    }

    /**
     * Test ve lokasyon durumuna göre özet rapor al (current_location_id kullanıldı)
     */
    static async getTestAndLocationSummary() {
        const { data, error } = await supabaseAdmin
            .from( 'animals' )
            .select( `
                test_result,
                current_location_id,
                count(*)
            ` )
            .group( 'test_result, current_location_id' );

        if ( error ) throw error;
        return data;
    }

    /**
     * Hayvan ID'sine (küpe numarası) göre hayvanı bul
     * Hem string hem numerik ID'leri destekler
     */
    static async findByAnimalId(animalId) {
        console.log('findByAnimalId çağrıldı. Aranan ID:', animalId, 'Tip:', typeof animalId);
        
        // Numerik ve string ID desteği
        let query = supabaseAdmin.from('animals').select('*');
        
        // ID null veya undefined ise hata fırlat
        if (animalId === null || animalId === undefined) {
            throw new Error('Hayvan ID parametresi null veya undefined olamaz');
        }
        
        // animal_id değeri bazen string bazen integer olabilir
        if (typeof animalId === 'string' && !isNaN(parseInt(animalId, 10))) {
            // İki durumu da kapsamak için OR kullan
            query = query.or(`animal_id.eq.${animalId},animal_id.eq.${parseInt(animalId, 10)}`);
        } else {
            query = query.eq('animal_id', animalId);
        }
        
        const { data, error } = await query.single();
        
        if (error) {
            console.error('Hayvan arama hatası:', error.message);
            throw error;
        }
        
        if (!data) {
            console.log(`Hayvan bulunamadı: ${animalId}`);
            return null; // Hayvan bulunamadı
        }
        
        console.log(`Hayvan bulundu: ${data.animal_id}`);
        return new Animal(data);
    }

    // Süt verimi ile ilgili bilgileri getir
    async getSutVerimiBilgileri(hayvanId) {
        try {
            // Buzağılama tarihi ve süt verimi bilgilerini al
            const [rows] = await pool.execute(`
                SELECT 
                    h.kupeno,
                    h.id as hayvan_id,
                    sv.buztar as buzagilama_tarihi,
                    sv.tarih as olcum_tarihi,
                    sv.sutort as gunluk_sut_ortalamasi,
                    DATEDIFF(CURRENT_DATE, sv.buztar) as sagmal_gun
                FROM hayvanlar h
                LEFT JOIN sutverim sv ON h.kupeno = sv.kupeno
                WHERE h.id = ?
                ORDER BY sv.tarih DESC
                LIMIT 1
            `, [hayvanId]);

            return rows[0] || null;
        } catch (error) {
            console.error('Süt verimi bilgileri alınırken hata:', error);
            throw error;
        }
    }

    // Anne numarasına göre süt verimi bilgilerini getir
    async getAnneSutVerimi(anneKupeNo) {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    h.kupeno,
                    sv.tarih as olcum_tarihi,
                    sv.sutort as gunluk_sut_ortalamasi
                FROM hayvanlar h
                LEFT JOIN sutverim sv ON h.kupeno = sv.kupeno
                WHERE h.kupeno = ?
                ORDER BY sv.tarih DESC
                LIMIT 1
            `, [anneKupeNo]);

            return rows[0] || null;
        } catch (error) {
            console.error('Anne süt verimi bilgileri alınırken hata:', error);
            throw error;
        }
    }

    // Hayvan detaylarını getirirken süt verimi bilgilerini de ekle
    async findById(id) {
        try {
            const hayvan = await super.findById(id);
            if (!hayvan) return null;

            // Süt verimi bilgilerini ekle
            const sutVerimi = await this.getSutVerimiBilgileri(id);
            if (sutVerimi) {
                hayvan.sut_verimi = {
                    buzagilama_tarihi: sutVerimi.buzagilama_tarihi,
                    sagmal_gun: sutVerimi.sagmal_gun,
                    gunluk_sut_ortalamasi: sutVerimi.gunluk_sut_ortalamasi,
                    olcum_tarihi: sutVerimi.olcum_tarihi
                };
            }

            // Eğer dişi buzağı ise anne süt verimini ekle
            if (hayvan.cinsiyet === 'Dişi' && hayvan.anne_no) {
                const anneSutVerimi = await this.getAnneSutVerimi(hayvan.anne_no);
                if (anneSutVerimi) {
                    hayvan.anne_sut_verimi = {
                        gunluk_sut_ortalamasi: anneSutVerimi.gunluk_sut_ortalamasi,
                        olcum_tarihi: anneSutVerimi.olcum_tarihi
                    };
                }
            }

            return hayvan;
        } catch (error) {
            console.error('Hayvan detayları alınırken hata:', error);
            throw error;
        }
    }

    // Tüm hayvanları listelerken süt verimi bilgilerini de ekle
    async findAll(filters = {}) {
        try {
            const hayvanlar = await super.findAll(filters);
            
            // Her hayvan için süt verimi bilgilerini ekle
            const hayvanlarWithSutVerimi = await Promise.all(hayvanlar.map(async (hayvan) => {
                const sutVerimi = await this.getSutVerimiBilgileri(hayvan.id);
                if (sutVerimi) {
                    hayvan.sut_verimi = {
                        buzagilama_tarihi: sutVerimi.buzagilama_tarihi,
                        sagmal_gun: sutVerimi.sagmal_gun,
                        gunluk_sut_ortalamasi: sutVerimi.gunluk_sut_ortalamasi,
                        olcum_tarihi: sutVerimi.olcum_tarihi
                    };
                }

                // Eğer dişi buzağı ise anne süt verimini ekle
                if (hayvan.cinsiyet === 'Dişi' && hayvan.anne_no) {
                    const anneSutVerimi = await this.getAnneSutVerimi(hayvan.anne_no);
                    if (anneSutVerimi) {
                        hayvan.anne_sut_verimi = {
                            gunluk_sut_ortalamasi: anneSutVerimi.gunluk_sut_ortalamasi,
                            olcum_tarihi: anneSutVerimi.olcum_tarihi
                        };
                    }
                }

                return hayvan;
            }));

            return hayvanlarWithSutVerimi;
        } catch (error) {
            console.error('Hayvanlar listelenirken hata:', error);
            throw error;
        }
    }
}

module.exports = new Animal();