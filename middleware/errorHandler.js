/**
 * errorHandler.js - Global hata yakalama middleware'i
 */

const { supabase } = require( '../config/supabase' );

// Hata detaylarını loglama fonksiyonu
const logError = async ( err, req ) => {
    try {
        const errorLog = {
            error_message: err.message,
            error_stack: err.stack,
            error_code: err.code,
            path: req.path,
            method: req.method,
            timestamp: new Date(),
            user_id: req.user?.id
        };

        // Hata logunu veritabanına kaydet
        await supabase
            .from( 'error_logs' )
            .insert( errorLog );

    } catch ( logError ) {
        console.error( 'Hata loglanırken sorun oluştu:', logError );
    }
};

// Global hata yakalama middleware'i
const errorHandler = async ( err, req, res, next ) => {
    // Hatayı logla
    await logError( err, req );

    // Hata türüne göre uygun yanıtı hazırla
    if ( err.name === 'ValidationError' ) {
        return res.status( 400 ).json( {
            error: 'Validation Error',
            details: err.message
        } );
    }

    if ( err.name === 'AuthenticationError' ) {
        return res.status( 401 ).json( {
            error: 'Authentication Error',
            details: err.message
        } );
    }

    if ( err.name === 'AuthorizationError' ) {
        return res.status( 403 ).json( {
            error: 'Authorization Error',
            details: err.message
        } );
    }

    if ( err.name === 'NotFoundError' ) {
        return res.status( 404 ).json( {
            error: 'Not Found',
            details: err.message
        } );
    }

    // Varsayılan olarak 500 Internal Server Error
    console.error( 'Beklenmeyen hata:', err );

    // Geliştirme ortamında detaylı hata göster
    if ( process.env.NODE_ENV === 'development' ) {
        return res.status( 500 ).json( {
            error: 'Internal Server Error',
            details: err.message,
            stack: err.stack
        } );
    }

    // Prodüksiyonda genel hata mesajı
    return res.status( 500 ).json( {
        error: 'Internal Server Error',
        message: 'Beklenmeyen bir hata oluştu'
    } );
};

// Custom hata sınıfları
class ValidationError extends Error {
    constructor( message ) {
        super( message );
        this.name = 'ValidationError';
    }
}

class AuthenticationError extends Error {
    constructor( message ) {
        super( message );
        this.name = 'AuthenticationError';
    }
}

class AuthorizationError extends Error {
    constructor( message ) {
        super( message );
        this.name = 'AuthorizationError';
    }
}

class NotFoundError extends Error {
    constructor( message ) {
        super( message );
        this.name = 'NotFoundError';
    }
}

module.exports = {
    errorHandler,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError
};