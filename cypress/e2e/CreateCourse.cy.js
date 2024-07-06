beforeEach(() => {
    cy.intercept("GET", Cypress.env("REGISTRY_URL") + "/api/v6/templates", {
        fixture: "templates.json",
      }).as("templatesCheck");
    cy.intercept('POST', Cypress.env("SCOPE_MANAGER_URL") + '/api/v1/scopes/development/courses', { fixture: 'new-course.json' }).as('coursesCheck');

  cy.visit(Cypress.env("BASE_URL") + "/new-course");
});

describe("Correct Title", () => {
  it("should see the New Course component", () => {
    const homePageTitle = cy.get(".header-top > span");
    homePageTitle.should("have.text", "Create new Course");
  });
});

describe("Create Course", () => {
  it("message", () => {
    cy.get("#class-name").type("New-course-name");
    cy.get("#join-code").type("12345");
    cy.get('span.p-dropdown-label').click();
    cy.get('li').contains('template-test_showcase-v1-0-0').click();
    cy.get(".p-button").contains("Create").click();
    cy.get(".p-toast-message").should(
      "contain",
      "Course created successfully!"
    );
  });
});
