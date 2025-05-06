import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ui/theme-provider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AnimalProvider } from './contexts/AnimalContext';
import { SaleProvider } from './contexts/SaleContext';
import { TestProvider } from './contexts/TestContext';
import { HealthProvider } from './contexts/HealthContext';
import { SettingProvider } from './contexts/SettingContext';
import { RoleProvider } from './contexts/RoleContext'; // RoleProvider eklendi
import { UserProvider } from './contexts/UserContext'; // UserProvider eklendi
import { DashboardProvider } from './contexts/DashboardContext';
import UserManagement from './pages/user/UserManagement';

// Yerleşim Bileşeni
import MainLayout from './components/layouts/MainLayout';

// Sayfa Bileşenleri
import Dashboard from './pages/Dashboard';
import AnimalList from './pages/animal/AnimalList';
import AnimalDetail from './pages/animal/AnimalDetail';
import AnimalForm from './pages/animal/AnimalForm';
import AnimalGroups from './pages/animal/AnimalGroups'; // AnimalGroups bileşeni import edildi
import TestList from './pages/test/TestList';
import BulkTestEntry from './pages/test/BulkTestEntry';
import SaleList from './pages/sale/SaleList';
import SaleForm from './pages/sale/SaleForm';
import SaleReports from './pages/sale/SaleReports';
import HealthList from './pages/health/HealthList';
import HealthDetail from './pages/health/HealthDetail';
import HealthForm from './pages/health/HealthForm';
import ShelterManagement from './pages/shelter/ShelterManagement'; // ShelterManagement import edildi
import SettingsPage from './pages/Settings'; // SettingsPage import edildi (dosya adı Settings.js ama export default SettingsPage)
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';

// Rapor Sayfaları Importları
import ReportsPage from './pages/reports/ReportsPage';
import PregnantCowsList from './pages/reports/PregnantCowsList';
import PregnantHeifersList from './pages/reports/PregnantHeifersList';
import DryCowsList from './pages/reports/DryCowsList';
import MaleCalvesList from './pages/reports/MaleCalvesList';
import TestedAnimalsList from './pages/reports/TestedAnimalsList';
import UntestedAnimalsList from './pages/reports/UntestedAnimalsList';
import SoldAnimalsList from './pages/reports/SoldAnimalsList';
import SlaughteredAnimalsList from './pages/reports/SlaughteredAnimalsList';
import SlaughterReferralList from './pages/reports/SlaughterReferralList';
import BreedingStockList from './pages/reports/BreedingStockList';
import AllCowsList from './pages/reports/AllCowsList';
import BulkImport from './pages/animal/BulkImport'; // Yeni eklenen

// Toastify CSS
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

function AppContent() {
    const { user, loading } = useAuth();

    // Yükleniyor durumunu göster
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Giriş Sayfası - Her zaman erişilebilir */}
            <Route path="/login" element={<Login />} />

            {/* MainLayout içinde render edilecek korumalı rotalar */}
            {/* Kullanıcı varsa MainLayout'u ve içindeki rotaları render et */}
            {user ? (
                <Route path="/" element={<MainLayout />}>
                    {/* Ana Sayfa (Dashboard) */}
                    <Route index element={<PrivateRoute element={<Dashboard />} />} />
                    <Route path="dashboard" element={<PrivateRoute element={<Dashboard />} />} />

                    {/* Profil Sayfası */}
                    <Route path="profile" element={<PrivateRoute element={<Profile />} />} />

                    {/* Hayvan Yönetimi */}
                    <Route path="animals" element={<PrivateRoute element={<AnimalList />} />} />
                    <Route path="animals/groups" element={<PrivateRoute element={<AnimalGroups />} />} />
                    <Route path="animals/new" element={<PrivateRoute element={<AnimalForm />} />} />
                    <Route path="animals/import" element={<PrivateRoute element={<BulkImport />} />} />
                    <Route path="animals/:id" element={<PrivateRoute element={<AnimalDetail />} />} />
                    <Route path="animals/:id/edit" element={<PrivateRoute element={<AnimalForm />} />} />

                    {/* Barınak ve Padok Yönetimi */}
                    <Route path="shelter" element={<PrivateRoute element={<ShelterManagement />} />} />

                    {/* Test Yönetimi */}
                    <Route path="tests" element={<PrivateRoute element={<TestList />} />} />
                    <Route path="tests/bulk" element={<PrivateRoute element={<BulkTestEntry />} />} />

                    {/* Satış Yönetimi */}
                    <Route path="sales" element={<PrivateRoute element={<SaleList />} />} />
                    <Route path="sales/new" element={<PrivateRoute element={<SaleForm />} />} />
                    <Route path="sales/reports" element={<PrivateRoute element={<SaleReports />} />} />
                    <Route path="sales/:id/edit" element={<PrivateRoute element={<SaleForm />} />} />

                    {/* Sağlık Kayıtları */}
                    <Route path="health" element={<PrivateRoute element={<HealthList />} />} />
                    <Route path="health/new" element={<PrivateRoute element={<HealthForm />} />} /> {/* Yeni kayıt rotası */}
                    <Route path="health/:recordId" element={<PrivateRoute element={<HealthDetail />} />} /> {/* Detay rotası */}
                    <Route path="health/:recordId/edit" element={<PrivateRoute element={<HealthForm />} />} /> {/* Düzenleme rotası */}

                    {/* Kullanıcı Yönetimi Rotası */}
                    <Route
                        path="users"
                        element={<PrivateRoute element={<UserManagement />} requiredPermission="MANAGE_USERS" />}
                    />

                    {/* Raporlar (İç İçe Rotalar) */}
                    <Route path="reports">
                        {/* Ana Raporlar Sayfası */}
                        <Route index element={<PrivateRoute element={<ReportsPage />} />} />
                        {/* Alt Rapor Sayfaları */}
                        <Route path="pregnant-cows" element={<PrivateRoute element={<PregnantCowsList />} />} />
                        <Route path="pregnant-heifers" element={<PrivateRoute element={<PregnantHeifersList />} />} />
                        <Route path="dry-cows" element={<PrivateRoute element={<DryCowsList />} />} />
                        <Route path="male-calves" element={<PrivateRoute element={<MaleCalvesList />} />} />
                        <Route path="tested-animals" element={<PrivateRoute element={<TestedAnimalsList />} />} />
                        <Route path="untested-animals" element={<PrivateRoute element={<UntestedAnimalsList />} />} />
                        <Route path="sold-animals" element={<PrivateRoute element={<SoldAnimalsList />} />} />
                        <Route path="slaughtered-animals" element={<PrivateRoute element={<SlaughteredAnimalsList />} />} />
                        <Route path="slaughter-referral" element={<PrivateRoute element={<SlaughterReferralList />} />} />
                        <Route path="breeding-stock" element={<PrivateRoute element={<BreedingStockList />} />} />
                        <Route path="all-cows" element={<PrivateRoute element={<AllCowsList />} />} />
                    </Route>

                    {/* Ayarlar */}
                    <Route path="settings" element={<PrivateRoute element={<SettingsPage />} />} /> {/* Ayarlar rotası eklendi/güncellendi */}

                    {/* MainLayout içindeki eşleşmeyen rotalar */}
                    <Route path="*" element={<NotFound />} />
                </Route>
            ) : (
                // Kullanıcı yoksa, /login dışındaki tüm yolları Login sayfasına yönlendir
                <Route path="*" element={<Login />} />
            )}
        </Routes>
    );
}

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="hayvancılık-yönetim-tema">
            <AuthProvider>
                <DashboardProvider>
                    <AnimalProvider>
                        <TestProvider>
                            <SaleProvider>
                                <HealthProvider>
                                    <SettingProvider>
                                        <RoleProvider> {/* RoleProvider ile sarmalandı */}
                                            <UserProvider> {/* UserProvider ile sarmalandı */}
                                                <div className="min-h-screen bg-background font-sans antialiased">
                                                    <AppContent />
                                                    <ToastContainer
                                                        position="bottom-right"
                                                        autoClose={5000}
                                                        hideProgressBar={false}
                                                        newestOnTop={false}
                                                        closeOnClick
                                                        rtl={false}
                                                        pauseOnFocusLoss
                                                        draggable
                                                        pauseOnHover
                                                        theme="colored"
                                                    />
                                                </div>
                                            </UserProvider>
                                        </RoleProvider>
                                    </SettingProvider>
                                </HealthProvider>
                            </SaleProvider>
                        </TestProvider>
                    </AnimalProvider>
                </DashboardProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;