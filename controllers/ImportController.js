/**
 * ImportController.js - Toplu veri ithalat işlemleri için controller
 */

const path = require( 'path' );
const multer = require( 'multer' );
const fs = require( 'fs' );
const ImportService = require( '../services/ImportService' );

// Upload klasörü yoksa oluştur
const uploadDir = path.join( __dirname, '..', '..', 'uploads' );
if ( !fs.existsSync( uploadDir ) ) {
    fs.mkdirSync( uploadDir, { recursive: true } );
}

// Dosya yükleme yapılandırması
const storage = multer.diskStorage( {
    destination: function ( req, file, cb ) {
        cb( null, uploadDir );
    },
    filename: function ( req, file, cb ) {
        const uniqueSuffix = Date.now() + '-' + Math.round( Math.random() * 1E9 );
        cb( null, uniqueSuffix + '-' + file.originalname );
    }
} );

// Dosya filtreleme (sadece csv ve xlsx kabul et)
const fileFilter = ( req, file, cb ) => {
    // Desteklenen dosya tipleri
    const fileTypes = /csv|xlsx|xls/;

    // Dosya uzantısını kontrol et
    const extname = fileTypes.test( path.extname( file.originalname ).toLowerCase() );

    // Mime türünü kontrol et
    const mimetype = fileTypes.test( file.mimetype );

    if ( extname && mimetype ) {
        return cb( null, true );
    } else {
        cb( new Error( 'Sadece CSV ve Excel dosyaları yüklenebilir' ) );
    }
};

// Multer upload nesnesi
const upload = multer( {
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB sınır
} );

class ImportController {
    /**
     * Başarılı yanıt oluşturur
     */
    static success( res, data, message = '' ) {
        res.status( 200 ).json( {
            success: true,
            message,
            data
        } );
    }

    /**
     * Hata yanıtı oluşturur
     */
    static error( res, error, status = 500 ) {
        console.error( 'Import Controller Hatası:', error );
        res.status( status ).json( {
            success: false,
            error: error.message || error
        } );
    }

    /**
     * CSV/Excel dosyasından hayvan verileri yükler
     */
    static uploadAnimals( req, res ) {
        // Multer single upload middleware
        const uploadMiddleware = upload.single( 'file' );

        uploadMiddleware( req, res, async function ( err ) {
            if ( err instanceof multer.MulterError ) {
                // Multer hatası (dosya boyutu vb.)
                return ImportController.error( res, err, 400 );
            } else if ( err ) {
                // Diğer hatalar (dosya tipi vb.)
                return ImportController.error( res, err, 400 );
            }

            // Dosya yüklenmedi mi?
            if ( !req.file ) {
                return ImportController.error( res, new Error( 'Lütfen bir dosya seçin' ), 400 );
            }

            try {
                // Dosya tipini belirle
                const fileType = path.extname( req.file.originalname ).toLowerCase().substring( 1 );

                // Dosyayı işle ve hayvanları içe aktar
                const result = await ImportService.importAnimalsFromFile( req.file.path, fileType );

                ImportController.success( res, result, result.message );
            } catch ( error ) {
                ImportController.error( res, error );
            }
        } );
    }

    /**
     * Toplu test sonucu güncelleme
     */
    static async bulkUpdateTestResults( req, res ) {
        try {
            const testResults = req.body;

            if ( !Array.isArray( testResults ) || testResults.length === 0 ) {
                return ImportController.error( res, new Error( 'Geçerli test sonuç verisi sağlanmadı' ), 400 );
            }

            const result = await ImportService.bulkUpdateTestResults( testResults );
            ImportController.success( res, result, result.message );
        } catch ( error ) {
            ImportController.error( res, error );
        }
    }

    /**
     * Örnek şablon indirme
     */
    static downloadTemplate( req, res ) {
        try {
            const templateType = req.params.type || 'animals';
            let templatePath;

            // Şablon türüne göre dosya yolunu belirle
            switch ( templateType ) {
                case 'animals':
                    templatePath = path.join( __dirname, '..', '..', 'templates', 'animal_import_template.xlsx' );
                    break;
                case 'tests':
                    templatePath = path.join( __dirname, '..', '..', 'templates', 'test_results_template.xlsx' );
                    break;
                default:
                    return ImportController.error( res, new Error( 'Geçersiz şablon türü' ), 400 );
            }

            // Şablon dosyası var mı kontrol et
            if ( !fs.existsSync( templatePath ) ) {
                return ImportController.error( res, new Error( 'Şablon dosyası bulunamadı' ), 404 );
            }

            // Dosyayı gönder
            res.download( templatePath );
        } catch ( error ) {
            ImportController.error( res, error );
        }
    }
}

module.exports = ImportController;