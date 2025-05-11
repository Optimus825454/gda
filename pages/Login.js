import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaHorse, FaLock, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';
import { IoMdWarning } from 'react-icons/io';

export default function Login() {
    const [identifier, setIdentifier] = useState( '' );
    const [password, setPassword] = useState( '' );
    const [showPassword, setShowPassword] = useState( false );
    const { login, loading, error, dbStatus } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showDbError, setShowDbError] = useState( false );
    const [sessionExpired, setSessionExpired] = useState( false );    // Veritabanı durum değişikliğini izle
    useEffect( () => {
        if ( dbStatus && !dbStatus.isOnline ) {
            setShowDbError( true );
        } else {
            setShowDbError( false );
        }
    }, [dbStatus] );

    // URL parametrelerini kontrol et
    useEffect( () => {
        // Oturum süresinin dolup dolmadığını kontrol et
        const sessionExpiredParam = searchParams.get( 'session_expired' );
        if ( sessionExpiredParam === 'true' ) {
            setSessionExpired( true );
        }
    }, [searchParams] );

    const handleSubmit = async ( e ) => {
        e.preventDefault();
        const success = await login( identifier, password );
        if ( success ) {
            navigate( '/' );
        }
    };

    // Hata mesajını güzelleştir
    const getErrorMessage = () => {
        if ( error && error.includes( 'Database error querying schema' ) ) {
            return 'Veritabanı şema hatası. Sistem yöneticisiyle iletişime geçin.';
        } else if ( error && error.includes( 'Invalid login credentials' ) ) {
            return 'Geçersiz kullanıcı adı veya şifre.';
        }
        return error;
    };

    // Şifre görünürlüğünü değiştir
    const togglePasswordVisibility = () => {
        setShowPassword( !showPassword );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/10 to-background p-4">
            <div className="w-full max-w-md">
                {/* Logo ve İsim */}
                <div className="text-center mb-8">
                    {/* Mevcut logo kaldırıldı, yerine logo_dark.png eklendi */}
                    <img src="/images/logo_dark.png" alt="GDA FlowSystems Logo" className="h-20 w-auto mx-auto mb-4" />

                </div>

                {/* Kart */}
                <div className="bg-card shadow-lg rounded-xl border border-border overflow-hidden">
                    {/* Kart Başlık */}
                    <div className="p-6 border-b border-border">
                        <h2 className="text-xl font-semibold">Giriş Yap</h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            Hesabınıza erişmek için giriş bilgilerinizi giriniz
                        </p>
                    </div>                    {/* Oturum Süresi Doldu Uyarısı */}
                    {sessionExpired && (
                        <div className="mx-6 mt-6 bg-amber-600/10 border-l-4 border-amber-600 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <IoMdWarning className="h-5 w-5 text-amber-600" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-amber-600">Oturum Süresi Doldu</h3>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Güvenliğiniz için oturum süreniz doldu. Lütfen tekrar giriş yapın.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Veritabanı Hatası */}
                    {showDbError && (
                        <div className="mx-6 mt-6 bg-destructive/10 border-l-4 border-destructive rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <IoMdWarning className="h-5 w-5 text-destructive" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-destructive">Veritabanı Hatası</h3>
                                    <p className="text-sm text-destructive-foreground mt-1">
                                        Veritabanı bağlantısı sırasında bir sorun oluştu. Bu sorun, veritabanı tablolarının
                                        eksik olmasından kaynaklanabilir.
                                    </p>
                                    {dbStatus && dbStatus.error && (
                                        <p className="text-xs mt-1 text-destructive-foreground/80">
                                            Hata: {dbStatus.error}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Giriş Formu */}
                    <form onSubmit={handleSubmit} className="p-6 pt-4">
                        {/* Kullanıcı adı alanı */}
                        <div className="mb-4">
                            <label htmlFor="identifier" className="block text-sm font-medium text-foreground mb-1.5">
                                Kullanıcı Adı
                            </label>
                            <div className={`relative rounded-md shadow-sm ${error ? 'ring-1 ring-destructive' : ''}`}>
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaUser className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <input
                                    type="text"
                                    id="identifier"
                                    name="identifier"
                                    value={identifier}
                                    onChange={( e ) => setIdentifier( e.target.value )}
                                    disabled={loading}
                                    autoComplete="username"
                                    required
                                    className={`block w-full pl-10 py-3 text-foreground bg-background border ${error ? 'border-destructive focus:ring-destructive' : 'border-input'
                                        } focus:ring-2 focus:ring-primary focus:border-primary rounded-md`}
                                    placeholder="Kullanıcı adınızı girin"
                                />
                            </div>
                        </div>

                        {/* Şifre alanı */}
                        <div className="mb-6">
                            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                                Şifre
                            </label>
                            <div className={`relative rounded-md shadow-sm ${error ? 'ring-1 ring-destructive' : ''}`}>
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLock className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={( e ) => setPassword( e.target.value )}
                                    disabled={loading}
                                    autoComplete="current-password"
                                    required
                                    className={`block w-full pl-10 pr-10 py-3 text-foreground bg-background border ${error ? 'border-destructive focus:ring-destructive' : 'border-input'
                                        } focus:ring-2 focus:ring-primary focus:border-primary rounded-md`}
                                    placeholder="••••••••"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="text-muted-foreground hover:text-foreground focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <FaEyeSlash className="h-4 w-4" />
                                        ) : (
                                            <FaEye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Hata mesajı */}
                        {error && (
                            <div className="mb-6 p-3 bg-destructive/10 border-l-4 border-destructive rounded-md">
                                <p className="text-sm text-destructive">
                                    {getErrorMessage()}
                                </p>
                            </div>
                        )}

                        {/* Giriş Butonu */}
                        <button
                            type="submit"
                            disabled={loading || ( showDbError && dbStatus?.error?.includes( 'schema' ) )}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-md font-medium flex items-center justify-center transition-colors disabled:opacity-70"
                        >
                            {loading ? (
                                <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-primary-foreground animate-spin"></div>
                            ) : (
                                "GİRİŞ YAP"
                            )}
                        </button>

                        {showDbError && dbStatus?.error?.includes( 'schema' ) && (
                            <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-700">Sistem Kurulum Hatası</h3>
                                        <p className="text-sm text-blue-600 mt-2">
                                            Sistem kurulumu tamamlanmamış görünüyor. Veritabanı tabloları oluşturulmamış olabilir.
                                        </p>
                                        <p className="text-sm mt-2">
                                            Çözüm için sistem yöneticinize şu mesajı iletin:
                                            <code className="block mt-1 bg-blue-100 px-2 py-1 rounded text-blue-800 font-mono text-xs">
                                                Veritabanı şema kurulumu yapılmalı.
                                            </code>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} - GDA FlowSystems | By ErkanERDEM
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground/70">
                        v1.0.0 - Tüm Hakları Saklıdır
                    </p>
                </div>
            </div>
        </div>
    );
}
