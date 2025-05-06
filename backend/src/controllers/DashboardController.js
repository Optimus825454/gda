/**
 * DashboardController.js - Dashboard verilerini yöneten controller
 */

const { supabaseAdmin } = require('../config/supabase');
const Animal = require('../models/Animal');

class DashboardController {
    /**
     * Dashboard için gerekli tüm verileri getir
     */
    async getDashboardData(req, res) {
        try {
            // Hayvan istatistiklerini getir
            const { data: animalStats, error: animalError } = await supabaseAdmin
                .from('animals')
                .select('category, gender, status, purpose, sale_status, pregnancy_status, transport_status');

            if (animalError) throw animalError;

            console.log('Dashboard verileri alınıyor, toplam hayvan sayısı:', animalStats.length);

            // Hayvan sayıları için sabit tanımları
            const CATEGORIES = ['INEK', 'DUVE', 'GEBE_DUVE', 'TOHUMLU_DUVE', 'BUZAGI'];
            const SALE_STATUSES = ['BEKLEMEDE', 'SATISA_HAZIR', 'SATILIYOR', 'SATILDI', 'IPTAL'];
            const PURPOSES = ['KESIM', 'DAMIZLIK'];
            const TRANSPORT_STATUSES = ['BEKLEMEDE', 'SEVK_EDILDI'];

            // Hayvan istatistiklerini hesapla
            const stats = {
                animals: {
                    total: animalStats.length,
                    byGender: {
                        male: 0,
                        female: 0
                    },
                    byCategory: {},
                    byStatus: {},
                    bySaleStatus: {},
                    byPurpose: {},
                    byTransport: {},
                    sales: {
                        total: 0,
                        kesim: 0,
                        damizlik: 0
                    },
                    pregnancy: {
                        total: 0,
                        gebeInek: 0,
                        gebeDuve: 0
                    }
                }
            };

            // Kategorileri başlangıçta 0 olarak başlat
            CATEGORIES.forEach(category => {
                stats.animals.byCategory[category] = 0;
            });

            // Satış durumlarını başlangıçta 0 olarak başlat
            SALE_STATUSES.forEach(status => {
                stats.animals.bySaleStatus[status] = 0;
            });

            // Amaç durumlarını başlangıçta 0 olarak başlat
            PURPOSES.forEach(purpose => {
                stats.animals.byPurpose[purpose] = 0;
            });

            // Sevk durumlarını başlangıçta 0 olarak başlat
            TRANSPORT_STATUSES.forEach(status => {
                stats.animals.byTransport[status] = 0;
            });

            // Kategori bazında sayıları hesapla
            animalStats.forEach(animal => {
                // Cinsiyet dağılımı
                if (animal.gender === 'MALE') {
                    stats.animals.byGender.male++;
                } else if (animal.gender === 'FEMALE') {
                    stats.animals.byGender.female++;
                }

                // Kategoriye göre
                if (animal.category && CATEGORIES.includes(animal.category)) {
                    stats.animals.byCategory[animal.category]++;
                }

                // Amaca göre (Kesim/Damızlık)
                if (animal.purpose) {
                    stats.animals.byPurpose[animal.purpose] = (stats.animals.byPurpose[animal.purpose] || 0) + 1;
                }

                // Duruma göre
                if (animal.status) {
                    stats.animals.byStatus[animal.status] = (stats.animals.byStatus[animal.status] || 0) + 1;
                }

                // Sevk durumuna göre
                if (animal.transport_status) {
                    stats.animals.byTransport[animal.transport_status] = (stats.animals.byTransport[animal.transport_status] || 0) + 1;
                }

                // Satış durumuna göre
                if (animal.sale_status) {
                    stats.animals.bySaleStatus[animal.sale_status]++;
                    
                    // Satılmış hayvan sayısı
                    if (animal.sale_status === 'SATILDI') {
                        stats.animals.sales.total++;
                        
                        // Satış amacına göre sayma
                        if (animal.purpose === 'KESIM') {
                            stats.animals.sales.kesim++;
                        } else if (animal.purpose === 'DAMIZLIK') {
                            stats.animals.sales.damizlik++;
                        }
                    }
                }

                // Gebelik durumuna göre
                if (animal.pregnancy_status === 'GEBE' || animal.pregnancy_status === 'Gebe') {
                    stats.animals.pregnancy.total++;
                    
                    if (animal.category === 'INEK') {
                        stats.animals.pregnancy.gebeInek++;
                    } else if (animal.category === 'GEBE_DUVE') {
                        stats.animals.pregnancy.gebeDuve++;
                    }
                }
            });

            // Sonuçları gönder
            const dashboardData = {
                animals: {
                    toplam: stats.animals.total,
                    erkek: stats.animals.byGender.male,
                    disi: stats.animals.byGender.female,
                    
                    // Kategoriler
                    inek: stats.animals.byCategory['INEK'] || 0,
                    duve: stats.animals.byCategory['DUVE'] || 0,
                    gebeDuve: stats.animals.byCategory['GEBE_DUVE'] || 0,
                    tohumluDuve: stats.animals.byCategory['TOHUMLU_DUVE'] || 0,
                    buzagi: stats.animals.byCategory['BUZAGI'] || 0,
                    
                    // Gebelik durumu
                    gebeInek: stats.animals.pregnancy.gebeInek,
                    gebeDuve: stats.animals.pregnancy.gebeDuve,
                    toplam_gebe: stats.animals.pregnancy.total,
                    
                    // Amaç durumu
                    kesimeAyrilan: stats.animals.byPurpose['KESIM'] || 0,
                    damizlikAyrilan: stats.animals.byPurpose['DAMIZLIK'] || 0,
                    
                    // Sevk durumu
                    sevkBekleyen: stats.animals.byTransport['BEKLEMEDE'] || 0,
                    sevkEdilen: stats.animals.byTransport['SEVK_EDILDI'] || 0,
                    
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
                        labels: Object.keys(stats.animals.byCategory).filter(cat => stats.animals.byCategory[cat] > 0),
                        values: Object.values(stats.animals.byCategory).filter(val => val > 0)
                    },
                    sales: {
                        labels: ['Kesim Satışı', 'Damızlık Satışı'],
                        values: [stats.animals.sales.kesim, stats.animals.sales.damizlik]
                    },
                    saleStatus: {
                        labels: Object.keys(stats.animals.bySaleStatus).filter(status => stats.animals.bySaleStatus[status] > 0),
                        values: Object.values(stats.animals.bySaleStatus).filter(val => val > 0)
                    }
                }
            };

            console.log('Dashboard verileri hazırlandı');

            res.json({
                success: true,
                data: dashboardData
            });
        } catch (error) {
            console.error('Dashboard verileri alınırken hata:', error);
            res.status(500).json({
                success: false,
                error: 'Dashboard verileri alınırken bir hata oluştu'
            });
        }
    }

    /**
     * Son aktiviteleri getir
     */
    async getRecentActivities(req, res) {
        try {
            // Supabase sorgusu yoruma alındı
            /*
            const { data: activities, error } = await supabaseAdmin
                .from('activities')
                .select(`
                    *,
                    users (
                        name,
                        surname
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            */
            // Şimdilik boş veri döndürüyoruz
            res.json({
                success: true,
                data: []
            });
        } catch (error) {
            console.error('Aktiviteler alınırken hata:', error);
            res.status(500).json({
                success: false,
                error: 'Aktiviteler alınırken bir hata oluştu'
            });
        }
    }
}

module.exports = new DashboardController(); 