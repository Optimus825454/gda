const Animal = require( '../models/Animal' ); // Bu model Supabase kullanıyor, belki kaldırılabilir veya sadece sabitler için tutulabilir.
const AnimalProtocol = require( './AnimalProtocol' );
const hayvanlarModel = require( '../models/HayvanlarModel' ); // MySQL modelini import et
const { calculateAnimalStatistics } = require( '../utils/animalStatsHelper' ); // Yardımcı fonksiyonu import et

class AnimalService extends AnimalProtocol {
    constructor() {
        super();
        this.processingAnimals = new Set();
    }

    async canContinueProcess( animalId ) {
        return !this.processingAnimals.has( animalId );
    }

    async startProcess( animalId ) {
        if ( this.processingAnimals.has( animalId ) ) {
            throw new Error( 'Bu hayvan için işlem zaten devam ediyor' );
        }
        this.processingAnimals.add( animalId );
    }

    async endProcess( animalId ) {
        this.processingAnimals.delete( animalId );
    }

    async processTestResult( animalId, testData ) {
        if ( !await this.canContinueProcess( animalId ) ) {
            throw new Error( 'Bu hayvan için başka bir işlem devam ediyor' );
        }

        try {
            await this.startProcess( animalId );
            const animal = await Animal.findById( animalId );
            const updatedAnimal = await animal.processTestResult( testData );
            return updatedAnimal;
        } finally {
            await this.endProcess( animalId );
        }
    }

    async completeSale( animalId, salePrice ) {
        if ( !await this.canContinueProcess( animalId ) ) {
            throw new Error( 'Bu hayvan için başka bir işlem devam ediyor' );
        }

        try {
            await this.startProcess( animalId );
            const animal = await Animal.findById( animalId );
            const updatedAnimal = await animal.completeSale( salePrice );
            return updatedAnimal;
        } finally {
            await this.endProcess( animalId );
        }
    }

    // Diğer metodlar
    async getAllAnimals( filters ) {
        return await Animal.findAll( filters );
    }

    async getAnimalById( id ) {
        return await Animal.findById( id );
    }

    async createAnimal( animalData ) {
        const animal = new Animal( animalData );
        return await animal.save();
    }

    async updateAnimal( id, animalData ) {
        const animal = await Animal.findById( id );
        Object.assign( animal, animalData );
        return await animal.save();
    }

    /**
     * Rapor verilerini hazırlar
     * @returns {Promise<Object>} Rapor verileri
     */
    static async generateReports() {
        try {
            // MySQL'den tüm hayvanları çek
            const allAnimals = await hayvanlarModel.findAll();

            // İstatistikleri hesapla
            const reports = calculateAnimalStatistics( allAnimals );

            // JSON çıktısındaki formatı eşleştirmek için veriyi yeniden düzenle
            const formattedReports = {
                animals: {
                    toplam: reports.animals.total,
                    inek: reports.animals.byCategory['INEK'] || 0,
                    duve: reports.animals.byCategory['DUVE'] || 0,
                    gebeDuve: reports.animals.pregnancy.gebeDuve || 0, // Gebelik istatistiklerinden al
                    tohumluDuve: reports.animals.byCategory['TOHUMLU_DUVE'] || 0,
                    buzagi: reports.animals.byCategory['BUZAGI'] || 0,
                    gebeInek: reports.animals.pregnancy.gebeInek || 0, // Gebelik istatistiklerinden al
                    toplam_gebe: reports.animals.pregnancy.total || 0, // Gebelik istatistiklerinden al
                    kesimeAyrilan: reports.animals.byPurpose['KESIM'] || 0, // Amaç istatistiklerinden al
                    damizlikAyrilan: reports.animals.byPurpose['DAMIZLIK'] || 0, // Amaç istatistiklerinden al
                    satisHazir: reports.animals.bySaleStatus['SATISA_HAZIR'] || 0, // Satış durumu istatistiklerinden al
                    satiliyor: reports.animals.bySaleStatus['SATILIYOR'] || 0, // Satış durumu istatistiklerinden al
                    satilan: reports.animals.bySaleStatus['SATILDI'] || 0, // Satış durumu istatistiklerinden al
                    satisBekleyen: reports.animals.bySaleStatus['BEKLEMEDE'] || 0, // Satış durumu istatistiklerinden al
                    satisIptal: reports.animals.bySaleStatus['IPTAL'] || 0, // Satış durumu istatistiklerinden al
                    kesilenHayvan: reports.animals.sales.kesim || 0, // Satış istatistiklerinden al
                    damizlikSatilan: reports.animals.sales.damizlik || 0, // Satış istatistiklerinden al
                    toplamSatilan: reports.animals.sales.total || 0 // Satış istatistiklerinden al
                },
                chart: {
                    categories: {
                        labels: Object.keys( reports.animals.byCategory ),
                        values: Object.values( reports.animals.byCategory )
                    },
                    sales: {
                        labels: ["Kesim Satışı", "Damızlık Satışı"],
                        values: [reports.animals.sales.kesim || 0, reports.animals.sales.damizlik || 0]
                    },
                    saleStatus: {
                        labels: Object.keys( reports.animals.bySaleStatus ),
                        values: Object.values( reports.animals.bySaleStatus )
                    }
                }
            };


            return formattedReports;
        } catch ( error ) {
            console.error( 'Rapor oluşturma hatası:', error );
            throw new Error( 'Raporlar oluşturulurken bir hata oluştu' );
        }
    }

    /**
     * Toplu hayvan oluşturma
     * @param {Array} animalsData - Eklenecek hayvanların verileri
     * @returns {Promise<Object>} Eklenen hayvanlar ve varsa hatalar
     */
    static async bulkCreate( animalsData ) {
        const results = {
            success: [],
            errors: []
        };

        for ( const data of animalsData ) {
            try {
                const animal = new Animal( data );
                const savedAnimal = await animal.save();
                results.success.push( savedAnimal );
            } catch ( error ) {
                results.errors.push( {
                    data,
                    error: error.message
                } );
            }
        }

        return results;
    }

    /**
     * Toplu hayvan güncelleme
     * @param {Array} updates - Güncellenecek hayvanların verileri
     * @returns {Promise<Object>} Güncellenen hayvanlar ve varsa hatalar
     */
    static async bulkUpdate( updates ) {
        const results = {
            success: [],
            errors: []
        };

        for ( const update of updates ) {
            try {
                const animal = await Animal.findById( update.id );
                Object.assign( animal, update );
                const savedAnimal = await animal.save();
                results.success.push( savedAnimal );
            } catch ( error ) {
                results.errors.push( {
                    data: update,
                    error: error.message
                } );
            }
        }

        return results;
    }

    /**
     * Toplu test sonucu kaydetme
     * @param {Array} testResults - Test sonuçları
     * @returns {Promise<Object>} İşlem sonuçları
     */
    static async bulkProcessTestResults( testResults ) {
        const results = {
            success: [],
            errors: []
        };

        for ( const testData of testResults ) {
            try {
                const animal = await Animal.findById( testData.animalId );
                const updated = await animal.processTestResult( testData );
                results.success.push( updated );
            } catch ( error ) {
                results.errors.push( {
                    data: testData,
                    error: error.message
                } );
            }
        }

        return results;
    }

    /**
     * Toplu satış tamamlama
     * @param {Array} sales - Satış verileri
     * @returns {Promise<Object>} İşlem sonuçları
     */
    static async bulkCompleteSales( sales ) {
        const results = {
            success: [],
            errors: []
        };

        for ( const sale of sales ) {
            try {
                const animal = await Animal.findById( sale.animalId );
                const updated = await animal.completeSale( sale.price );
                results.success.push( updated );
            } catch ( error ) {
                results.errors.push( {
                    data: sale,
                    error: error.message
                } );
            }
        }

        return results;
    }

    /**
     * Gelişmiş rapor oluşturma
     * @returns {Promise<Object>} Detaylı rapor
     */
    static async generateDetailedReport() {
        const report = await this.generateReports();

        // Ek metrikleri hesapla
        const allAnimals = await Animal.findAll();

        // Ortalama ağırlık hesaplama
        const weights = allAnimals
            .filter( a => a.weight )
            .map( a => a.weight );

        const averageWeight = weights.length > 0
            ? weights.reduce( ( sum, w ) => sum + w, 0 ) / weights.length
            : 0;

        // Ortalama yaş hesaplama
        const ages = allAnimals
            .filter( a => a.birthDate )
            .map( a => new Animal( a ).calculateAge() );

        const averageAge = ages.length > 0
            ? ages.reduce( ( sum, age ) => sum + age, 0 ) / ages.length
            : 0;

        return {
            ...report,
            metrics: {
                averageWeight: Math.round( averageWeight * 10 ) / 10,
                averageAge: Math.round( averageAge * 10 ) / 10
            }
        };
    }

    /**
     * Test bekleyen hayvanlar için toplu test işlemi
     */
    static async processPendingTests( testResults ) {
        const results = {
            success: [],
            errors: []
        };

        for ( const result of testResults ) {
            try {
                const animal = await Animal.findById( result.animalId );
                const updatedAnimal = await animal.processTestResult( {
                    testResult: result.testResult
                } );

                results.success.push( {
                    animal: updatedAnimal,
                    destinationCompany: updatedAnimal.destinationCompany
                } );
            } catch ( error ) {
                results.errors.push( {
                    animalId: result.animalId,
                    error: error.message
                } );
            }
        }

        return results;
    }

    /**
     * Satış önceliğine göre satış süreci yönetimi
     */
    static async manageSaleProcess() {
        const summary = {
            inek: [],
            gebeDuve: [],
            gencDisi: [],
            buzagi: [],
            errors: []
        };

        try {
            // Önce yüksek öncelikli hayvanlar (gebe düve ve genç dişiler)
            const highPriority = await Animal.findBySalePriority( Animal.SALE_PRIORITY.YUKSEK );
            for ( const animal of highPriority ) {
                if ( animal.category === Animal.CATEGORIES.GEBE_DUVE ) {
                    summary.gebeDuve.push( animal );
                } else {
                    summary.gencDisi.push( animal );
                }
            }

            // Orta öncelikli hayvanlar (buzağılar)
            const mediumPriority = await Animal.findBySalePriority( Animal.SALE_PRIORITY.ORTA );
            summary.buzagi = mediumPriority;

            // Düşük öncelikli hayvanlar (inekler)
            const lowPriority = await Animal.findBySalePriority( Animal.SALE_PRIORITY.DUSUK );
            summary.inek = lowPriority;

        } catch ( error ) {
            summary.errors.push( error.message );
        }

        return summary;
    }

    /**
     * Test sonuçlarına göre hayvanları grupla
     */
    static async groupByTestResults() {
        const groups = {
            pozitif: [],    // AsyaEt'e gidecekler
            negatif: [],    // Gülvet'e gidecekler
            bekleyen: []    // Test bekleyenler
        };

        try {
            // Test sonuçlarına göre grupla
            const animals = await Animal.findAll();

            for ( const animal of animals ) {
                if ( animal.testResult === Animal.TEST_RESULTS.POZITIF ) {
                    groups.pozitif.push( animal );
                } else if ( animal.testResult === Animal.TEST_RESULTS.NEGATIF ) {
                    groups.negatif.push( animal );
                } else {
                    groups.bekleyen.push( animal );
                }
            }
        } catch ( error ) {
            throw new Error( `Gruplama hatası: ${error.message}` );
        }

        return groups;
    }

    /**
     * Satış istatistikleri
     */
    static async generateSaleStatistics() {
        const stats = {
            totalAnimals: 0,
            byCategory: {},
            byDestination: {},
            testResults: {},
            averagePrices: {},
            remainingAnimals: 0
        };

        try {
            const summary = await Animal.getSaleSummary();

            for ( const record of summary ) {
                // Kategori bazında sayılar
                stats.byCategory[record.category] = ( stats.byCategory[record.category] || 0 ) + record.count;

                // Hedef firma bazında sayılar
                if ( record.destination_company ) {
                    stats.byDestination[record.destination_company] =
                        ( stats.byDestination[record.destination_company] || 0 ) + record.count;
                }

                // Test sonuçları bazında sayılar
                if ( record.test_result ) {
                    stats.testResults[record.test_result] =
                        ( stats.testResults[record.test_result] || 0 ) + record.count;
                }

                // Toplam hayvan sayısı
                stats.totalAnimals += record.count;

                // Satılmamış hayvan sayısı
                if ( record.sale_status !== Animal.SALE_STATUS.SATILDI ) {
                    stats.remainingAnimals += record.count;
                }
            }
        } catch ( error ) {
            throw new Error( `İstatistik hesaplama hatası: ${error.message}` );
        }

        return stats;
    }
}

module.exports = AnimalService;