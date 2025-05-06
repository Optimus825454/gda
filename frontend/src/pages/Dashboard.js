import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useDashboard } from '../contexts/DashboardContext';
import { useAuth } from '../contexts/AuthContext';
import { 
    Activity, 
    AlertTriangle,
    User2,
    User,
    Leaf,
    CalendarClock,
    Heart,
    DollarSign,
    Scissors,
    TruckIcon,
    Clock,
    Check,
    Tag,
    BarChart3
} from 'lucide-react';

function Dashboard() {
    const { dashboardData, activities, loading, error } = useDashboard();
    const { user } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-red-500">
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-center">Veri yüklenirken bir hata oluştu.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Sistem Durumu</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Hayvan İstatistikleri - Toplam ve Cinsiyet */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Activity className="w-6 h-6 mr-2" />
                            Hayvan Durumu
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span>Toplam Hayvan:</span>
                                <span className="font-bold">{dashboardData?.animals?.toplam || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Erkek:</span>
                                <div className="flex items-center">
                                    <User2 className="w-4 h-4 mr-1" />
                                    <span className="font-bold">{dashboardData?.animals?.erkek || 0}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Dişi:</span>
                                <div className="flex items-center">
                                    <User className="w-4 h-4 mr-1" />
                                    <span className="font-bold">{dashboardData?.animals?.disi || 0}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* İnek ve Düve İstatistikleri */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Leaf className="w-6 h-6 mr-2" />
                            İnek ve Düve
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span>İnek:</span>
                                <span className="font-bold">{dashboardData?.animals?.inek || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Düve:</span>
                                <span className="font-bold">{dashboardData?.animals?.duve || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Buzağı:</span>
                                <span className="font-bold">{dashboardData?.animals?.buzagi || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Gebelik İstatistikleri */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <CalendarClock className="w-6 h-6 mr-2" />
                            Gebelik Durumu
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span>Toplam Gebe:</span>
                                <span className="font-bold">{dashboardData?.animals?.toplam_gebe || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Gebe İnek:</span>
                                <span className="font-bold">{dashboardData?.animals?.gebeInek || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Gebe Düve:</span>
                                <span className="font-bold">{dashboardData?.animals?.gebeDuve || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Satış İstatistikleri */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <DollarSign className="w-6 h-6 mr-2" />
                            Satış Durumu
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span>Satılan Toplam:</span>
                                <span className="font-bold">{dashboardData?.animals?.satilan || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Kesim Satışı:</span>
                                <div className="flex items-center">
                                    <Scissors className="w-4 h-4 mr-1 text-red-500" />
                                    <span className="font-bold">{dashboardData?.animals?.kesilenHayvan || 0}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Damızlık Satışı:</span>
                                <span className="font-bold">{dashboardData?.animals?.damizlikSatilan || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* İkinci Satır - Ek İstatistikler */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* Amaç Durumu */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Tag className="w-6 h-6 mr-2" />
                            Amaç Durumu
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span>Kesime Ayrılan:</span>
                                <div className="flex items-center">
                                    <Scissors className="w-4 h-4 mr-1 text-red-500" />
                                    <span className="font-bold">{dashboardData?.animals?.kesimeAyrilan || 0}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Damızlığa Ayrılan:</span>
                                <div className="flex items-center">
                                    <Heart className="w-4 h-4 mr-1 text-pink-500" />
                                    <span className="font-bold">{dashboardData?.animals?.damizlikAyrilan || 0}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sevk Durumu */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <TruckIcon className="w-6 h-6 mr-2" />
                            Sevk Durumu
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span>Sevk Bekleyen:</span>
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1 text-yellow-500" />
                                    <span className="font-bold">{dashboardData?.animals?.sevkBekleyen || 0}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Sevk Edilen:</span>
                                <div className="flex items-center">
                                    <Check className="w-4 h-4 mr-1 text-green-500" />
                                    <span className="font-bold">{dashboardData?.animals?.sevkEdilen || 0}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Satış Aşaması */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <BarChart3 className="w-6 h-6 mr-2" />
                            Satış Süreci
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span>Satış Bekleyen:</span>
                                <span className="font-bold">{dashboardData?.animals?.satisBekleyen || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Satışa Hazır:</span>
                                <span className="font-bold">{dashboardData?.animals?.satisHazir || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Satılıyor:</span>
                                <span className="font-bold">{dashboardData?.animals?.satiliyor || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Son Aktiviteler */}
            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Son Aktiviteler</h2>
                <div className="space-y-4">
                    {activities?.length > 0 ? (
                        activities.map((activity, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg shadow">
                                <div className="flex items-center">
                                    <Activity className="w-5 h-5 mr-2" />
                                    <span>{activity.description}</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {new Date(activity.created_at).toLocaleString('tr-TR')}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-4 rounded-lg shadow text-center text-gray-500">
                            Henüz aktivite kaydı bulunmuyor.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;