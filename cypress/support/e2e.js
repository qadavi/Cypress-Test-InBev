import "./commands";
import "cypress-mochawesome-reporter/register";

// "ResizeObserver loop" é um warning inofensivo do app; qualquer outro
// erro não tratado continua estourando normalmente.
Cypress.on("uncaught:exception", (err) => {
  if (err.message.includes("ResizeObserver loop")) {
    return false;
  }
});
