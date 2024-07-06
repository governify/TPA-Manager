beforeEach(() => {
    cy.visit(Cypress.env('BASE_URL'));
});

describe('Basic Home logic', () => {
    it('should see the Home component', () => {
        const homePageTitle = cy.get('.header-top > span');
        homePageTitle.should('have.text', 'Development Scopes');
    });
});

describe('Showing hidden courses', () => {
    it('should toggle showHiddenCourses to true', () => {
      cy.get('.p-inputswitch').as('switch'); 
      cy.get('@switch').should('not.have.class', 'bg-green-400');
      cy.get('@switch').click();
      cy.get('.p-toast-message').should('contain', 'Showing hidden courses');
      cy.get('.p-inputswitch-slider').should('have.class', 'bg-green-400'); 
  
    });
  });


