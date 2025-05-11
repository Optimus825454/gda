import React from 'react';
import { render, screen } from '@testing-library/react';
import AnimalList from './AnimalList';
import { AnimalProvider } from '../../contexts/AnimalContext';

jest.mock( '../../contexts/AnimalContext', () => {
    const original = jest.requireActual( '../../contexts/AnimalContext' );
    return {
        ...original,
        useAnimal: () => ( {
            animals: [
                { id: 1, animalId: 'TR123', category: 'INEK', type: 'İnek', testResult: 'BEKLEMEDE', destinationCompany: '', saleStatus: 'BEKLEMEDE' },
                { id: 2, animalId: 'TR456', category: 'GEBE_DUVE', type: 'Düve', testResult: 'POZITIF', destinationCompany: 'ASYAET', saleStatus: 'SATISA_HAZIR' }
            ],
            constants: {
                categories: { INEK: 'INEK', GEBE_DUVE: 'GEBE_DUVE' },
                testResults: { BEKLEMEDE: 'BEKLEMEDE', POZITIF: 'POZITIF' },
                destinationCompanies: { ASYAET: 'ASYAET' },
                saleStatus: { BEKLEMEDE: 'BEKLEMEDE', SATISA_HAZIR: 'SATISA_HAZIR' }
            },
            loading: false,
            error: null,
            loadConstants: jest.fn(),
            fetchAnimals: jest.fn(),
            fetchAnimalsByCategory: jest.fn(),
            fetchAnimalsByTestResult: jest.fn(),
            fetchAnimalsByDestination: jest.fn(),
            fetchAnimalsBySaleStatus: jest.fn(),
            recordTestResult: jest.fn(),
            completeSale: jest.fn()
        } )
    };
} );

describe( 'AnimalList', () => {
    it( 'bileşen render edildiğinde hayvanlar tabloya yazılır', () => {
        render(
            <AnimalProvider>
                <AnimalList />
            </AnimalProvider>
        );
        expect( screen.getByText( 'TR123' ) ).toBeInTheDocument();
        expect( screen.getByText( 'TR456' ) ).toBeInTheDocument();
    } );
} );
