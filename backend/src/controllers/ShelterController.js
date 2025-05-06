/**
 * ShelterController.js - Barınak yönetimi kontrolcüsü
 */

const Shelter = require( '../models/Shelter' );
const Paddock = require( '../models/Paddock' );
const { handleSupabaseError } = require( '../utils/dbHelper' );

const ShelterController = {
    /**
     * Tüm barınakları listeler
     */
    getAllShelters: async ( req, res ) => {
        try {
            const shelters = await Shelter.findAll();

            return res.json( {
                success: true,
                data: shelters
            } );
        } catch ( error ) {
            console.error( 'Barınak listeleme hatası:', error );
            return res.status( 500 ).json( {
                success: false,
                error: handleSupabaseError( error ) || 'Barınaklar listelenirken bir hata oluştu'
            } );
        }
    },

    /**
     * Barınak detaylarını getirir
     */
    getShelterById: async ( req, res ) => {
        try {
            const { id } = req.params;
            const shelter = await Shelter.findById( id );

            if ( !shelter ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Barınak bulunamadı'
                } );
            }

            // Barınağın padoklarını getir
            const paddocks = await Paddock.findByShelterId( id );

            // Barınaktaki hayvanları getir
            const animals = await Shelter.getAnimals( id );

            return res.json( {
                success: true,
                data: {
                    ...shelter,
                    animals,
                    paddocks
                }
            } );
        } catch ( error ) {
            console.error( 'Barınak detayı getirme hatası:', error );
            return res.status( 500 ).json( {
                success: false,
                error: handleSupabaseError( error ) || 'Barınak detayları getirilirken bir hata oluştu'
            } );
        }
    },

    /**
     * Yeni barınak oluşturur
     */
    createShelter: async ( req, res ) => {
        try {
            const { name, description, capacity, location, status } = req.body;

            // Barınak adının benzersiz olup olmadığını kontrol et
            const { data: existingShelters } = await req.app.locals.supabase
                .from( 'shelters' )
                .select( 'id' )
                .eq( 'name', name );

            if ( existingShelters && existingShelters.length > 0 ) {
                return res.status( 400 ).json( {
                    success: false,
                    message: `"${name}" adında bir barınak zaten mevcut`
                } );
            }

            // Yeni barınak oluştur
            const shelter = await Shelter.create( {
                name,
                description,
                capacity: capacity || null,
                location: location || null,
                status: status || 'ACTIVE'
            } );

            return res.status( 201 ).json( {
                success: true,
                message: 'Barınak başarıyla oluşturuldu',
                data: shelter
            } );
        } catch ( error ) {
            console.error( 'Barınak oluşturma hatası:', error );
            return res.status( 500 ).json( {
                success: false,
                error: handleSupabaseError( error ) || 'Barınak oluşturulurken bir hata oluştu'
            } );
        }
    },

    /**
     * Barınak günceller
     */
    updateShelter: async ( req, res ) => {
        try {
            const { id } = req.params;
            const { name, description, capacity, location, status } = req.body;

            // Barınağın var olup olmadığını kontrol et
            const existingShelter = await Shelter.findById( id );
            if ( !existingShelter ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Barınak bulunamadı'
                } );
            }

            // Barınak adının benzersiz olup olmadığını kontrol et (aynı ID hariç)
            if ( name && name !== existingShelter.name ) {
                const { data: existingShelters } = await req.app.locals.supabase
                    .from( 'shelters' )
                    .select( 'id' )
                    .eq( 'name', name );

                if ( existingShelters && existingShelters.length > 0 ) {
                    return res.status( 400 ).json( {
                        success: false,
                        message: `"${name}" adında bir barınak zaten mevcut`
                    } );
                }
            }

            // Barınağı güncelle
            const shelter = await Shelter.update( id, {
                name: name || existingShelter.name,
                description: description !== undefined ? description : existingShelter.description,
                capacity: capacity !== undefined ? capacity : existingShelter.capacity,
                location: location !== undefined ? location : existingShelter.location,
                status: status || existingShelter.status
            } );

            return res.json( {
                success: true,
                message: 'Barınak başarıyla güncellendi',
                data: shelter
            } );
        } catch ( error ) {
            console.error( 'Barınak güncelleme hatası:', error );
            return res.status( 500 ).json( {
                success: false,
                error: handleSupabaseError( error ) || 'Barınak güncellenirken bir hata oluştu'
            } );
        }
    },

    /**
     * Barınak siler
     */
    deleteShelter: async ( req, res ) => {
        try {
            const { id } = req.params;

            // Barınağın var olup olmadığını kontrol et
            const existingShelter = await Shelter.findById( id );
            if ( !existingShelter ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Barınak bulunamadı'
                } );
            }

            // Barınağı sil (Shelter.delete içinde bağlı hayvanların ve padokların temizliği yapılıyor)
            await Shelter.delete( id );

            return res.json( {
                success: true,
                message: 'Barınak başarıyla silindi'
            } );
        } catch ( error ) {
            console.error( 'Barınak silme hatası:', error );
            return res.status( 500 ).json( {
                success: false,
                error: handleSupabaseError( error ) || 'Barınak silinirken bir hata oluştu'
            } );
        }
    },

    /**
     * Barınağa hayvan atama
     */
    assignAnimalsToShelter: async ( req, res ) => {
        try {
            const { id } = req.params;
            const { animalIds, paddockId } = req.body;

            if ( !animalIds || !Array.isArray( animalIds ) || animalIds.length === 0 ) {
                return res.status( 400 ).json( {
                    success: false,
                    message: 'Hayvan listesi (animalIds) gereklidir ve boş olmamalıdır'
                } );
            }

            // Barınağın var olup olmadığını kontrol et
            const existingShelter = await Shelter.findById( id );
            if ( !existingShelter ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Barınak bulunamadı'
                } );
            }

            // Padok ID verilmişse varlığını ve barınağa ait olup olmadığını kontrol et
            if ( paddockId ) {
                const existingPaddock = await Paddock.findById( paddockId );
                if ( !existingPaddock ) {
                    return res.status( 404 ).json( {
                        success: false,
                        message: 'Padok bulunamadı'
                    } );
                }

                if ( existingPaddock.shelter_id !== id ) {
                    return res.status( 400 ).json( {
                        success: false,
                        message: 'Padok bu barınağa ait değil'
                    } );
                }
            }

            // Hayvanları barınağa ata
            await Shelter.assignAnimals( id, paddockId, animalIds );

            return res.json( {
                success: true,
                message: 'Hayvanlar barınağa başarıyla atandı'
            } );
        } catch ( error ) {
            console.error( 'Barınağa hayvan atama hatası:', error );
            return res.status( 500 ).json( {
                success: false,
                error: handleSupabaseError( error ) || 'Hayvanlar barınağa atanırken bir hata oluştu'
            } );
        }
    },

    /**
     * Barınaktaki hayvanları listeler
     */
    getShelterAnimals: async ( req, res ) => {
        try {
            const { id } = req.params;

            // Barınağın var olup olmadığını kontrol et
            const existingShelter = await Shelter.findById( id );
            if ( !existingShelter ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Barınak bulunamadı'
                } );
            }

            // Barınaktaki hayvanları getir
            const animals = await Shelter.getAnimals( id );

            return res.json( {
                success: true,
                data: animals
            } );
        } catch ( error ) {
            console.error( 'Barınak hayvanları listeleme hatası:', error );
            return res.status( 500 ).json( {
                success: false,
                error: handleSupabaseError( error ) || 'Barınaktaki hayvanlar listelenirken bir hata oluştu'
            } );
        }
    }
};

module.exports = ShelterController;