describe('Add authorization', () => {
  it('should add correctly authorization', () => { 
    cy.visit(Cypress.env('BASE_URL'));
    cy.get('.p-speeddial-button', { timeout: 10000 }).should('be.visible').click();
    cy.get('.pi-user-plus').should('exist').click();
    cy.get('#auth', { timeout: 20000 }).should('be.visible').type('sample-auth');
    cy.get('button').contains('Save').click();
    cy.get('.p-toast-message').should('contain', 'Auth has been added');
    cy.get('.p-speeddial-button', { timeout: 10000 }).should('be.visible').click();
    cy.get('.pi-sign-out').should('exist').click();
    cy.get('.p-toast-message').should('contain', 'Auth has been removed');
  });
});
