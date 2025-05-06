import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PagePermission from './auth/PagePermission';

/**
 * u00d6zel sayfalara eriu015fim iu00e7in kimlik dou011frulama ve izin kontrolu00fc yapan bileu015fen
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.element - Korunan iu00e7erik
 * @param {string} [props.permissionCode] - Gerekli izin kodu (isteu011fe bau011flu0131)
 * @param {Object} props.rest - Diu011fer prop'lar
 */
function PrivateRoute({ element: Element, permissionCode, ...rest }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading-container">Yu00fckleniyor...</div>;
    }

    // Kullanu0131cu0131 oturum au00e7mamu0131u015fsa giriu015f sayfasu0131na yu00f6nlendir
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    // u0130zin kodu belirtilmiu015fse, izin kontrolu00fc yap
    if (permissionCode) {
        return (
            <PagePermission permissionCode={permissionCode}>
                {Element}
            </PagePermission>
        );
    }

    // Sadece kimlik dou011frulamasu0131 gerektiren sayfalar iu00e7in
    return Element;
}

export default PrivateRoute;
