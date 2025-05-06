import React from 'react';
import { render, screen } from '@testing-library/react';
import AnimalForm from './AnimalForm';
import { MemoryRouter } from 'react-router-dom';

describe( 'AnimalForm', () => {
    it( 'form alanları ekranda görünüyor', () => {
        render(
            <MemoryRouter>
                <AnimalForm />
            </MemoryRouter>
        );
        expect( screen.getByLabelText( /Hayvan Kimlik No/i ) ).toBeInTheDocument();
        expect( screen.getByLabelText( /Hayvan Türü/i ) ).toBeInTheDocument();
        expect( screen.getByLabelText( /Kategori/i ) ).toBeInTheDocument();
        expect( screen.getByLabelText( /Test Sonucu/i ) ).toBeInTheDocument();
        expect( screen.getByLabelText( /Satış Durumu/i ) ).toBeInTheDocument();
        expect( screen.getByLabelText( /Hedef Şirket/i ) ).toBeInTheDocument();
        expect( screen.getByLabelText( /Satış Fiyatı/i ) ).toBeInTheDocument();
    } );
} );
