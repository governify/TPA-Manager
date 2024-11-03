describe('Change App Theme', () => {
  it('should change the theme to dark mode and back to light mode', () => { 
    cy.visit(Cypress.env('BASE_URL'));
    cy.get('.p-speeddial-button', { timeout: 10000 }).should('be.visible').click();
    cy.get('.pi-sun').should('exist').click();
    cy.get('.pi-moon').should('exist').click();
    cy.get('.pi-sun').should('exist');
  });
});
