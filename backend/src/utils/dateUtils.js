/**
 * dateUtils.js - Tarih ve zamanla ilgili yardımcı fonksiyonlar.
 */

/**
 * Verilen doğum tarihine göre yaşı (yıl, ay, gün) hesaplar.
 * @param {string | Date} dobString - Doğum tarihi (string veya Date objesi).
 * @returns {string | null} Formatlanmış yaş veya geçersiz tarih için null.
 */
function calculateAge(dobString) {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null; // Geçersiz tarih kontrolü

    const today = new Date();
    let ageYears = today.getFullYear() - dob.getFullYear();
    let ageMonths = today.getMonth() - dob.getMonth();
    let ageDays = today.getDate() - dob.getDate();

    if (ageDays < 0) {
        ageMonths--;
        // Bir önceki ayın gün sayısını al
        const daysInLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        ageDays += daysInLastMonth;
    }

    if (ageMonths < 0) {
        ageYears--;
        ageMonths += 12;
    }

    return `${ageYears} yıl, ${ageMonths} ay, ${ageDays} gün`;
}

/**
 * Tohumlama tarihi ve beklenen buzağılama tarihine göre gebelik detaylarını hesaplar.
 * @param {string | Date} tohumlamaTarihiStr - Tohumlama tarihi.
 * @param {string | Date} beklenenBuzagilamaTarihiStr - Beklenen buzağılama tarihi.
 * @returns {{tohumlama_tarihi: string, beklenen_buzagilama_tarihi: string, tahmini_doguma_kalan_gun: number | string} | null}
 * Gebelik detayları veya geçersiz tarihler için null.
 */
function calculateGestationDetails(tohumlamaTarihiStr, beklenenBuzagilamaTarihiStr) {
    if (!tohumlamaTarihiStr || !beklenenBuzagilamaTarihiStr) return null;

    const tohumlamaTarihi = new Date(tohumlamaTarihiStr);
    const beklenenBuzagilamaTarihi = new Date(beklenenBuzagilamaTarihiStr);

    if (isNaN(tohumlamaTarihi.getTime()) || isNaN(beklenenBuzagilamaTarihi.getTime())) {
        return {
            tohumlama_tarihi: 'Geçersiz Tarih',
            beklenen_buzagilama_tarihi: 'Geçersiz Tarih',
            tahmini_doguma_kalan_gun: 'Hesaplanamadı'
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Saat farklarından etkilenmemek için
    const timeDiff = beklenenBuzagilamaTarihi.getTime() - today.getTime();
    const kalanGun = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return {
        tohumlama_tarihi: tohumlamaTarihi.toLocaleDateString('tr-TR'),
        beklenen_buzagilama_tarihi: beklenenBuzagilamaTarihi.toLocaleDateString('tr-TR'),
        tahmini_doguma_kalan_gun: kalanGun >= 0 ? kalanGun : 'Doğum Geçmiş'
    };
}


module.exports = {
    calculateAge,
    calculateGestationDetails
};
