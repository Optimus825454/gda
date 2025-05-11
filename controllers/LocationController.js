const Location = require( '../models/Location' );
const Animal = require( '../models/Animal' ); // Animal modelini import et
const { supabase } = require( '../config/supabaseClient' );
const { checkUserHasRole } = require( '../middleware/permissions' ); // Rol kontrol fonksiyonunu import et

class LocationController {
    // Tüm lokasyonları listele
    static async getAllLocations( req, res ) {
        try {
            const locations = await Location.getAll();
            res.json( { success: true, data: locations } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                message: 'Lokasyonlar listelenirken hata oluştu',
                error: error.message
            } );
        }
    }

    // Belirli bir lokasyonu getir
    static async getLocation( req, res ) {
        try {
            const location = await Location.getById( req.params.id );
            if ( !location ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Lokasyon bulunamadı'
                } );
            }
            res.json( { success: true, data: location } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                message: 'Lokasyon bilgisi alınırken hata oluştu',
                error: error.message
            } );
        }
    }

    // Yeni lokasyon oluştur
    static async createLocation( req, res ) {
        try {
            const { name, type, capacity, notes } = req.body;

            // Yetki kontrolü (user_roles ve roles tabloları kullanılarak)
            const hasPermission = await checkUserHasRole( req.user.id, ['SUPERADMIN', 'GULVET_ADMIN'] );
            if ( !hasPermission ) {
                return res.status( 403 ).json( {
                    success: false,
                    message: 'Bu işlem için yetkiniz bulunmamaktadır'
                } );
            }

            const location = new Location( {
                name,
                type,
                capacity,
                notes,
                status: 'AKTIF'
            } );

            const savedLocation = await location.save();
            res.status( 201 ).json( { success: true, data: savedLocation } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                message: 'Lokasyon oluşturulurken hata oluştu',
                error: error.message
            } );
        }
    }

    // Lokasyon güncelle
    static async updateLocation( req, res ) {
        try {
            let location = await Location.getById( req.params.id );
            if ( !location ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Lokasyon bulunamadı'
                } );
            }

            // Yetki kontrolü (user_roles ve roles tabloları kullanılarak)
            const hasPermission = await checkUserHasRole( req.user.id, ['SUPERADMIN', 'GULVET_ADMIN'] );
            if ( !hasPermission ) {
                return res.status( 403 ).json( {
                    success: false,
                    message: 'Bu işlem için yetkiniz bulunmamaktadır'
                } );
            }

            // Kapasite güncelleme kontrolü
            if ( req.body.capacity !== undefined && req.body.capacity !== null ) {
                const occupancy = await location.getOccupancyRate();
                if ( req.body.capacity < occupancy.current ) {
                    return res.status( 400 ).json( {
                        success: false,
                        message: 'Yeni kapasite mevcut hayvan sayısından küçük olamaz'
                    } );
                }
            }

            Object.assign( location, req.body );
            const updatedLocation = await location.save();
            res.json( { success: true, data: updatedLocation } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                message: 'Lokasyon güncellenirken hata oluştu',
                error: error.message
            } );
        }
    }

    // Lokasyon sil
    static async deleteLocation( req, res ) {
        try {
            const location = await Location.getById( req.params.id );
            if ( !location ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Lokasyon bulunamadı'
                } );
            }

            // Yetki kontrolü (user_roles ve roles tabloları kullanılarak)
            const hasPermission = await checkUserHasRole( req.user.id, ['SUPERADMIN', 'GULVET_ADMIN'] );
            if ( !hasPermission ) {
                return res.status( 403 ).json( {
                    success: false,
                    message: 'Bu işlem için yetkiniz bulunmamaktadır'
                } );
            }

            await location.delete();
            res.json( {
                success: true,
                message: 'Lokasyon başarıyla silindi'
            } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                message: 'Lokasyon silinirken hata oluştu',
                error: error.message
            } );
        }
    }

    // Lokasyon doluluk oranı
    static async getOccupancyRate( req, res ) {
        try {
            const location = await Location.getById( req.params.id );
            if ( !location ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Lokasyon bulunamadı'
                } );
            }

            const occupancy = await location.getOccupancyRate();
            res.json( { success: true, data: occupancy } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                message: 'Doluluk oranı hesaplanırken hata oluştu',
                error: error.message
            } );
        }
    }

    // Lokasyondaki hayvanları listele
    static async getAnimalsInLocation( req, res ) {
        try {
            const location = await Location.getById( req.params.id );
            if ( !location ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Lokasyon bulunamadı'
                } );
            }

            const animals = await location.getAnimals();
            res.json( { success: true, data: animals } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                message: 'Hayvanlar listelenirken hata oluştu',
                error: error.message
            } );
        }
    }

    // Hayvanın lokasyonunu güncelle (transfer yerine)
    static async updateAnimalLocation( req, res ) {
        try {
            const { id: locationId, animalId } = req.params;
            const { reason } = req.body;

            const animal = await Animal.findById( animalId );
            if ( !animal ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Hayvan bulunamadı'
                } );
            }

            const targetLocation = await Location.getById( locationId );
            if ( !targetLocation ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Hedef lokasyon bulunamadı'
                } );
            }

            // Kapasite kontrolü (hedef lokasyon için)
            if ( targetLocation.capacity !== null ) { // Kapasite tanımlıysa kontrol et
                const occupancy = await targetLocation.getOccupancyRate();
                if ( occupancy.current >= targetLocation.capacity ) {
                    return res.status( 400 ).json( {
                        success: false,
                        message: 'Hedef lokasyon kapasitesi dolu'
                    } );
                }
            }


            // Hayvanın lokasyonunu güncelle ve geçmişe kaydet
            await animal.updateLocation( locationId, reason ); // updateLocation metodu lokasyon ID'si alacak şekilde güncellendi

            res.json( {
                success: true,
                message: 'Hayvan lokasyonu başarıyla güncellendi'
            } );

        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                message: 'Hayvan lokasyonu güncellenirken hata oluştu',
                error: error.message
            } );
        }
    }


    // Müsait lokasyonları listele
    static async getAvailableLocations( req, res ) {
        try {
            const { type } = req.query;
            const locations = await Location.getAvailableLocations( type );
            res.json( { success: true, data: locations } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                message: 'Müsait lokasyonlar listelenirken hata oluştu',
                error: error.message
            } );
        }
    }
}

module.exports = LocationController;