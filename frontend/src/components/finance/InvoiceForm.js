import React, { useState, useEffect } from 'react';
import { useFinance } from '../../hooks/useFinance';

const defaultInvoice = {
    invoice_number: '',
    customer_name: '',
    issue_date: new Date().toISOString().split( 'T' )[0],
    due_date: '',
    amount: '',
    tax_rate: 18,
    currency: 'TRY',
    description: '',
    items: [
        {
            description: '',
            quantity: 1,
            unit_price: 0,
            tax_rate: 18,
            total: 0
        }
    ]
};

export const InvoiceForm = ( { invoice = null, onSubmit, onCancel } ) => {
    const { loading, error, createInvoice } = useFinance();
    const [formData, setFormData] = useState( invoice || defaultInvoice );
    const [formErrors, setFormErrors] = useState( {} );

    // Form validasyonu
    const validateForm = () => {
        const errors = {};

        if ( !formData.invoice_number ) {
            errors.invoice_number = 'Fatura numarası zorunludur';
        }
        if ( !formData.customer_name ) {
            errors.customer_name = 'Müşteri adı zorunludur';
        }
        if ( !formData.due_date ) {
            errors.due_date = 'Vade tarihi zorunludur';
        }
        if ( !formData.amount || formData.amount <= 0 ) {
            errors.amount = 'Geçerli bir tutar giriniz';
        }
        if ( formData.items.some( item => !item.description || item.quantity <= 0 || item.unit_price <= 0 ) ) {
            errors.items = 'Tüm ürün bilgilerini eksiksiz doldurunuz';
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

    const handleItemChange = ( index, field, value ) => {
        setFormData( prev => {
            const newItems = [...prev.items];
            newItems[index] = {
                ...newItems[index],
                [field]: value,
                total: field === 'quantity' || field === 'unit_price'
                    ? calculateItemTotal( newItems[index], field, value )
                    : newItems[index].total
            };
            return {
                ...prev,
                items: newItems,
                amount: calculateTotalAmount( newItems )
            };
        } );
    };

    const calculateItemTotal = ( item, field, value ) => {
        const quantity = field === 'quantity' ? Number( value ) : Number( item.quantity );
        const unitPrice = field === 'unit_price' ? Number( value ) : Number( item.unit_price );
        const total = quantity * unitPrice;
        const taxAmount = total * ( Number( item.tax_rate ) / 100 );
        return total + taxAmount;
    };

    const calculateTotalAmount = ( items ) => {
        return items.reduce( ( sum, item ) => sum + item.total, 0 );
    };

    const addNewItem = () => {
        setFormData( prev => ( {
            ...prev,
            items: [...prev.items, {
                description: '',
                quantity: 1,
                unit_price: 0,
                tax_rate: 18,
                total: 0
            }]
        } ) );
    };

    const removeItem = ( index ) => {
        setFormData( prev => {
            const newItems = prev.items.filter( ( _, i ) => i !== index );
            return {
                ...prev,
                items: newItems,
                amount: calculateTotalAmount( newItems )
            };
        } );
    };

    const handleSubmit = async ( e ) => {
        e.preventDefault();

        if ( !validateForm() ) {
            return;
        }

        try {
            const result = await createInvoice( formData );
            onSubmit( result );
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
                        Fatura Numarası
                    </label>
                    <input
                        type="text"
                        name="invoice_number"
                        value={formData.invoice_number}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${formErrors.invoice_number ? 'border-red-500' : ''
                            }`}
                    />
                    {formErrors.invoice_number && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.invoice_number}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Müşteri Adı
                    </label>
                    <input
                        type="text"
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${formErrors.customer_name ? 'border-red-500' : ''
                            }`}
                    />
                    {formErrors.customer_name && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.customer_name}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Düzenleme Tarihi
                    </label>
                    <input
                        type="date"
                        name="issue_date"
                        value={formData.issue_date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vade Tarihi
                    </label>
                    <input
                        type="date"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${formErrors.due_date ? 'border-red-500' : ''
                            }`}
                    />
                    {formErrors.due_date && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.due_date}</p>
                    )}
                </div>
            </div>

            {/* Kalemler */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Fatura Kalemleri</h3>
                    <button
                        type="button"
                        onClick={addNewItem}
                        className="px-4 py-2 text-sm bg-secondary text-white rounded-md hover:bg-secondary-dark"
                    >
                        Kalem Ekle
                    </button>
                </div>

                {formErrors.items && (
                    <p className="text-sm text-red-500">{formErrors.items}</p>
                )}

                {formData.items.map( ( item, index ) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-md">
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                placeholder="Açıklama"
                                value={item.description}
                                onChange={( e ) => handleItemChange( index, 'description', e.target.value )}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <input
                                type="number"
                                placeholder="Miktar"
                                value={item.quantity}
                                onChange={( e ) => handleItemChange( index, 'quantity', e.target.value )}
                                className="w-full px-3 py-2 border rounded-md"
                                min="1"
                            />
                        </div>
                        <div>
                            <input
                                type="number"
                                placeholder="Birim Fiyat"
                                value={item.unit_price}
                                onChange={( e ) => handleItemChange( index, 'unit_price', e.target.value )}
                                className="w-full px-3 py-2 border rounded-md"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium">
                                {new Intl.NumberFormat( 'tr-TR', {
                                    style: 'currency',
                                    currency: 'TRY'
                                } ).format( item.total )}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeItem( index )}
                                className="text-red-500 hover:text-red-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ) )}
            </div>

            {/* Toplam ve Butonlar */}
            <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t">
                <div className="text-xl font-bold mb-4 md:mb-0">
                    Toplam: {new Intl.NumberFormat( 'tr-TR', {
                        style: 'currency',
                        currency: 'TRY'
                    } ).format( formData.amount )}
                </div>

                <div className="space-x-4">
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
            </div>
        </form>
    );
};