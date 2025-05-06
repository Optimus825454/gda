import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Header from '../Header';
import { useAuth } from '../../contexts/AuthContext';

const MainLayout = () => {
    const { user } = useAuth();

    if ( !user ) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar kaldırıldı */}

            <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                <Header /> {/* Sidebar prop'ları kaldırıldı */}

                <main className="flex-grow p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-9xl">
                        <Outlet />
                    </div>
                </main>

                {/* Temaya uygun şık footer */}
                <footer className="bg-card text-foreground text-center p-4 border-t border-border">
                    <p className="text-sm">&copy; {new Date().getFullYear()} GDA FlowSystems | By ErkanERDEM</p>
                </footer>
            </div>
        </div>
    );
};

export default MainLayout;