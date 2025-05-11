describe( 'Hayvan Listesi E2E', () => {
    it( 'Tablo başlıkları ve en az bir hayvan satırı görünmeli', () => {
        cy.visit( '/animals' );
        cy.contains( 'Hayvan Listesi' ).should( 'be.visible' );
        cy.contains( 'Kimlik No' ).should( 'be.visible' );
        cy.contains( 'Kategori' ).should( 'be.visible' );
        cy.get( 'table tbody tr' ).should( 'have.length.greaterThan', 0 );
    } );
} );
