beforeEach(() => {
  cy.intercept("GET", Cypress.env("SCOPE_MANAGER_URL") +'/api/v1/scopes/development/courses', {
    fixture: "courses.json",
  }).as("coursesCheck");
  cy.intercept("DELETE", Cypress.env("REGISTRY_URL") +'/api/v6/templates/template-test_showcase-v1-0-0-clone', {
    statusCode: 200, 
    body: {
      message: 'Template deleted successfully'
    }
  }).as('deleteTemplate');

  cy.visit(Cypress.env("BASE_URL"));
});
describe("Navigate to templates-management and create template from sample", () => {
  it("should navigate to templates-management and create new template", () => {
    cy.intercept("POST", Cypress.env("REGISTRY_URL") + "/api/v6/templates", {
      fixture: "templates-from-sample.json",
    }).as("createTemplateCheck");
    cy.get("button").contains("Templates Management").click();
    cy.url().should("eq", Cypress.env("BASE_URL") + "/templates-management");
    cy.get("button")
      .contains("Create new template from sample")
      .should("be.visible")
      .click();
    cy.get("#newTemplateId").type("template-test_showcase-v1-0-0");
    cy.get("#sampleTemplate").click();
    cy.get("#sampleTemplate_0").click();
    cy.get("body").click(0, 0);
    cy.get("button").contains("Add").click();
    cy.get(".p-toast-message").should(
      "contain",
      "Template added successfully."
    );
  });
});
describe("Display templates", () => {
  it("should navigate to templates-management and display the templates", () => {
    cy.intercept("GET", Cypress.env("REGISTRY_URL") + "/api/v6/templates", {
      fixture: "templates.json",
    }).as("templatesCheck");
    cy.get("button").contains("Templates Management").click();
    cy.url().should("eq", Cypress.env("BASE_URL") + "/templates-management");
    cy.wait("@templatesCheck");
    cy.get(".template-card .text-header").contains(
      "template-test_showcase-v1-0-0"
    );
  });
});
describe("Clone TPA template", () => {
  it("clone template succesfully", () => {
    cy.intercept("GET", Cypress.env("REGISTRY_URL") + "/api/v6/templates", {
      fixture: "templates.json",
    }).as("templatesCheck");
    cy.intercept("POST", Cypress.env("REGISTRY_URL") + "/api/v6/templates", {
      fixture: "template_cloned.json",
    }).as("cloneTemplateCheck");

    cy.get("button").contains("Templates Management").click();
    cy.wait("@templatesCheck");
    cy.get(".template-card .text-header").contains(
      "template-test_showcase-v1-0-0"
    );
    cy.get("button").contains("Clone").click();
    cy.wait("@cloneTemplateCheck");
    cy.get(".p-toast-message").should(
      "contain",
      "Template cloned successfully."
    );
  });
  describe("Check cloned Template", () => {
    it("The template and his clone must be in templates", () => {
      cy.intercept("GET", Cypress.env("REGISTRY_URL") + "/api/v6/templates", {
        fixture: "allTemplates.json",
      }).as("allTemplatesCheck");
      cy.get("button").contains("Templates Management").click();
      cy.wait("@allTemplatesCheck");
      cy.get(".template-card .text-header").contains(
        "template-test_showcase-v1-0-0-clone"
      );
      cy.get(".template-card .text-header").contains(
        "template-test_showcase-v1-0-0"
      );
    });
  });
  describe("Delete cloned Template", () => {
    it("Delete clone template", () => {
      cy.intercept("GET", Cypress.env("REGISTRY_URL") + "/api/v6/templates", {
        fixture: "allTemplates.json",
      }).as("templatesCheck");
      cy.get("button").contains("Templates Management").click();
      cy.get(".template-card .text-header")
        .contains("template-test_showcase-v1-0-0-clone")
        .closest(".template-card")
        .find("button")
        .contains("Delete")
        .click();
      cy.get("button")
        .contains("Yes", { timeout: 10000 })
        .should("be.visible")
        .click({ force: true });
      cy.get(".p-toast-message").should(
        "contain",
        "Template deleted successfully."
      );
    });
  });
  describe("Cloned template is deleted", () => {
    it("Check if cloned template has been deleted", () => {
      cy.intercept("GET", Cypress.env("REGISTRY_URL") + "/api/v6/templates", {
        fixture: "templates.json",
      }).as("templatesCheck");
      cy.get("button").contains("Templates Management").click();

      cy.get(".template-card .text-header").contains(
        "template-test_showcase-v1-0-0-clone"
      ).should('not.exist');;

    });
  });
});
