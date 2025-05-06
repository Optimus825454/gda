/**
 * AnimalGroups.test.js - Test grupları ve lokasyon yönetimi testi
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AnimalGroups from '../../../pages/animal/AnimalGroups';
import { useAnimal } from '../../../contexts/AnimalContext';

// useAnimal hook'unu mockluyoruz
jest.mock( '../../../contexts/AnimalContext' );

describe( 'AnimalGroups Component', () => {
    const mockTestAndLocationSummary = [
        {
            location: 'TEMIZ_BOLGE',
            test_group: 'TEMIZ',
            count: '5'
        },
        {
            location: 'IZOLASYON_BOLGE',
            test_group: 'IZOLE',
            count: '3'
        }
    ];

    const mockAnimals = {
        TEMIZ: [
            {
                id: '1',
                animalId: 'TR1234567890',
                location: 'TEMIZ_BOLGE'
            }
        ],
        IZOLE: [
            {
                id: '2',
                animalId: 'TR9876543210',
                location: 'IZOLASYON_BOLGE'
            }
        ],
        SUSPECT: [
            {
                id: '3',
                animalId: 'TR5555555555',
                location: 'KARANTINA_BOLGE'
            }
        ]
    };

    const mockAnimalContext = {
        findByTestGroup: jest.fn( ( group ) => Promise.resolve( mockAnimals[group] ) ),
        updateLocation: jest.fn().mockResolvedValue( true ),
        getTestAndLocationSummary: jest.fn().mockResolvedValue( mockTestAndLocationSummary ),
        organizeByTestGroups: jest.fn().mockResolvedValue( true )
    };

    beforeEach( () => {
        useAnimal.mockImplementation( () => mockAnimalContext );
    } );

    afterEach( () => {
        jest.clearAllMocks();
    } );

    test( 'Başlangıç durumunda yükleme göstergesi görüntüleniyor', () => {
        render( <AnimalGroups /> );
        expect( screen.getByRole( 'progressbar' ) ).toBeInTheDocument();
    } );

    test( 'Hayvan grupları ve lokasyonlar başarıyla yükleniyor', async () => {
        render( <AnimalGroups /> );

        await waitFor( () => {
            expect( screen.getByText( 'Hayvan Grupları ve Lokasyonlar' ) ).toBeInTheDocument();
        } );

        expect( mockAnimalContext.getTestAndLocationSummary ).toHaveBeenCalled();
        expect( mockAnimalContext.findByTestGroup ).toHaveBeenCalledTimes( 3 );
    } );

    test( 'Otomatik organizasyon çalışıyor', async () => {
        render( <AnimalGroups /> );

        await waitFor( () => {
            expect( screen.getByText( 'Otomatik Organize Et' ) ).toBeInTheDocument();
        } );

        const organizeButton = screen.getByText( 'Otomatik Organize Et' );
        await act( async () => {
            fireEvent.click( organizeButton );
        } );

        expect( mockAnimalContext.organizeByTestGroups ).toHaveBeenCalled();
    } );

    test( 'Lokasyon değiştirme dialogu açılıyor ve çalışıyor', async () => {
        render( <AnimalGroups /> );

        await waitFor( () => {
            expect( screen.getAllByText( 'Taşı' )[0] ).toBeInTheDocument();
        } );

        // İlk "Taşı" butonuna tıkla
        const moveButton = screen.getAllByText( 'Taşı' )[0];
        fireEvent.click( moveButton );

        // Dialog açıldı mı kontrol et
        expect( screen.getByText( 'Lokasyon Değiştir' ) ).toBeInTheDocument();

        // Dialog içindeki form elemanlarını doldur
        const locationSelect = screen.getByRole( 'combobox' );
        fireEvent.change( locationSelect, { target: { value: 'TEMIZ_BOLGE' } } );

        const reasonInput = screen.getByLabelText( 'Taşıma Nedeni' );
        fireEvent.change( reasonInput, { target: { value: 'Test taşıma nedeni' } } );

        // Taşıma işlemini onayla
        const confirmButton = screen.getByText( 'Taşı' );
        await act( async () => {
            fireEvent.click( confirmButton );
        } );

        expect( mockAnimalContext.updateLocation ).toHaveBeenCalled();
    } );

    test( 'Hata durumunda hata mesajı gösteriliyor', async () => {
        const errorMessage = 'Test error message';
        mockAnimalContext.getTestAndLocationSummary.mockRejectedValueOnce( new Error( errorMessage ) );

        render( <AnimalGroups /> );

        await waitFor( () => {
            expect( screen.getByText( errorMessage ) ).toBeInTheDocument();
        } );
    } );

    test( 'Lokasyon özeti doğru şekilde görüntüleniyor', async () => {
        render( <AnimalGroups /> );

        await waitFor( () => {
            expect( screen.getByText( 'Lokasyon Özeti' ) ).toBeInTheDocument();
        } );

        // Özet tablosundaki değerleri kontrol et
        expect( screen.getByText( 'Temiz Bölge' ) ).toBeInTheDocument();
        expect( screen.getByText( 'İzolasyon Bölgesi' ) ).toBeInTheDocument();
    } );

    test( 'Boş veri durumunda tablolar uygun şekilde görüntüleniyor', async () => {
        mockAnimalContext.findByTestGroup.mockImplementation( () => Promise.resolve( [] ) );
        mockAnimalContext.getTestAndLocationSummary.mockResolvedValueOnce( [] );

        render( <AnimalGroups /> );

        await waitFor( () => {
            expect( screen.getByText( 'Hayvan Grupları ve Lokasyonlar' ) ).toBeInTheDocument();
        } );

        // Tüm grup başlıkları görüntüleniyor mu kontrol et
        expect( screen.getByText( 'Temiz Grup' ) ).toBeInTheDocument();
        expect( screen.getByText( 'İzole Grup' ) ).toBeInTheDocument();
        expect( screen.getByText( 'Şüpheli Grup' ) ).toBeInTheDocument();
    } );
} );