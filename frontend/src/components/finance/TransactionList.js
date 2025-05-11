import React, { useState, useMemo } from 'react';
import { useFinance } from '../../hooks/useFinance';

const TransactionTypes = {
    ALL: 'all',
    INCOME: 'income',
    EXPENSE: 'expense'
};

export const TransactionList = () => {
    const { transactions, loading } = useFinance();
    const [filterType, setFilterType] = useState( TransactionTypes.ALL );
    const [sortBy, setSortBy] = useState( 'date' );
    const [searchTerm, setSearchTerm] = useState( '' );

    const filteredTransactions = useMemo( () => {
        let filtered = [...transactions];

        // Tür filtresi
        if ( filterType !== TransactionTypes.ALL ) {
            filtered = filtered.filter( t => t.type === filterType );
        }

        // Arama filtresi
        if ( searchTerm ) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter( t =>
                t.description?.toLowerCase().includes( searchLower ) ||
                t.reference_number?.toLowerCase().includes( searchLower )
            );
        }

        // Sıralama
        return filtered.sort( ( a, b ) => {
            if ( sortBy === 'date' ) {
                return new Date( b.created_at ) - new Date( a.created_at );
            }
            if ( sortBy === 'amount' ) {
                return b.amount - a.amount;
            }
            return 0;
        } );
    }, [transactions, filterType, sortBy, searchTerm] );

    const totalAmount = useMemo( () => {
        return filteredTransactions.reduce( ( sum, t ) => {
            if ( t.type === TransactionTypes.INCOME ) {
                return sum + t.amount;
            }
            if ( t.type === TransactionTypes.EXPENSE ) {
                return sum - t.amount;
            }
            return sum;
        }, 0 );
    }, [filteredTransactions] );

    if ( loading ) return (
        <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Filtreler */}
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <div className="flex flex-wrap gap-4">
                    <select
                        value={filterType}
                        onChange={( e ) => setFilterType( e.target.value )}
                        className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value={TransactionTypes.ALL}>Tüm İşlemler</option>
                        <option value={TransactionTypes.INCOME}>Gelirler</option>
                        <option value={TransactionTypes.EXPENSE}>Giderler</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={( e ) => setSortBy( e.target.value )}
                        className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="date">Tarihe Göre</option>
                        <option value="amount">Tutara Göre</option>
                    </select>
                </div>

                <input
                    type="text"
                    placeholder="İşlem ara..."
                    value={searchTerm}
                    onChange={( e ) => setSearchTerm( e.target.value )}
                    className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* İşlem Listesi */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tarih
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Referans No
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Açıklama
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tür
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tutar
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTransactions.map( ( transaction ) => (
                                <tr key={transaction.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date( transaction.created_at ).toLocaleDateString( 'tr-TR' )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {transaction.reference_number}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {transaction.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${transaction.type === TransactionTypes.INCOME
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {transaction.type === TransactionTypes.INCOME ? 'Gelir' : 'Gider'}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${transaction.type === TransactionTypes.INCOME
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                        }`}>
                                        {new Intl.NumberFormat( 'tr-TR', {
                                            style: 'currency',
                                            currency: 'TRY'
                                        } ).format( transaction.amount )}
                                    </td>
                                </tr>
                            ) )}
                        </tbody>
                        <tfoot className="bg-gray-50">
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-sm font-medium text-gray-900">
                                    Toplam
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {new Intl.NumberFormat( 'tr-TR', {
                                        style: 'currency',
                                        currency: 'TRY'
                                    } ).format( totalAmount )}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};