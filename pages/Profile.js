import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import UserActivityTimeline from '../components/user/UserActivityTimeline';

export default function Profile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState( false );
    const [error, setError] = useState( null );
    const [success, setSuccess] = useState( null );
    const [formData, setFormData] = useState( {
        username: user?.username || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || ''
    } );

    const handleChange = ( e ) => {
        setFormData( {
            ...formData,
            [e.target.name]: e.target.value
        } );
    };

    const handleSubmit = async ( e ) => {
        e.preventDefault();
        setLoading( true );
        setError( null );
        setSuccess( null );

        try {
            const { error } = await supabase
                .from( 'user_profiles' )
                .update( {
                    username: formData.username,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    updated_at: new Date()
                } )
                .eq( 'user_id', user.id );

            if ( error ) throw error;

            setSuccess( 'Profil bilgileriniz başarıyla güncellendi.' );
        } catch ( err ) {
            setError( err.message );
        } finally {
            setLoading( false );
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profil Bilgileri Formu */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-bold mb-6">Profil Bilgilerim</h2>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kullanıcı Adı
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ad
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Soyad
                            </label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                E-posta
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                E-posta adresi değiştirilemez.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {loading ? 'Güncelleniyor...' : 'Bilgileri Güncelle'}
                        </button>
                    </form>
                </div>

                {/* Kullanıcı Aktivite Timeline'ı */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-bold mb-6">İşlem Geçmişi</h2>
                    <UserActivityTimeline userId={user.id} />
                </div>
            </div>
        </div>
    );
}
