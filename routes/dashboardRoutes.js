const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const authenticateToken = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/checkPermission');
const { pool } = require('../config/mysql');
const { calculateAnimalStatistics } = require('../utils/animalStatsHelper');

// Dashboard verileri
router.get('/data', 
    authenticateToken,
    checkPermission(['VIEW_DASHBOARD']),
    DashboardController.getDashboardData
);

// Son aktiviteler
router.get('/activities',
    authenticateToken,
    checkPermission(['VIEW_DASHBOARD']),
    DashboardController.getRecentActivities
);

// Tüm rapor sayılarını tek seferde döndüren endpoint
router.get('/animal-report-counts', async (req, res) => {
    try {
        console.log('[DEBUG] /dashboard/animal-report-counts endpoint\'ine istek geldi');
        const connection = await pool.getConnection();
        
        // Tüm rapor sayılarını tek bir SQL sorgusu ile al
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM hayvanlar 
                 WHERE kategori = 'İnek' AND gebelikdurum = 'GEBE') as pregnant_cows_count,
                
                (SELECT COUNT(*) FROM hayvanlar 
                 WHERE kategori = 'Gebe Düve') as pregnant_heifers_count,
                
                (SELECT COUNT(*) FROM hayvanlar 
                 WHERE kategori = 'İnek' AND durum = 'KURU') as dry_cows_count,
                
                (SELECT COUNT(*) FROM hayvanlar 
                 WHERE cinsiyet = 'Erkek') as male_calves_count,
                
                (SELECT COUNT(DISTINCT h.id) FROM hayvanlar h 
                 INNER JOIN blood_samples bs ON h.kupeno = bs.tag_number) as tested_animals_count,
                
                (SELECT COUNT(*) FROM hayvanlar h 
                 WHERE NOT EXISTS (
                     SELECT 1 FROM blood_samples bs 
                     WHERE h.kupeno = bs.tag_number
                 )) as untested_animals_count,
                
                (SELECT COUNT(DISTINCT h.id) FROM hayvanlar h 
                 INNER JOIN hayvan_satis hs ON h.id = hs.hayvan_id) as sold_animals_count,
                
                (SELECT COUNT(*) FROM hayvanlar 
                 WHERE durum = 'KESILDI') as slaughtered_animals_count,
                
                (SELECT COUNT(*) FROM hayvanlar 
                 WHERE durum = 'KESIME_SEVK') as slaughter_referral_count,
                
                (SELECT COUNT(*) FROM hayvanlar 
                 WHERE amac = 'DAMIZLIK') as breeding_stock_count,
                
                (SELECT COUNT(*) FROM hayvanlar 
                 WHERE kategori = 'İnek') as all_cows_count
        `;
        
        const [results] = await connection.query(query);
        connection.release();

        console.log('[DEBUG] Rapor sayıları hesaplandı:', results[0]);
        res.json(results[0]);
    } catch (error) {
        console.error('Rapor sayıları alınırken hata:', error);
        res.status(500).json({ error: 'Rapor sayıları alınamadı', details: error.message });
    }
});

module.exports = router; 