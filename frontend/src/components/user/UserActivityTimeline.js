import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '../../supabaseClient';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaSignInAlt,
    FaSignOutAlt,
    FaDownload,
    FaUpload
} from 'react-icons/fa';

const actionIcons = {
    CREATE: <FaPlus className="w-4 h-4" />,
    UPDATE: <FaEdit className="w-4 h-4" />,
    DELETE: <FaTrash className="w-4 h-4" />,
    LOGIN: <FaSignInAlt className="w-4 h-4" />,
    LOGOUT: <FaSignOutAlt className="w-4 h-4" />,
    EXPORT: <FaDownload className="w-4 h-4" />,
    IMPORT: <FaUpload className="w-4 h-4" />
};

const actionColors = {
    CREATE: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    LOGIN: 'bg-purple-100 text-purple-800',
    LOGOUT: 'bg-gray-100 text-gray-800',
    EXPORT: 'bg-yellow-100 text-yellow-800',
    IMPORT: 'bg-indigo-100 text-indigo-800'
};

const actionLabels = {
    CREATE: 'Oluşturma',
    UPDATE: 'Güncelleme',
    DELETE: 'Silme',
    LOGIN: 'Giriş',
    LOGOUT: 'Çıkış',
    EXPORT: 'Dışa Aktarma',
    IMPORT: 'İçe Aktarma'
};

const entityLabels = {
    USER: 'Kullanıcı',
    ANIMAL: 'Hayvan',
    TEST: 'Test',
    SALE: 'Satış',
    HEALTH_RECORD: 'Sağlık Kaydı',
    SETTING: 'Ayar'
};

export default function UserActivityTimeline( { userId } ) {
    const [logs, setLogs] = useState( [] );
    const [loading, setLoading] = useState( true );
    const [error, setError] = useState( null );

    useEffect( () => {
        fetchUserLogs();
    }, [userId] );

    const fetchUserLogs = async () => {
        try {
            setLoading( true );
            const { data, error } = await supabase
                .from( 'audit_logs' )
                .select( '*' )
                .eq( 'user_id', userId )
                .order( 'created_at', { ascending: false } )
                .limit( 50 );

            if ( error ) throw error;
            setLogs( data );
        } catch ( err ) {
            console.error( 'Kullanıcı logları alınırken hata:', err );
            setError( err.message );
        } finally {
            setLoading( false );
        }
    };

    if ( loading ) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if ( error ) {
        return (
            <div className="text-red-600 p-4 rounded-md bg-red-50">
                Loglar yüklenirken bir hata oluştu: {error}
            </div>
        );
    }

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {logs.map( ( log, idx ) => (
                    <li key={log.id}>
                        <div className="relative pb-8">
                            {idx !== logs.length - 1 && (
                                <span
                                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                    aria-hidden="true"
                                />
                            )}
                            <div className="relative flex space-x-3">
                                <div className={`relative px-1`}>
                                    <div className={`
                                        h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white
                                        ${actionColors[log.action] || 'bg-gray-100 text-gray-800'}
                                    `}>
                                        {actionIcons[log.action]}
                                    </div>
                                </div>
                                <div className="flex min-w-0 flex-1 justify-between space-x-4">
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium text-gray-900">
                                                {actionLabels[log.action] || log.action}
                                            </span>
                                            {' - '}
                                            <span className="font-medium">
                                                {entityLabels[log.entity] || log.entity}
                                            </span>
                                            {log.details && (
                                                <span className="ml-2 text-gray-500">
                                                    {JSON.stringify( log.details )}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                        <time dateTime={log.created_at}>
                                            {format( new Date( log.created_at ), 'dd MMM yyyy HH:mm', { locale: tr } )}
                                        </time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ) )}
            </ul>
        </div>
    );
}