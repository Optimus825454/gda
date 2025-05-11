import React, { useState, useMemo } from 'react';
import { useFinance } from '../../hooks/useFinance';

const ReportTypes = {
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    YEARLY: 'yearly'
};

const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export const FinancialReport = () => {
    const { transactions, loading } = useFinance();
    const [reportType, setReportType] = useState( ReportTypes.MONTHLY );
    const [selectedYear, setSelectedYear] = useState( new Date().getFullYear() );
    const [selectedPeriod, setSelectedPeriod] = useState( new Date().getMonth() );

    const reportData = useMemo( () => {
        const data = {
            totalIncome: 0,
            totalExpense: 0,
            netIncome: 0,
            categories: {},
            periodicalData: []
        };

        if ( !transactions.length ) return data;

        const filteredTransactions = transactions.filter( t => {
            const date = new Date( t.created_at );
            const year = date.getFullYear();
            const month = date.getMonth();
            const quarter = Math.floor( month / 3 );

            if ( year !== selectedYear ) return false;

            switch ( reportType ) {
                case ReportTypes.MONTHLY:
                    return month === selectedPeriod;
                case ReportTypes.QUARTERLY:
                    return quarter === selectedPeriod;
                case ReportTypes.YEARLY:
                    return true;
                default:
                    return false;
            }
        } );

        // Toplam hesaplamalar
        filteredTransactions.forEach( t => {
            if ( t.type === 'income' ) {
                data.totalIncome += t.amount;
            } else {
                data.totalExpense += t.amount;
            }

            // Kategori bazlı gruplandırma
            if ( !data.categories[t.category] ) {
                data.categories[t.category] = {
                    income: 0,
                    expense: 0
                };
            }
            data.categories[t.category][t.type] += t.amount;
        } );

        data.netIncome = data.totalIncome - data.totalExpense;

        // Dönemsel veri hazırlama
        if ( reportType === ReportTypes.MONTHLY ) {
            // Günlük veri
            const daysInMonth = new Date( selectedYear, selectedPeriod + 1, 0 ).getDate();
            data.periodicalData = Array( daysInMonth ).fill( 0 ).map( ( _, day ) => ( {
                label: `${day + 1}`,
                income: 0,
                expense: 0
            } ) );

            filteredTransactions.forEach( t => {
                const day = new Date( t.created_at ).getDate() - 1;
                data.periodicalData[day][t.type] += t.amount;
            } );
        } else if ( reportType === ReportTypes.QUARTERLY ) {
            // Aylık veri (çeyrek içindeki)
            const startMonth = selectedPeriod * 3;
            data.periodicalData = Array( 3 ).fill( 0 ).map( ( _, idx ) => ( {
                label: months[startMonth + idx],
                income: 0,
                expense: 0
            } ) );

            filteredTransactions.forEach( t => {
                const month = new Date( t.created_at ).getMonth() - startMonth;
                data.periodicalData[month][t.type] += t.amount;
            } );
        } else {
            // Aylık veri (yıl içindeki)
            data.periodicalData = months.map( month => ( {
                label: month,
                income: 0,
                expense: 0
            } ) );

            filteredTransactions.forEach( t => {
                const month = new Date( t.created_at ).getMonth();
                data.periodicalData[month][t.type] += t.amount;
            } );
        }

        return data;
    }, [transactions, reportType, selectedYear, selectedPeriod] );

    const renderPeriodSelector = () => {
        switch ( reportType ) {
            case ReportTypes.MONTHLY:
                return (
                    <select
                        value={selectedPeriod}
                        onChange={( e ) => setSelectedPeriod( Number( e.target.value ) )}
                        className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        {months.map( ( month, idx ) => (
                            <option key={month} value={idx}>{month}</option>
                        ) )}
                    </select>
                );
            case ReportTypes.QUARTERLY:
                return (
                    <select
                        value={selectedPeriod}
                        onChange={( e ) => setSelectedPeriod( Number( e.target.value ) )}
                        className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value={0}>1. Çeyrek</option>
                        <option value={1}>2. Çeyrek</option>
                        <option value={2}>3. Çeyrek</option>
                        <option value={3}>4. Çeyrek</option>
                    </select>
                );
            default:
                return null;
        }
    };

    if ( loading ) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Kontroller */}
            <div className="flex flex-wrap gap-4">
                <select
                    value={reportType}
                    onChange={( e ) => setReportType( e.target.value )}
                    className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value={ReportTypes.MONTHLY}>Aylık Rapor</option>
                    <option value={ReportTypes.QUARTERLY}>Çeyreklik Rapor</option>
                    <option value={ReportTypes.YEARLY}>Yıllık Rapor</option>
                </select>

                <select
                    value={selectedYear}
                    onChange={( e ) => setSelectedYear( Number( e.target.value ) )}
                    className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    {Array.from( { length: 5 }, ( _, i ) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                            <option key={year} value={year}>{year}</option>
                        );
                    } )}
                </select>

                {renderPeriodSelector()}
            </div>

            {/* Özet Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-gray-500 text-sm font-medium">Toplam Gelir</h3>
                    <p className="text-2xl font-bold text-green-600">
                        {new Intl.NumberFormat( 'tr-TR', {
                            style: 'currency',
                            currency: 'TRY'
                        } ).format( reportData.totalIncome )}
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-gray-500 text-sm font-medium">Toplam Gider</h3>
                    <p className="text-2xl font-bold text-red-600">
                        {new Intl.NumberFormat( 'tr-TR', {
                            style: 'currency',
                            currency: 'TRY'
                        } ).format( reportData.totalExpense )}
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-gray-500 text-sm font-medium">Net Gelir</h3>
                    <p className={`text-2xl font-bold ${reportData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {new Intl.NumberFormat( 'tr-TR', {
                            style: 'currency',
                            currency: 'TRY'
                        } ).format( reportData.netIncome )}
                    </p>
                </div>
            </div>

            {/* Kategoriler */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium mb-4">Kategori Analizi</h3>
                <div className="space-y-4">
                    {Object.entries( reportData.categories ).map( ( [category, data] ) => (
                        <div key={category} className="flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium capitalize">{category}</span>
                                <span className={data.income > data.expense ? 'text-green-600' : 'text-red-600'}>
                                    {new Intl.NumberFormat( 'tr-TR', {
                                        style: 'currency',
                                        currency: 'TRY'
                                    } ).format( data.income - data.expense )}
                                </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary"
                                    style={{ width: `${( data.income / ( data.income + data.expense ) ) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ) )}
                </div>
            </div>

            {/* Dönemsel Veriler */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium mb-4">Dönemsel Analiz</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="py-2 text-left">{reportType === ReportTypes.MONTHLY ? 'Gün' : 'Dönem'}</th>
                                <th className="py-2 text-right">Gelir</th>
                                <th className="py-2 text-right">Gider</th>
                                <th className="py-2 text-right">Net</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.periodicalData.map( ( period ) => (
                                <tr key={period.label} className="border-t">
                                    <td className="py-2">{period.label}</td>
                                    <td className="py-2 text-right text-green-600">
                                        {new Intl.NumberFormat( 'tr-TR', {
                                            style: 'currency',
                                            currency: 'TRY'
                                        } ).format( period.income )}
                                    </td>
                                    <td className="py-2 text-right text-red-600">
                                        {new Intl.NumberFormat( 'tr-TR', {
                                            style: 'currency',
                                            currency: 'TRY'
                                        } ).format( period.expense )}
                                    </td>
                                    <td className={`py-2 text-right ${period.income - period.expense >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {new Intl.NumberFormat( 'tr-TR', {
                                            style: 'currency',
                                            currency: 'TRY'
                                        } ).format( period.income - period.expense )}
                                    </td>
                                </tr>
                            ) )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};