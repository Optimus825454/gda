import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Header from '../Header';
import { useAuth } from '../../contexts/AuthContext';
import Footer from './Footer';

const MainLayout = () => {
    const { user } = useAuth();

    if ( !user ) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0B1437] via-[#1B254B] to-[#111C44]">
            <main className="flex-grow">
                <div className="flex h-screen bg-background text-foreground overflow-hidden">
                    {/* Sidebar kaldırıldı */}

                    <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                        <Header /> {/* Sidebar prop'ları kaldırıldı */}

                        <main className="flex-grow p-4 sm:p-6 lg:p-8">
                            <div className="mx-auto max-w-9xl">
                                <Outlet />
                            </div>
                        </main>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;