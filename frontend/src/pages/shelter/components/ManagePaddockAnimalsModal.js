import React, { useState, useEffect } from 'react';
import { useShelter } from '../../../contexts/ShelterContext';
import Modal from '../../../components/common/Modal';

const ManagePaddockAnimalsModal = ( { shelter, paddock, onClose, onUpdate } ) => {
    const {
        removeAnimalsFromPaddock,
        transferAnimalsBetweenPaddocks,
        error,
        setError
    } = useShelter();

    const [selectedAnimals, setSelectedAnimals] = useState( [] );
    const [targetPaddock, setTargetPaddock] = useState( '' );
    const [availablePaddocks, setAvailablePaddocks] = useState( [] );
    const [loading, setLoading] = useState( false );
    const [success, setSuccess] = useState( false );
    const [action, setAction] = useState( 'remove' ); // 'remove' or 'transfer'

    // Arama filtresi
    const [searchTerm, setSearchTerm] = useState( '' );

    // Barınak içindeki diğer padokları filtrele
    useEffect( () => {
        if ( shelter && shelter.paddocks && paddock ) {
            const otherPaddocks = shelter.paddocks.filter( p => p.id !== paddock.id );
            setAvailablePaddocks( otherPaddocks );
        }
    }, [shelter, paddock] );

    // Padoktaki hayvanları filtrele
    const filteredAnimals = paddock?.animals?.filter( animal =>
        animal.tag_number?.toLowerCase().includes( searchTerm.toLowerCase() ) ||
        animal.name?.toLowerCase().includes( searchTerm.toLowerCase() )
    ) || [];

    // Hayvan seçme işlemi
    const toggleAnimalSelection = ( animalId ) => {
        if ( selectedAnimals.includes( animalId ) ) {
            setSelectedAnimals( prev => prev.filter( id => id !== animalId ) );
        } else {
            setSelectedAnimals( prev => [...prev, animalId] );
        }
    };

    // Tüm hayvanları seç/kaldır
    const toggleAllAnimals = () => {
        if ( selectedAnimals.length === filteredAnimals.length ) {
            setSelectedAnimals( [] );
        } else {
            setSelectedAnimals( filteredAnimals.map( animal => animal.id ) );
        }
    };

    // Form gönderme
    const handleSubmit = async ( e ) => {
        e.preventDefault();
        setError( null );

        if ( selectedAnimals.length === 0 ) {
            setError( 'Lütfen en az bir hayvan seçin' );
            return;
        }

        if ( action === 'transfer' && !targetPaddock ) {
            setError( 'Lütfen hedef padok seçin' );
            return;
        }

        setLoading( true );

        try {
            if ( action === 'remove' ) {
                await removeAnimalsFromPaddock( paddock.id, selectedAnimals );
            } else if ( action === 'transfer' ) {
                await transferAnimalsBetweenPaddocks( paddock.id, targetPaddock, selectedAnimals );
            }

            setSuccess( true );

            // İşlem başarılı olduğunda parent komponente bildir
            if ( onUpdate ) {
                onUpdate();
            }

            // 1.5 saniye sonra modal'ı kapat
            setTimeout( () => {
                onClose();
            }, 1500 );

        } catch ( err ) {
            console.error( 'Hayvan yönetimi hatası:', err );
        } finally {
            setLoading( false );
        }
    };

    return (
        <Modal
            title={`"${paddock?.name}" Padoğundaki Hayvanları Yönet`}
            onClose={onClose}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-200 text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-3 bg-green-900/50 border border-green-800 rounded-lg text-green-200 text-sm">
                        {action === 'remove'
                            ? 'Hayvanlar başarıyla padoktan çıkarıldı!'
                            : 'Hayvanlar başarıyla diğer padoka aktarıldı!'}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {/* İşlem Seçimi */}
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <h3 className="text-sm font-medium text-gray-300 mb-3">İşlem Seçimi</h3>

                        <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio text-blue-600"
                                    name="action"
                                    value="remove"
                                    checked={action === 'remove'}
                                    onChange={() => setAction( 'remove' )}
                                />
                                <span className="ml-2 text-sm text-gray-300">Hayvanları Padoktan Çıkar</span>
                            </label>

                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio text-blue-600"
                                    name="action"
                                    value="transfer"
                                    checked={action === 'transfer'}
                                    disabled={availablePaddocks.length === 0}
                                    onChange={() => setAction( 'transfer' )}
                                />
                                <span className={`ml-2 text-sm ${availablePaddocks.length === 0 ? 'text-gray-500' : 'text-gray-300'}`}>
                                    Hayvanları Başka Padoka Taşı
                                </span>
                            </label>
                        </div>

                        {action === 'transfer' && (
                            <div className="mt-4">
                                <label htmlFor="targetPaddock" className="block mb-1 text-xs text-gray-400">
                                    Hedef Padok
                                </label>

                                {availablePaddocks.length === 0 ? (
                                    <div className="text-sm text-gray-400">
                                        Barınakta başka padok bulunmamaktadır.
                                    </div>
                                ) : (
                                    <select
                                        id="targetPaddock"
                                        value={targetPaddock}
                                        onChange={( e ) => setTargetPaddock( e.target.value )}
                                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                                        required={action === 'transfer'}
                                    >
                                        <option value="">Hedef padok seçiniz</option>
                                        {availablePaddocks.map( p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} {p.current_count !== undefined && `(${p.current_count}/${p.capacity || 'Sınırsız'})`}
                                            </option>
                                        ) )}
                                    </select>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Hayvan Listesi */}
                    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                        <div className="p-3 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-sm font-medium text-gray-300">Padoktaki Hayvanlar</h3>

                            <div className="flex items-center">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={( e ) => setSearchTerm( e.target.value )}
                                    placeholder="Hayvan ara..."
                                    className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded-lg text-white mr-2"
                                />

                                <label className="flex items-center text-xs">
                                    <input
                                        type="checkbox"
                                        className="mr-1"
                                        checked={selectedAnimals.length === filteredAnimals.length && filteredAnimals.length > 0}
                                        onChange={toggleAllAnimals}
                                    />
                                    Tümünü Seç
                                </label>
                            </div>
                        </div>

                        <div className="p-2 bg-gray-900 border-b border-gray-700 flex justify-between items-center text-xs text-gray-400">
                            <div>Toplam: {paddock?.animals?.length || 0} hayvan</div>
                            <div>Seçilen: {selectedAnimals.length} hayvan</div>
                        </div>

                        {!paddock?.animals || paddock.animals.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                Bu padokta henüz hayvan bulunmamaktadır.
                            </div>
                        ) : filteredAnimals.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                Arama kriterine uygun hayvan bulunamadı.
                            </div>
                        ) : (
                            <div className="overflow-y-auto" style={{ maxHeight: '350px' }}>
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
                                        <tr>
                                            <th className="py-2 px-2 w-10 text-center"></th>
                                            <th className="py-2 px-2 text-left">Küpe No</th>
                                            <th className="py-2 px-2 text-left">Tür</th>
                                            <th className="py-2 px-2 text-left">Cinsiyet</th>
                                            <th className="py-2 px-2 text-left">Yaş</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAnimals.map( animal => (
                                            <tr
                                                key={animal.id}
                                                className={`border-t border-gray-700 hover:bg-gray-700 cursor-pointer ${selectedAnimals.includes( animal.id ) ? 'bg-blue-900/40' : ''
                                                    }`}
                                                onClick={() => toggleAnimalSelection( animal.id )}
                                            >
                                                <td className="py-2 px-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAnimals.includes( animal.id )}
                                                        onChange={() => { }} // onClick zaten ekledik
                                                        className="accent-blue-600"
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <div className="font-medium text-white">{animal.tag_number}</div>
                                                    {animal.name && <div className="text-xs text-gray-400">{animal.name}</div>}
                                                </td>
                                                <td className="py-2 px-2 text-gray-300">{animal.species}</td>
                                                <td className="py-2 px-2 text-gray-300">
                                                    {animal.gender === 'M' ? 'Erkek' : animal.gender === 'F' ? 'Dişi' : animal.gender}
                                                </td>
                                                <td className="py-2 px-2 text-gray-300">
                                                    {animal.birthdate ? (
                                                        new Date().getFullYear() - new Date( animal.birthdate ).getFullYear()
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        ) )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* İşlem Butonları */}
                <div className="flex justify-end space-x-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                        disabled={loading}
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                        disabled={
                            loading ||
                            selectedAnimals.length === 0 ||
                            ( action === 'transfer' && !targetPaddock )
                        }
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {action === 'remove' ? 'Çıkarılıyor...' : 'Taşınıyor...'}
                            </span>
                        ) : (
                            action === 'remove'
                                ? `${selectedAnimals.length} Hayvanı Padoktan Çıkar`
                                : `${selectedAnimals.length} Hayvanı Taşı`
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ManagePaddockAnimalsModal;