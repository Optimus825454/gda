import React from 'react';
import { render, screen } from '@testing-library/react';
import AnimalDetail from './AnimalDetail';
import { MemoryRouter } from 'react-router-dom';

describe( 'AnimalDetail', () => {
    it( 'detay kartında yeni eklenen alanlar görünüyor', async () => {
        render(
            <MemoryRouter>
                <AnimalDetail />
            </MemoryRouter>
        );
        expect( await screen.findByText( /Kategori/i ) ).toBeInTheDocument();
        expect( await screen.findByText( /Test Sonucu/i ) ).toBeInTheDocument();
        expect( await screen.findByText( /Satış Durumu/i ) ).toBeInTheDocument();
        expect( await screen.findByText( /Hedef Şirket/i ) ).toBeInTheDocument();
        expect( await screen.findByText( /Satış Fiyatı/i ) ).toBeInTheDocument();
    } );
} );
