/**
 * DashboardController.js - Dashboard verilerini yöneten controller
 */

const { pool } = require( '../config/mysql' );
const { getAnimalStatistics } = require( '../utils/animalStatsHelper' ); // İstatistik okuma fonksiyonunu import et

class DashboardController {
    /**
     * Dashboard için gerekli tüm verileri getir
     */
    async getDashboardData( req, res ) {
        try {
            console.log( 'Dashboard verileri veritabanından çekiliyor...' );

            // İstatistikleri veritabanından oku
            const stats = await getAnimalStatistics();

            // Sonuçları gönder
            const dashboardData = {
                animals: {
                    // Temel sayılar
                    toplam: stats.animals.total,
                    erkek: stats.animals.byGender.male,
                    disi: stats.animals.byGender.female,

                    // Kategoriler (Yeni yapıya göre)
                    inek: stats.animals.byCategory['INEK'] || 0,
                    duve: stats.animals.byCategory['DUVE'] || 0,
                    gebeDuve: stats.animals.byCategory['GEBE_DUVE'] || 0,
                    buzagi: stats.animals.byCategory['BUZAGI'] || 0,

                    // Gebelik durumu
                    gebeInek: stats.animals.pregnancy.gebeInek,
                    gebeDuve: stats.animals.pregnancy.gebeDuve,
                    toplam_gebe: stats.animals.pregnancy.total,

                    // Amaç durumu
                    kesimeAyrilan: stats.animals.byPurpose['KESIM'] || 0,
                    damizlikAyrilan: stats.animals.byPurpose['DAMIZLIK'] || 0,

                    // Satış durumu
                    satisHazir: stats.animals.bySaleStatus['SATISA_HAZIR'] || 0,
                    satiliyor: stats.animals.bySaleStatus['SATILIYOR'] || 0,
                    satilan: stats.animals.bySaleStatus['SATILDI'] || 0,
                    satisBekleyen: stats.animals.bySaleStatus['BEKLEMEDE'] || 0,
                    satisIptal: stats.animals.bySaleStatus['IPTAL'] || 0,

                    // Satış detayları
                    kesilenHayvan: stats.animals.sales.kesim,
                    damizlikSatilan: stats.animals.sales.damizlik,
                    toplamSatilan: stats.animals.sales.total
                },
                chart: {
                    categories: {
                        // Yeni kategori yapısına göre etiketleri Türkçeleştir
                        labels: stats.chart.categories.labels.map(label => {
                            switch(label) {
                                case 'INEK': return 'İnek';
                                case 'DUVE': return 'Düve';
                                case 'GEBE_DUVE': return 'Gebe Düve';
                                case 'BUZAGI': return 'Buzağı';
                                default: return label;
                            }
                        }),
                        values: stats.chart.categories.values
                    },
                    sales: stats.chart.sales,
                    saleStatus: {
                        // Satış durumu etiketlerini Türkçeleştir
                        labels: stats.chart.saleStatus.labels.map(label => {
                            switch(label) {
                                case 'BEKLEMEDE': return 'Beklemede';
                                case 'SATISA_HAZIR': return 'Satışa Hazır';
                                case 'SATILIYOR': return 'Satılıyor';
                                case 'SATILDI': return 'Satıldı';
                                case 'IPTAL': return 'İptal';
                                default: return label;
                            }
                        }),
                        values: stats.chart.saleStatus.values
                    }
                }
            };

            console.log( 'Dashboard verileri hazırlandı.' );

            res.json( {
                success: true,
                data: dashboardData
            } );
        } catch ( error ) {
            console.error( 'Dashboard verileri alınırken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: 'Dashboard verileri alınırken bir hata oluştu'
            } );
        }
    }

    /**
     * Son aktiviteleri getir
     */
    async getRecentActivities( req, res ) {
        try {
            // Önce aktiviteler tablosunun varlığını kontrol et
            const [tables] = await pool.query(`
                SELECT TABLE_NAME 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'aktiviteler'
            `);

            // Tablo yoksa boş aktivite listesi döndür
            if (tables.length === 0) {
                console.log('Aktiviteler tablosu henüz oluşturulmamış, boş liste dönülüyor.');
                return res.json({
                    success: true,
                    data: [],
                    message: 'Aktivite kaydı henüz başlatılmamış.'
                });
            }

            // Tablo varsa aktiviteleri getir
            const [activities] = await pool.query(`
                SELECT 
                    a.*,
                    u.full_name as kullanici_adi
                FROM aktiviteler a
                LEFT JOIN users u ON a.user_id = u.id
                ORDER BY a.olusturma_tarihi DESC
                LIMIT 10
            `);

            res.json( {
                success: true,
                data: activities
            } );
        } catch ( error ) {
            console.error( 'Son aktiviteler alınırken hata:', error );
            // Tablo yok hatası için özel mesaj
            if (error.code === 'ER_NO_SUCH_TABLE') {
                return res.json({
                    success: true,
                    data: [],
                    message: 'Aktivite kaydı henüz başlatılmamış.'
                });
            }
            // Diğer hatalar için genel hata mesajı
            res.status(500).json({
                success: false,
                message: 'Son aktiviteler alınamadı',
                error: error.message
            });
        }
    }
}

module.exports = new DashboardController();