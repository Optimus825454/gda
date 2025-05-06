/**
 * permissions.js - İzin kontrolü middleware
 * ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
 */

const Permission = require( '../models/Permission' );
const User = require( '../models/User' );

/**
 * Belirli bir izne sahip olup olmadığını kontrol eden middleware
 * @param {string} permissionCode - Gerekli izin kodu
 * @returns {function} Express middleware
 */
const checkPermission = ( permissionCode ) => {
    return async ( req, res, next ) => {
        try {
            // Kullanıcı kimliği kontrolü
            if ( !req.user || !req.user.id ) {
                return res.status( 401 ).json( {
                    success: false,
                    error: 'Kimlik doğrulaması gerekli'
                } );
            }

            // ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
            console.log(`İzin kontrolü DEVRE DIŞI: ${permissionCode} - Kullanıcı ID: ${req.user.id}`);
            return next();
            
        } catch ( error ) {
            console.error( 'İzin kontrolünde hata:', error );
            // Hata durumunda bile izin ver
            return next();
        }
    };
};

/**
 * Bir veya birden fazla izinden en az birine sahip olup olmadığını kontrol eden middleware
 * @param {string[]} permissionCodes - Gerekli izin kodları dizisi
 * @returns {function} Express middleware
 */
const checkAnyPermission = ( permissionCodes ) => {
    return async ( req, res, next ) => {
        try {
            // Kullanıcı kimliği kontrolü
            if ( !req.user || !req.user.id ) {
                return res.status( 401 ).json( {
                    success: false,
                    error: 'Kimlik doğrulaması gerekli'
                } );
            }

            // ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
            console.log(`İzin kontrolü DEVRE DIŞI: ${permissionCodes.join(', ')} - Kullanıcı ID: ${req.user.id}`);
            return next();
            
        } catch ( error ) {
            console.error( 'İzin kontrolünde hata:', error );
            // Hata durumunda bile izin ver
            return next();
        }
    };
};

/**
 * Tüm belirtilen izinlere sahip olup olmadığını kontrol eden middleware
 * @param {string[]} permissionCodes - Gerekli izin kodları dizisi
 * @returns {function} Express middleware
 */
const checkAllPermissions = ( permissionCodes ) => {
    return async ( req, res, next ) => {
        try {
            // Kullanıcı kimliği kontrolü
            if ( !req.user || !req.user.id ) {
                return res.status( 401 ).json( {
                    success: false,
                    error: 'Kimlik doğrulaması gerekli'
                } );
            }

            // ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
            console.log(`İzin kontrolü DEVRE DIŞI: ${permissionCodes.join(', ')} - Kullanıcı ID: ${req.user.id}`);
            return next();
            
        } catch ( error ) {
            console.error( 'İzin kontrolünde hata:', error );
            // Hata durumunda bile izin ver
            return next();
        }
    };
};

/**
 * Belirli bir kullanıcıya erişim izni olup olmadığını kontrol eden middleware
 * @param {string} paramName - Kullanıcı ID'sini içeren URL parametresinin adı
 * @returns {function} Express middleware
 */
const checkUserAccess = ( paramName = 'id' ) => {
    return async ( req, res, next ) => {
        try {
            // Kullanıcı kimliği kontrolü
            if ( !req.user || !req.user.id ) {
                return res.status( 401 ).json( {
                    success: false,
                    error: 'Kimlik doğrulaması gerekli'
                } );
            }

            // ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
            console.log(`Kullanıcı erişim kontrolü DEVRE DIŞI - Kullanıcı ID: ${req.user.id}`);
            return next();
            
        } catch ( error ) {
            console.error( 'Kullanıcı erişim kontrolünde hata:', error );
            // Hata durumunda bile izin ver
            return next();
        }
    };
};

/**
 * Basit permission middleware: hasPermission
 * @param {string} permission - Gerekli izin kodu
 * @returns {function} Express middleware
 */
const hasPermission = (permission) => {
    return (req, res, next) => {
        // ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
        console.log(`Basit izin kontrolü DEVRE DIŞI: ${permission}`);
        return next();
    };
};

module.exports = {
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    checkUserAccess,
    hasPermission
};