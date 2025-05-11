/**
 * Hata yönetimi için yardımcı fonksiyon
 * @param {object} res - Express response objesi
 * @param {Error} error - Hata objesi
 */
function handleError(res, error) {
    console.error('Hata oluştu:', error);

    // MySQL duplicate entry hatası
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
            success: false,
            message: 'Bu tespit numarası zaten kullanılmış'
        });
    }

    // MySQL foreign key hatası
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            message: 'Referans verilen kayıt bulunamadı'
        });
    }

    // Genel hata durumu
    res.status(500).json({
        success: false,
        message: 'Bir hata oluştu',
        error: error.message
    });
}

module.exports = {
    handleError
}; 