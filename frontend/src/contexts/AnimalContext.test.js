import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { AnimalProvider, useAnimal } from './AnimalContext';
import axios from 'axios';

jest.mock( 'axios' );

function TestComponent() {
    const { animals, fetchAnimals } = useAnimal();
    React.useEffect( () => { fetchAnimals(); }, [fetchAnimals] );
    return <div data-testid="animal-count">{animals.length}</div>;
}

describe( 'AnimalContext', () => {
    it( 'fetchAnimals çağrısı ile hayvanlar state güncellenir', async () => {
        axios.get.mockResolvedValueOnce( { data: [{ id: 1 }, { id: 2 }] } );
        const { getByTestId } = render(
            <AnimalProvider>
                <TestComponent />
            </AnimalProvider>
        );
        await waitFor( () => {
            expect( getByTestId( 'animal-count' ).textContent ).toBe( '2' );
        } );
    } );
} );
