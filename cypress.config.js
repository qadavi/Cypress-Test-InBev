const { defineConfig } = require("cypress");

module.exports = defineConfig({
  defaultCommandTimeout: 8000,
  requestTimeout: 10000,
  responseTimeout: 10000,

  retries: {
    runMode: 2,
    openMode: 0,
  },

  viewportWidth: 1280,
  viewportHeight: 800,

  video: false,
  screenshotOnRunFailure: true,

  e2e: {
    baseUrl: "https://front.serverest.dev",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",
    env: {
      apiUrl: "https://serverest.dev",
    },
    setupNodeEvents(on, config) {
      on("task", {
        log(message) {
          console.log(message);
          return null;
        },
      });
      return config;
    },
  },
});
