/**
 * Basit izin kontrolü için middleware
 * @param {string[]} requiredPermissions - Gerekli izinler dizisi
 */
const checkPermission = (requiredPermissions) => {
    return async (req, res, next) => {
        // Basit izin kontrolü: Tüm izinlere sahip olduğunu varsay
        console.log('Basit izin kontrolü: Tüm izinlere izin verildi');
        return next();
    };
};

module.exports = {
    checkPermission
};