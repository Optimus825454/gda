import React, { useState } from 'react';
import { useFinance } from '../../hooks/useFinance';

const defaultPayment = {
    payment_number: '',
    invoice_id: '',
    amount: '',
    payment_date: new Date().toISOString().split( 'T' )[0],
    payment_method: 'bank_transfer',
    status: 'pending',
    description: ''
};

const paymentMethods = [
    { id: 'bank_transfer', label: 'Banka Transferi' },
    { id: 'credit_card', label: 'Kredi Kartı' },
    { id: 'cash', label: 'Nakit' },
    { id: 'other', label: 'Diğer' }
];

export const PaymentForm = ( { payment = null, onSubmit, onCancel } ) => {
    const { loading, error, updatePaymentStatus } = useFinance();
    const [formData, setFormData] = useState( payment || defaultPayment );
    const [formErrors, setFormErrors] = useState( {} );

    const validateForm = () => {
        const errors = {};

        if ( !formData.payment_number ) {
            errors.payment_number = 'Ödeme numarası zorunludur';
        }
        if ( !formData.amount || formData.amount <= 0 ) {
            errors.amount = 'Geçerli bir tutar giriniz';
        }
        if ( !formData.payment_date ) {
            errors.payment_date = 'Ödeme tarihi zorunludur';
        }
        if ( !formData.payment_method ) {
            errors.payment_method = 'Ödeme yöntemi zorunludur';
        }

        setFormErrors( errors );
        return Object.keys( errors ).length === 0;
    };

    const handleInputChange = ( e ) => {
        const { name, value } = e.target;
        setFormData( prev => ( {
            ...prev,
            [name]: value
        } ) );
    };

    const handleSubmit = async ( e ) => {
        e.preventDefault();

        if ( !validateForm() ) {
            return;
        }

        try {
            if ( payment ) {
                await updatePaymentStatus( payment.id, formData.status );
            }
            onSubmit( formData );
        } catch ( err ) {
            setFormErrors( prev => ( {
                ...prev,
                submit: err.message
            } ) );
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {formErrors.submit && (
                <div className="p-4 bg-red-100 text-red-700 rounded-md">
                    {formErrors.submit}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ödeme Numarası
                    </label>
                    <input
                        type="text"
                        name="payment_number"
                        value={formData.payment_number}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${formErrors.payment_number ? 'border-red-500' : ''
                            }`}
                    />
                    {formErrors.payment_number && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.payment_number}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tutar
                    </label>
                    <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${formErrors.amount ? 'border-red-500' : ''
                            }`}
                    />
                    {formErrors.amount && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.amount}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ödeme Tarihi
                    </label>
                    <input
                        type="date"
                        name="payment_date"
                        value={formData.payment_date}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${formErrors.payment_date ? 'border-red-500' : ''
                            }`}
                    />
                    {formErrors.payment_date && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.payment_date}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ödeme Yöntemi
                    </label>
                    <select
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${formErrors.payment_method ? 'border-red-500' : ''
                            }`}
                    >
                        <option value="">Seçiniz</option>
                        {paymentMethods.map( method => (
                            <option key={method.id} value={method.id}>
                                {method.label}
                            </option>
                        ) )}
                    </select>
                    {formErrors.payment_method && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.payment_method}</p>
                    )}
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Açıklama
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Ödeme ile ilgili açıklama ekleyin..."
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                    İptal
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
                >
                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </div>
        </form>
    );
};