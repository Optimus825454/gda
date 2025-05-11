/**
 * PaddockController.js - Padok yönetimi kontrolcüsü
 */

const Paddock = require( '../models/Paddock' );
const Shelter = require( '../models/Shelter' );
const { handleSupabaseError } = require( '../utils/dbHelper' );
const { validationResult } = require('express-validator');

class PaddockController {
    /**
     * Tüm padokları listeler
     */
    static async getAllPaddocks( req, res ) {
        try {
            const paddocks = await Paddock.findAll();

            return res.json( {
                success: true,
                data: paddocks
            } );
        } catch ( error ) {
            console.error( 'Padok listeleme hatası:', error );
            return res.status( 500 ).json( {
                success: false,
                error: handleSupabaseError( error ) || 'Padoklar listelenirken bir hata oluştu'
            } );
        }
    }

    /**
     * Belirli bir barınağa ait padokları listeler
     */
    static async getPaddocksByShelterId( req, res ) {
        try {
            const { shelterId } = req.params;

            // Barınağın var olup olmadığını kontrol et
            const existingShelter = await Shelter.findById( shelterId );
            if ( !existingShelter ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Barınak bulunamadı'
                } );
            }

            const paddocks = await Paddock.findByShelterId( shelterId );

            return res.json( {
                success: true,
                data: paddocks
            } );
        } catch ( error ) {
            console.error( 'Barınağa ait padokları listeleme hatası:', error );
            return res.status( 500 ).json( {
                success: false,
                error: handleSupabaseError( error ) || 'Barınağa ait padoklar listelenirken bir hata oluştu'
            } );
        }
    }

    /**
     * Padok detaylarını getirir
     */
    static async getPaddockById( req, res ) {
        try {
            const { id } = req.params;
            const paddock = await Paddock.findById( id );

            if ( !paddock ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Padok bulunamadı'
                } );
            }

            // Padoktaki hayvanları getir
            const animals = await Paddock.getAnimals( id );

            return res.json( {
                success: true,
                data: {
                    ...paddock,
                    animals
                }
            } );
        } catch ( error ) {
            console.error( 'Padok detayı getirme hatası:', error );
            return res.status( 500 ).json( {
                success: false,
                error: handleSupabaseError( error ) || 'Padok detayları getirilirken bir hata oluştu'
            } );
        }
    }

    /**
     * Yeni padok oluşturur
     */
    static async createPaddock( req, res ) {
        try {
            const { name, shelter_id, description, capacity, status } = req.body;

            if ( !shelter_id ) {
                return res.status( 400 ).json( {
                    success: false,
                    message: 'Barınak ID\'si (shelter_id) gereklidir'
                } );
            }

            // Barınağın var olup olmadığını kontrol et
            const existingShelter = await Shelter.findById( shelter_id );
            if ( !existingShelter ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Barınak bulunamadı'
                } );
            }

            // Aynı barınak içinde padok adının benzersiz olup olmadığını kontrol et
            const { data: existingPaddocks } = await req.app.locals.supabase
                .from( 'paddocks' )
                .select( 'id' )
                .eq( 'name', name )
                .eq( 'shelter_id', shelter_id );

            if ( existingPaddocks && existingPaddocks.length > 0 ) {
                return res.status( 400 ).json( {
                    success: false,
                    message: `Bu barınak içinde "${name}" adında bir padok zaten mevcut`
                } );
            }

            // Yeni padok oluştur
            const paddock = await Paddock.create( {
                name,
                shelter_id,
                description,
                capacity: capacity || null,
                status: status || 'ACTIVE'
            } );

            return res.status( 201 ).json( {
                success: true,
                message: 'Padok başarıyla oluşturuldu',
                data: paddock
            } );
        } catch ( error ) {
            console.error( 'Padok oluşturma hatası:', error );
            return res.status( 500 ).json( {
                success: false,
                error: handleSupabaseError( error ) || 'Padok oluşturulurken bir hata oluştu'
            } );
        }
    }

    /**
     * Padok günceller
     */
    static async updatePaddock( req, res ) {
        try {
            const { id } = req.params;
            const { name, description, capacity, status } = req.body;

            // Padoğun var olup olmadığını kontrol et
            const existingPaddock = await Paddock.findById( id );
            if ( !existingPaddock ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Padok bulunamadı'
                } );
            }

            // Aynı barınak içinde padok adının benzersiz olup olmadığını kontrol et (aynı ID hariç)
            if ( name && name !== existingPaddock.name ) {
                const { data: existingPaddocks } = await req.app.locals.supabase
                    .from( 'paddocks' )
                    .select( 'id' )
                    .eq( 'name', name )
                    .eq( 'shelter_id', existingPaddock.shelter_id )
                    .neq( 'id', id );

                if ( existingPaddocks && existingPaddocks.length > 0 ) {
                    return res.status( 400 ).json( {
                        success: false,
                        message: `Bu barınak içinde "${name}" adında bir padok zaten mevcut`
                    } );
                }
            }

            // Padoğu güncelle
            const paddock = await Paddock.update( id, {
                name: name || existingPaddock.name,
                description: description !== undefined ? description : existingPaddock.description,
                capacity: capacity !== undefined ? capacity : existingPaddock.capacity,
                status: status || existingPaddock.status
            } );

            return res.json( {
                success: true,
                message: 'Padok başarıyla güncellendi',
                data: paddock
            } );
        } catch ( error ) {
            console.error( 'Padok güncelleme hatası:', error );
            return res.status( 500 ).json( {
                success: false,
                error: handleSupabaseError( error ) || 'Padok güncellenirken bir hata oluştu'
            } );
        }
    }

    /**
     * Padok siler
     */
    static async deletePaddock( req, res ) {
        try {
            const { id } = req.params;

            // Padoğun var olup olmadığını kontrol et
            const existingPaddock = await Paddock.findById( id );
            if ( !existingPaddock ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Padok bulunamadı'
                } );
            }

            // Padoğu sil (Paddock.delete içinde bağlı hayvanların temizliği yapılıyor)
            await Paddock.delete( id );

            return res.json( {
                success: true,
                message: 'Padok başarıyla silindi'
            } );
        } catch ( error ) {
            console.error( 'Padok silme hatası:', error );
            return res.status( 500 ).json( {
                success: false,
                error: handleSupabaseError( error ) || 'Padok silinirken bir hata oluştu'
            } );
        }
    }

    /**
     * Padoğa hayvan atama
     */
    static async assignAnimals(req, res) {
        try {
            const { id: paddockId } = req.params;
            const { animalIds } = req.body;
            
            if (!animalIds || !Array.isArray(animalIds) || animalIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'En az bir hayvan ID\'si gereklidir'
                });
            }

            // Model içinde assignAnimals metodu oluşturmamız gerekecek
            await Paddock.assignAnimals(paddockId, animalIds);
            
            return res.status(200).json({
                success: true,
                message: `${animalIds.length} hayvan başarıyla padoğa atandı`
            });
        } catch (error) {
            console.error('Hayvanlar padoğa atanırken hata:', error);
            return res.status(500).json({
                success: false,
                message: 'Hayvanlar padoğa atanırken bir hata oluştu',
                error: error.message
            });
        }
    }

    /**
     * Padoktaki hayvanları listeler
     */
    static async getPaddockAnimals( req, res ) {
        try {
            const { id } = req.params;

            // Padoğun var olup olmadığını kontrol et
            const existingPaddock = await Paddock.findById( id );
            if ( !existingPaddock ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Padok bulunamadı'
                } );
            }

            // Padoktaki hayvanları getir
            const animals = await Paddock.getAnimals( id );

            return res.json( {
                success: true,
                data: animals
            } );
        } catch ( error ) {
            console.error( 'Padok hayvanları listeleme hatası:', error );
            return res.status( 500 ).json( {
                success: false,
                error: handleSupabaseError( error ) || 'Padoktaki hayvanlar listelenirken bir hata oluştu'
            } );
        }
    }

    /**
     * Padoktan hayvanları çıkar
     * @param {Request} req 
     * @param {Response} res 
     */
    static async removeAnimals(req, res) {
        try {
            const { paddockId } = req.params;
            const { animalIds } = req.body;
            
            if (!animalIds || !Array.isArray(animalIds) || animalIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'En az bir hayvan ID\'si gereklidir'
                });
            }
            
            await Paddock.removeAnimals(paddockId, animalIds);
            
            return res.status(200).json({
                success: true,
                message: `${animalIds.length} hayvan başarıyla padoktan çıkartıldı`
            });
        } catch (error) {
            console.error('Hayvanlar padoktan çıkartılırken hata:', error);
            return res.status(500).json({
                success: false,
                message: 'Hayvanlar padoktan çıkartılırken bir hata oluştu',
                error: error.message
            });
        }
    }

    /**
     * Hayvanları bir padoktan diğerine transfer et
     * @param {Request} req 
     * @param {Response} res 
     */
    static async transferAnimals(req, res) {
        try {
            const { paddockId } = req.params;
            const { targetPaddockId, animalIds } = req.body;
            
            if (!targetPaddockId) {
                return res.status(400).json({
                    success: false,
                    message: 'Hedef padok ID\'si gereklidir'
                });
            }
            
            if (!animalIds || !Array.isArray(animalIds) || animalIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'En az bir hayvan ID\'si gereklidir'
                });
            }
            
            await Paddock.transferAnimals(paddockId, targetPaddockId, animalIds);
            
            return res.status(200).json({
                success: true,
                message: `${animalIds.length} hayvan başarıyla transfer edildi`
            });
        } catch (error) {
            console.error('Hayvanlar transfer edilirken hata:', error);
            return res.status(500).json({
                success: false,
                message: 'Hayvanlar transfer edilirken bir hata oluştu',
                error: error.message
            });
        }
    }

    /**
     * Hayvanları bir padoktan başka bir padoğa transfer et
     */
    static async transferAnimalsBetweenPaddocks( req, res ) {
        try {
            const { id: sourcePaddockId } = req.params;
            const { targetPaddockId, animalIds } = req.body;

            if ( !animalIds || !Array.isArray( animalIds ) || animalIds.length === 0 ) {
                return res.status( 400 ).json( {
                    success: false,
                    message: 'Hayvan listesi (animalIds) gereklidir ve boş olmamalıdır'
                } );
            }

            if ( !targetPaddockId ) {
                return res.status( 400 ).json( {
                    success: false,
                    message: 'Hedef padok ID (targetPaddockId) gereklidir'
                } );
            }

            // Kaynak padoğun var olup olmadığını kontrol et
            const sourcePaddock = await Paddock.findById( sourcePaddockId );
            if ( !sourcePaddock ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Kaynak padok bulunamadı'
                } );
            }

            // Hedef padoğun var olup olmadığını kontrol et
            const targetPaddock = await Paddock.findById( targetPaddockId );
            if ( !targetPaddock ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Hedef padok bulunamadı'
                } );
            }

            // Her iki padoğun aynı barınakta olup olmadığını kontrol et
            if ( sourcePaddock.shelter_id !== targetPaddock.shelter_id ) {
                return res.status( 400 ).json( {
                    success: false,
                    message: 'Hayvanlar sadece aynı barınak içindeki padoklar arasında transfer edilebilir'
                } );
            }

            // Hayvanları bir padoktan diğerine transfer et
            await Paddock.transferAnimals( sourcePaddockId, targetPaddockId, animalIds );

            return res.json( {
                success: true,
                message: 'Hayvanlar padoklar arasında başarıyla transfer edildi'
            } );
        } catch ( error ) {
            console.error( 'Padoklar arası hayvan transfer hatası:', error );
            return res.status( 500 ).json( {
                success: false,
                error: handleSupabaseError( error ) || 'Hayvanlar transfer edilirken bir hata oluştu'
            } );
        }
    }
}

module.exports = PaddockController;