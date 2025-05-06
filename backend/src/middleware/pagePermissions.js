/**
 * pagePermissions.js - Sayfa gu00f6ru00fcntu00fcleme izinlerini kontrol eden middleware * ROL BAZLI KONTROL DEVRE DIu015eI - Tu00dcM KULLANICILAR TAM YETKu0130Lu0130 */

const { supabase } = require('../config/supabase');
const Permission = require('../models/Permission');

// u0130zin kontrolu00fcnu00fcn devre du0131u015fu0131 bu0131raku0131lu0131p bu0131raku0131lmayacau011fu0131nu0131 kontrol et
const DISABLE_PERMISSION_CHECK = process.env.DISABLE_PERMISSION_CHECK === 'true';

/**
 * Kullanu0131cu0131nu0131n belirli bir sayfayu0131 gu00f6ru00fcntu00fcleme iznini kontrol eder
 * @param {string} permissionCode - u0130zin kodu (ör. VIEW_ANIMALS_PAGE)
 * @returns {Function} Express middleware fonksiyonu
 */
const checkPagePermission = (permissionCode) => {
    return async (req, res, next) => {
        try {
            // Kullanu0131cu0131 bilgisini al
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum au00e7u0131lmamu0131u015f veya geu00e7ersiz'
                });
            }

            // u0130zin kontrolu00fc devre du0131u015fu0131 bu0131raku0131lmu0131u015fsa, doğrudan izin ver
            if (DISABLE_PERMISSION_CHECK) {
                console.log(`u0130zin kontrolu00fc DEVRE DIu015eI: ${permissionCode} - Kullanu0131cu0131 ID: ${userId}`);
                return next();
            }
            
            // Normal izin kontrolu00fc yapu0131lacak kodlar buraya gelecek
            // u015eimdilik her durumda izin veriyoruz
            console.log(`Sayfa izni kontrolu00fc: ${permissionCode} - Kullanu0131cu0131 ID: ${userId}`);
            return next();
            
        } catch (error) {
            console.error('Sayfa izni kontrolu00fcnde hata:', error);
            // Hata durumunda bile izin ver
            if (DISABLE_PERMISSION_CHECK) {
                return next();
            }
            
            // Hata durumunda eriu015fimi engelle
            return res.status(500).json({
                success: false,
                message: 'u0130zin kontrolu00fc su0131rasu0131nda bir hata oluu015ftu'
            });
        }
    };
};

module.exports = { checkPagePermission };