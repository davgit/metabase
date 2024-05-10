import { SAMPLE_DATABASE } from "e2e/support/cypress_sample_database";
import { ORDERS_MODEL_ID } from "e2e/support/cypress_sample_instance_data";
import {
  restore,
  setTokenFeatures,
  describeWithSnowplow,
  describeWithSnowplowEE,
  expectGoodSnowplowEvent,
  resetSnowplow,
  expectNoBadSnowplowEvents,
  enableTracking,
  browseData,
  navigationSidebar,
} from "e2e/support/helpers";

const { PRODUCTS_ID } = SAMPLE_DATABASE;

const browseModels = () =>
  navigationSidebar().findByRole("listitem", { name: "Browse models" }).click();

describeWithSnowplow("scenarios > browse", () => {
  beforeEach(() => {
    resetSnowplow();
    restore();
    cy.signInAsAdmin();
    enableTracking();
  });

  it("can browse to a model", () => {
    cy.visit("/");
    browseModels().click();
    cy.location("pathname").should("eq", "/browse/models");
    cy.findByRole("heading", { name: "Orders Model" }).click();
    cy.url().should("include", `/model/${ORDERS_MODEL_ID}-`);
    expectNoBadSnowplowEvents();
    expectGoodSnowplowEvent({
      event: "browse_data_model_clicked",
      model_id: ORDERS_MODEL_ID,
    });
  });

  it("can browse to a table in a database", () => {
    cy.visit("/");
    browseData().click();
    cy.findByRole("heading", { name: "Sample Database" }).click();
    cy.findByRole("heading", { name: "Products" }).click();
    cy.findByRole("button", { name: "Summarize" });
    cy.findByRole("link", { name: /Sample Database/ }).click();
    expectNoBadSnowplowEvents();
    expectGoodSnowplowEvent({
      event: "browse_data_table_clicked",
      table_id: PRODUCTS_ID,
    });
  });

  it("browsing to a database only triggers a request for schemas for that specific database", () => {
    cy.intercept("GET", "/api/database/1/schemas").as(
      "schemasForSampleDatabase",
    );
    cy.intercept(
      "GET",
      /\/api\/database\/(?!1\b)\d+\/schemas/,
      cy.spy().as("schemasForOtherDatabases"),
    );
    cy.visit("/");
    browseData().click();
    cy.findByRole("link", { name: /Sample Database/ }).click();
    cy.wait("@schemasForSampleDatabase");
    cy.get("@schemasForOtherDatabases").should("not.have.been.called");
  });

  it("can visit 'Learn about our data' page", () => {
    cy.visit("/");
    browseModels().click();
    cy.findByRole("link", { name: /Learn about our data/ }).click();
    cy.location("pathname").should("eq", "/reference/databases");
    cy.go("back");
    cy.findByRole("heading", { name: "Sample Database" }).click();
    cy.findByRole("heading", { name: "Products" }).click();
    cy.findByRole("gridcell", { name: "Rustic Paper Wallet" });
  });

  it("on an open-source instance, the Browse models page has no controls for setting filters", () => {
    cy.visit("/");
    browseModels().click();
    cy.findByRole("button", { name: /filter icon/i }).should("not.exist");
    cy.findByRole("switch", { name: /Only show verified models/ }).should(
      "not.exist",
    );
  });

  it("can change sorting options in the 'Browse models' table", () => {
    cy.intercept("PUT", "/api/setting/browse-models-sort-column").as(
      "persistSortColumn",
    );
    cy.intercept("PUT", "/api/setting/browse-models-sort-direction").as(
      "persistSortDirection",
    );
    cy.visit("/");
    browseModels().click();
    cy.findByRole("table").within(() => {
      cy.log("A model exists on the page");
      cy.findByRole("heading", { name: "Orders Model" });
      cy.findByRole("button", { name: "Sort by collection" })
        .realHover()
        .within(() => {
          cy.log(
            "Table is sorted by collection, ascending, by default, so the chevron up icon is shown",
          );
          cy.findByLabelText(/chevronup icon/).click();
          cy.wait("@persistSortDirection");
        });
      cy.findByRole("button", { name: "Sort by name" })
        .realHover()
        .within(() => {
          cy.findByLabelText(/chevrondown icon/).click();
          cy.wait("@persistSortColumn");
        });
    });
  });
});

describeWithSnowplowEE("scenarios > browse data (EE)", () => {
  beforeEach(() => {
    resetSnowplow();
    restore();
    cy.signInAsAdmin();
    enableTracking();
  });

  it("/browse/models allows models to be filtered, on an enterprise instance", () => {
    const openFilterPopover = () =>
      cy.findByRole("button", { name: /filter icon/i }).click();
    const toggle = () =>
      cy.findByRole("switch", { name: /Only show verified models/ });
    setTokenFeatures("all");
    cy.visit("/");
    cy.findByRole("listitem", { name: "Browse models" }).click();
    cy.findByRole("heading", { name: "Our analytics" }).should("not.exist");
    cy.findByRole("heading", { name: "Orders Model" }).should("not.exist");
    openFilterPopover();
    toggle().next("label").click();
    cy.findByRole("heading", { name: "Orders Model" }).click();
    cy.findByLabelText("Move, archive, and more...").click();
    cy.findByRole("dialog", {
      name: /ellipsis icon/i,
    })
      .findByText(/Verify this model/)
      .click();
    cy.visit("/browse");
    openFilterPopover();
    toggle().next("label").click();
    cy.findByRole("heading", { name: "Orders Model" }).should("be.visible");
  });
});
