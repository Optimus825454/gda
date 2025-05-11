const { pool } = require( '../config/mysql' );

/**
 * Hayvan istatistiklerini hesaplayan yardımcı fonksiyon
 * @param {Array} animals - Hayvan listesi
 * @returns {Object} İstatistik verileri
 */
const calculateAnimalStatistics = (animals) => {
    const stats = {
        animals: {
            total: animals.length,
            byCategory: {},
            byPurpose: {},
            bySaleStatus: {},
            byTestStatus: {
                tested: 0,
                untested: 0
            },
            pregnancy: {
                total: 0,
                gebeInek: 0,
                gebeDuve: 0
            },
            sales: {
                total: 0,
                kesim: 0,
                damizlik: 0
            }
        }
    };

    // Her hayvan için istatistikleri hesapla
    animals.forEach(animal => {
        // Kategori bazında sayılar
        stats.animals.byCategory[animal.kategori] = (stats.animals.byCategory[animal.kategori] || 0) + 1;

        // Amaç bazında sayılar (kesim/damızlık)
        if (animal.amac) {
            stats.animals.byPurpose[animal.amac] = (stats.animals.byPurpose[animal.amac] || 0) + 1;
        }

        // Satış durumu bazında sayılar
        if (animal.satis_durumu) {
            stats.animals.bySaleStatus[animal.satis_durumu] = (stats.animals.bySaleStatus[animal.satis_durumu] || 0) + 1;
        }

        // Test durumu istatistikleri
        if (animal.test_tarihi) {
            stats.animals.byTestStatus.tested++;
        } else {
            stats.animals.byTestStatus.untested++;
        }

        // Gebelik istatistikleri
        if (animal.gebelikdurum === 'GEBE') {
            stats.animals.pregnancy.total++;
            if (animal.kategori === 'INEK') {
                stats.animals.pregnancy.gebeInek++;
            } else if (animal.kategori === 'DUVE') {
                stats.animals.pregnancy.gebeDuve++;
            }
        }

        // Satış istatistikleri
        if (animal.satis_durumu === 'SATILDI') {
            stats.animals.sales.total++;
            if (animal.amac === 'KESIM') {
                stats.animals.sales.kesim++;
            } else if (animal.amac === 'DAMIZLIK') {
                stats.animals.sales.damizlik++;
            }
        }
    });

    return stats;
};

// Hayvan istatistiklerini veritabanına kaydeden/güncelleyen fonksiyon
const updateAnimalStatistics = async () => {
    try {
        // Tüm hayvanları çek
        const [allAnimals] = await pool.query( 'SELECT * FROM hayvanlar' );

        // İstatistikleri hesapla
        const stats = calculateAnimalStatistics( allAnimals );

        // Mevcut istatistikleri temizle (basitlik için, delta güncelleme daha verimli olabilir)
        await pool.query( 'DELETE FROM animal_statistics' );

        // Yeni istatistikleri kaydet
        const statisticEntries = [];

        // Cinsiyet
        statisticEntries.push( ['gender', 'male', stats.animals.byGender.male] );
        statisticEntries.push( ['gender', 'female', stats.animals.byGender.female] );

        // Kategoriler
        for ( const category in stats.animals.byCategory ) {
            statisticEntries.push( ['category', category, stats.animals.byCategory[category]] );
        }

        // Durumlar
        for ( const status in stats.animals.byStatus ) {
            statisticEntries.push( ['status', status, stats.animals.byStatus[status]] );
        }

        // Satış Durumları
        for ( const saleStatus in stats.animals.bySaleStatus ) {
            statisticEntries.push( ['sale_status', saleStatus, stats.animals.bySaleStatus[saleStatus]] );
        }

        // Amaçlar
        for ( const purpose in stats.animals.byPurpose ) {
            statisticEntries.push( ['purpose', purpose, stats.animals.byPurpose[purpose]] );
        }

        // Gebelik
        statisticEntries.push( ['pregnancy', 'total', stats.animals.pregnancy.total] );
        statisticEntries.push( ['pregnancy', 'gebeInek', stats.animals.pregnancy.gebeInek] );
        statisticEntries.push( ['pregnancy', 'gebeDuve', stats.animals.pregnancy.gebeDuve] );

        // Toplu INSERT işlemi
        if ( statisticEntries.length > 0 ) {
            const insertSql = 'INSERT INTO animal_statistics (statistic_type, statistic_name, count) VALUES ?';
            await pool.query( insertSql, [statisticEntries] );
        }

        console.log( 'Hayvan istatistikleri veritabanında güncellendi.' );

    } catch ( error ) {
        console.error( 'Hayvan istatistikleri güncellenirken hata:', error );
        throw error;
    }
};

// Veritabanından istatistikleri okuyan fonksiyon
const getAnimalStatistics = async () => {
    try {
        // Temel istatistik objesi
        const stats = {
            animals: {
                total: 0,
                byGender: { male: 0, female: 0 },
                byCategory: {},
                byPurpose: {},
                bySaleStatus: {},
                pregnancy: {
                    gebeInek: 0,
                    gebeDuve: 0,
                    total: 0
                },
                sales: {
                    kesim: 0,
                    damizlik: 0,
                    total: 0
                }
            }
        };

        // Toplam hayvan sayısı
        const [totalResult] = await pool.query('SELECT COUNT(*) as total FROM hayvanlar');
        stats.animals.total = totalResult[0].total;

        // Cinsiyete göre sayılar
        const [genderResults] = await pool.query(`
            SELECT 
                LOWER(cinsiyet) as cinsiyet,
                COUNT(*) as sayi 
            FROM hayvanlar 
            GROUP BY cinsiyet
        `);
        genderResults.forEach(row => {
            if (row.cinsiyet?.includes('erkek')) {
                stats.animals.byGender.male = row.sayi;
            } else if (row.cinsiyet?.includes('disi') || row.cinsiyet?.includes('dişi')) {
                stats.animals.byGender.female = row.sayi;
            }
        });

        // İnek, Düve ve Buzağı sayıları için özel sorgu
        const [categoryResults] = await pool.query(`
            SELECT 
                CASE 
                    WHEN kategori = 'İnek' THEN 'INEK'
                    WHEN kategori = 'Gebe Düve' THEN 'GEBE_DUVE'
                    WHEN durum IN ('Buzğ.', 'E Bzğ') THEN 'BUZAGI'
                    WHEN kategori LIKE '%Düve%' OR kategori LIKE '%Duve%' THEN 'DUVE'
                    ELSE 'DIGER'
                END as hayvan_tipi,
                COUNT(*) as sayi
            FROM hayvanlar 
            GROUP BY 
                CASE 
                    WHEN kategori = 'İnek' THEN 'INEK'
                    WHEN kategori = 'Gebe Düve' THEN 'GEBE_DUVE'
                    WHEN durum IN ('Buzğ.', 'E Bzğ') THEN 'BUZAGI'
                    WHEN kategori LIKE '%Düve%' OR kategori LIKE '%Duve%' THEN 'DUVE'
                    ELSE 'DIGER'
                END
        `);

        // Kategori sonuçlarını istatistiklere ekle
        categoryResults.forEach(row => {
            if (row.hayvan_tipi !== 'DIGER') {
                stats.animals.byCategory[row.hayvan_tipi] = row.sayi;
            }
        });

        // Varsayılan değerleri ayarla (eğer sonuç dönmediyse)
        stats.animals.byCategory['INEK'] = stats.animals.byCategory['INEK'] || 0;
        stats.animals.byCategory['DUVE'] = stats.animals.byCategory['DUVE'] || 0;
        stats.animals.byCategory['GEBE_DUVE'] = stats.animals.byCategory['GEBE_DUVE'] || 0;
        stats.animals.byCategory['BUZAGI'] = stats.animals.byCategory['BUZAGI'] || 0;

        // Gebelik durumuna göre sayılar
        const [pregnancyResults] = await pool.query(`
            SELECT 
                LOWER(kategori) as kategori,
                LOWER(gebelikdurum) as gebelikdurum,
                COUNT(*) as sayi 
            FROM hayvanlar 
            WHERE LOWER(gebelikdurum) LIKE '%gebe%'
            GROUP BY kategori, gebelikdurum
        `);
        pregnancyResults.forEach(row => {
            if (row.gebelikdurum?.includes('gebe')) {
                stats.animals.pregnancy.total += row.sayi;
                if (row.kategori?.includes('inek')) {
                    stats.animals.pregnancy.gebeInek += row.sayi;
                } else if (row.kategori?.includes('düve') || row.kategori?.includes('duve')) {
                    stats.animals.pregnancy.gebeDuve += row.sayi;
                }
            }
        });

        // Satış durumuna göre sayılar
        const [saleStatusResults] = await pool.query(`
            SELECT 
                LOWER(durum) as durum,
                COUNT(*) as sayi 
            FROM hayvanlar 
            GROUP BY durum
        `);
        saleStatusResults.forEach(row => {
            const durum = row.durum || '';
            if (durum.includes('beklemede') || durum.includes('bekle')) {
                stats.animals.bySaleStatus['BEKLEMEDE'] = row.sayi;
            } else if (durum.includes('satisa_hazir') || durum.includes('hazir')) {
                stats.animals.bySaleStatus['SATISA_HAZIR'] = row.sayi;
            } else if (durum.includes('satiliyor') || durum.includes('sürec')) {
                stats.animals.bySaleStatus['SATILIYOR'] = row.sayi;
            } else if (durum.includes('satildi') || durum.includes('satil')) {
                stats.animals.bySaleStatus['SATILDI'] = row.sayi;
            } else if (durum.includes('iptal')) {
                stats.animals.bySaleStatus['IPTAL'] = row.sayi;
            }
        });

        // Amaca göre sayılar ve satış detayları
        const [purposeResults] = await pool.query(`
            SELECT 
                LOWER(amac) as amac,
                LOWER(durum) as durum,
                COUNT(*) as sayi 
            FROM hayvanlar 
            GROUP BY amac, durum
        `);
        purposeResults.forEach(row => {
            const amac = row.amac || '';
            const durum = row.durum || '';

            // Amaç sayımları
            if (amac.includes('kesim')) {
                stats.animals.byPurpose['KESIM'] = (stats.animals.byPurpose['KESIM'] || 0) + row.sayi;
                if (durum.includes('satildi') || durum.includes('satil')) {
                    stats.animals.sales.kesim += row.sayi;
                    stats.animals.sales.total += row.sayi;
                }
            } else if (amac.includes('damız')) {
                stats.animals.byPurpose['DAMIZLIK'] = (stats.animals.byPurpose['DAMIZLIK'] || 0) + row.sayi;
                if (durum.includes('satildi') || durum.includes('satil')) {
                    stats.animals.sales.damizlik += row.sayi;
                    stats.animals.sales.total += row.sayi;
                }
            }
        });

        // Grafik verilerini hazırla
        const chartData = {
            categories: {
                labels: Object.keys(stats.animals.byCategory).filter(key => stats.animals.byCategory[key] > 0),
                values: Object.values(stats.animals.byCategory).filter(value => value > 0)
            },
            sales: {
                labels: ["Kesim Satışı", "Damızlık Satışı"],
                values: [stats.animals.sales.kesim, stats.animals.sales.damizlik]
            },
            saleStatus: {
                labels: Object.keys(stats.animals.bySaleStatus).filter(key => stats.animals.bySaleStatus[key] > 0),
                values: Object.values(stats.animals.bySaleStatus).filter(value => value > 0)
            }
        };

        return { ...stats, chart: chartData };
    } catch (error) {
        console.error('Hayvan istatistikleri hesaplanırken hata:', error);
        throw error;
    }
};

module.exports = {
    calculateAnimalStatistics,
    updateAnimalStatistics,
    getAnimalStatistics
};