import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';

const AddUserModal = ( { isOpen, onClose, onUserAdded } ) => {
    const [formData, setFormData] = useState( {
        email: '',
        password: '',
        username: '',
        firstName: '',
        lastName: '',
        roleNames: [], // Rol isimleri dizisi
        position: ''
    } );
    const [availableRoles, setAvailableRoles] = useState( [] );
    const [loading, setLoading] = useState( false );
    const [error, setError] = useState( null );

    useEffect( () => {
        if ( isOpen ) {
            // Modal açıldığında mevcut rolleri çek
            const fetchRoles = async () => {
                try {
                    const res = await axiosInstance.get( '/roles' ); // Backend endpoint'i varsayımı
                    if ( res.data.success ) {
                        setAvailableRoles( res.data.data || [] );
                    } else {
                        setError( res.data.error || 'Roller alınırken bir hata oluştu.' );
                    }
                } catch ( err ) {
                    console.error( 'Roller alınırken hata:', err );
                    setError( 'Roller alınırken bir hata oluştu.' );
                }
            };
            fetchRoles();
        }
    }, [isOpen] ); // isOpen değiştiğinde çalış

    const handleChange = ( e ) => {
        const { name, value } = e.target;
        setFormData( prevState => ( {
            ...prevState,
            [name]: value
        } ) );
    };

    const handleRoleChange = ( e ) => {
        const { options } = e.target;
        const selectedRoles = [];
        for ( let i = 0; i < options.length; i++ ) {
            if ( options[i].selected ) {
                selectedRoles.push( options[i].value );
            }
        }
        setFormData( prevState => ( {
            ...prevState,
            roleNames: selectedRoles
        } ) );
    };

    const handleSubmit = async ( e ) => {
        e.preventDefault();
        setLoading( true );
        setError( null );

        try {
            const res = await axiosInstance.post( '/users', formData ); // Backend endpoint'i varsayımı
            if ( res.data.success ) {
                alert( 'Kullanıcı başarıyla eklendi!' );
                setFormData( { // Formu sıfırla
                    email: '',
                    password: '',
                    username: '',
                    firstName: '',
                    lastName: '',
                    roleNames: [],
                    position: ''
                } );
                onUserAdded(); // Kullanıcı listesini yenilemek için callback
                onClose(); // Modalı kapat
            } else {
                setError( res.data.error || 'Kullanıcı eklenirken bir hata oluştu.' );
            }
        } catch ( err ) {
            console.error( 'Kullanıcı eklenirken hata:', err );
            setError( 'Kullanıcı eklenirken bir hata oluştu.' );
        } finally {
            setLoading( false );
        }
    };

    if ( !isOpen ) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Yeni Kullanıcı Ekle</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700">E-posta</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                    </div>
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700">Şifre</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                    </div>
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700">Kullanıcı Adı</label>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                    </div>
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700">Ad</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                    </div>
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700">Soyad</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                    </div>
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700">Pozisyon</label>
                        <input type="text" name="position" value={formData.position} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                    </div>
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700">Roller</label>
                        <select multiple name="roleNames" value={formData.roleNames} onChange={handleRoleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-24">
                            {availableRoles.map( role => (
                                <option key={role.id} value={role.name}>{role.name}</option>
                            ) )}
                        </select>
                    </div>

                    {error && (
                        <div className="mt-4 text-sm text-red-600">{error}</div>
                    )}

                    <div className="items-center px-4 py-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            {loading ? 'Ekleniyor...' : 'Kullanıcı Ekle'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        >
                            İptal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;