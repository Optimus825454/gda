import React from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import Card from '../components/ui/Card';
import { 
    Activity, 
    AlertTriangle,
    Leaf,
    CalendarClock,
    DollarSign,
    TruckIcon,
    Tag,
    BarChart3
} from 'lucide-react';

function Dashboard() {
    const { dashboardData, loading, error } = useDashboard();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-red-400">
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-center">Veri yüklenirken bir hata oluştu.</p>
                </div>
            </div>
        );
    }

    const renderStatItem = (label, value) => (
        <div className="flex justify-between items-center py-2">
            <span className="text-gray-400">{label}:</span>
            <span className="text-white font-medium">{value || 0}</span>
        </div>
    );

    const renderCardHeader = (title, Icon, colorClass) => (
        <div className="flex items-center gap-3 mb-4">
            <Icon className={`w-8 h-8 ${colorClass}`} />
            <h2 className={`text-xl font-bold ${colorClass}`}>{title}</h2>
        </div>
    );

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Ana İstatistikler Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Hayvan Durumu Kartı */}
                    <Card className="max-w-sm">
                        {renderCardHeader('Hayvan Durumu', Activity, 'text-blue-500')}
                        {renderStatItem('Toplam Hayvan', dashboardData?.animals?.toplam)}
                        {renderStatItem('Erkek', dashboardData?.animals?.erkek)}
                        {renderStatItem('Dişi', dashboardData?.animals?.disi)}
                    </Card>

                    {/* İnek ve Düve Kartı */}
                    <Card className="max-w-sm">
                        {renderCardHeader('İnek ve Düve', Leaf, 'text-green-500')}
                        {renderStatItem('İnek', dashboardData?.animals?.inek)}
                        {renderStatItem('Düve', dashboardData?.animals?.duve)}
                        {renderStatItem('Buzağı', dashboardData?.animals?.buzagi)}
                    </Card>

                    {/* Gebelik Durumu Kartı */}
                    <Card className="max-w-sm">
                        {renderCardHeader('Gebelik Durumu', CalendarClock, 'text-purple-500')}
                        {renderStatItem('Toplam Gebe', dashboardData?.animals?.toplam_gebe)}
                        {renderStatItem('Gebe İnek', dashboardData?.animals?.gebeInek)}
                        {renderStatItem('Gebe Düve', dashboardData?.animals?.gebeDuve)}
                    </Card>

                    {/* Satış Durumu Kartı */}
                    <Card className="max-w-sm">
                        {renderCardHeader('Satış Durumu', DollarSign, 'text-yellow-500')}
                        {renderStatItem('Satılan Toplam', dashboardData?.animals?.satilan)}
                        {renderStatItem('Kesim', dashboardData?.animals?.kesilenHayvan)}
                        {renderStatItem('Damızlık', dashboardData?.animals?.damizlikSatilan)}
                    </Card>
                </div>

                {/* Alt Bilgi Kartları */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Amaç Durumu Kartı */}
                    <Card className="max-w-sm">
                        {renderCardHeader('Amaç Durumu', Tag, 'text-orange-500')}
                        {renderStatItem('Kesime Ayrılan', dashboardData?.animals?.kesimeAyrilan)}
                        {renderStatItem('Damızlığa Ayrılan', dashboardData?.animals?.damizlikAyrilan)}
                    </Card>

                    {/* Sevk Durumu Kartı */}
                    <Card className="max-w-sm">
                        {renderCardHeader('Sevk Durumu', TruckIcon, 'text-blue-500')}
                        {renderStatItem('Sevk Bekleyen', dashboardData?.animals?.sevkBekleyen)}
                        {renderStatItem('Sevk Edilen', dashboardData?.animals?.sevkEdilen)}
                    </Card>

                    {/* Satış Süreci Kartı */}
                    <Card className="max-w-sm">
                        {renderCardHeader('Satış Süreci', BarChart3, 'text-purple-500')}
                        {renderStatItem('Satış Bekleyen', dashboardData?.animals?.satisBekleyen)}
                        {renderStatItem('Satışa Hazır', dashboardData?.animals?.satisHazir)}
                        {renderStatItem('Satılıyor', dashboardData?.animals?.satiliyor)}
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;