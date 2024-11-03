describe('Not Found Component', () => {

    it('should input a non-existent URL and see the Not Found component', () => {
        cy.visit(Cypress.env('BASE_URL') + '/non-existent-url');

        const notFoundComponent = cy.get('body');
        notFoundComponent.should('exist');

        const notFoundTitle = notFoundComponent.find('h1');
        notFoundTitle.should('have.text', '404');

        const notFoundMessage = notFoundComponent.get('p');
        notFoundMessage.should('have.text', 'Oops! Page not found.');
    });

    it('should click on the Home button and see the Home component', () => {
        cy.visit(Cypress.env('BASE_URL') + '/non-existent-url');

        const notFoundComponent = cy.get('body');

        const notFoundButton = notFoundComponent.get('button').contains('Home');
        notFoundButton.should('have.text', 'Home');

        notFoundButton.click();
        cy.url().should('eq', Cypress.env('BASE_URL') + '/');

        const homePageTitle = cy.get('.header-top > span');
        homePageTitle.should('have.text', 'Development Scopes');
    });

});