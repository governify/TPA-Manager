beforeEach(() => {
  cy.intercept(
    "GET",
    Cypress.env("SCOPE_MANAGER_URL") + "/api/v1/scopes/development/courses",
    { fixture: "courses.json" }
  ).as("coursesCheck");
  cy.intercept(
    "GET",
    Cypress.env("REGISTRY_URL") + "/api/v6/agreements/tpa-*",
    { fixture: "tpa.json" }
  ).as("tpaCheck");
  cy.visit(Cypress.env("BASE_URL"));
});

describe("Display tree", () => {
  it("should click on the TreeBrowser and find the TPA button", () => {
    cy.wait("@coursesCheck");
    const toggleRoot = cy.get(".node-root-content span").contains("Courses");
    toggleRoot.click();
    const toggleCourse = cy.get("span").contains("test-course");
    toggleCourse.click();
    const toggleProject = cy.get("span").contains("test-project-with-tpa");
    toggleProject.click();
    cy.get(".left-sections h3").contains("Identities");
    cy.contains("div", "test-project-with-tpa").within(() => {
      cy.get("button").contains("TPA");
    });
  });
});

describe("Display TPA", () => {
  it("click on TPA button and try to edit", () => {
    const toggleRoot = cy.get(".node-root-content span").contains("Courses");
    toggleRoot.click();
    const toggleCourse = cy.get("span").contains("test-course");
    toggleCourse.click();
    cy.contains("div", "test-project-with-tpa").within(() => {
      cy.get("button").contains("TPA").click();
    });
    cy.wait("@tpaCheck");
    cy.get(".p-breadcrumb-list").contains("test-course");
  });
});

describe("Edit TPA", () => {
  it("click on TPA button and is edit mode", () => {
    const toggleRoot = cy.get(".node-root-content span").contains("Courses");
    toggleRoot.click();
    const toggleCourse = cy.get("span").contains("test-course");
    toggleCourse.click();
    cy.contains("div", "test-project-with-tpa").within(() => {
      cy.get("button").contains("TPA").click();
    });
    cy.wait("@tpaCheck");
    cy.get(".p-inputswitch").as("switch");
    cy.get("@switch").should("not.have.class", "bg-green-400");
    cy.get("@switch").click();
    cy.get('fieldset').find('button .pi-save').should('exist');
});
});

describe("Display Catalogue", () => {
  it("click on breadcrumb and then Catalogue button", () => {
    const toggleRoot = cy.get(".node-root-content span").contains("Courses");
    toggleRoot.click();
    const toggleCourse = cy.get("span").contains("test-course");
    toggleCourse.click();
    cy.contains("div", "test-project-with-tpa").within(() => {
      cy.get("button").contains("TPA").click();
    });
    cy.wait("@tpaCheck");
    cy.get(".p-breadcrumb-list").contains("test-course");
    cy.get(".p-panel-icons").click();
    const catalogue = cy.get("button").contains("Catalogue");
    catalogue.click();
    cy.url().should("eq", Cypress.env("BASE_URL") + "/catalogue");
  });
});
