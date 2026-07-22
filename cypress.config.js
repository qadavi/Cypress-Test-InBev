const { defineConfig } = require("cypress");

module.exports = defineConfig({
  // Timeout global de comandos - evita specs "flaky" em rede lenta
  defaultCommandTimeout: 8000,
  requestTimeout: 10000,
  responseTimeout: 10000,

  // Boas práticas: retries só no modo "run" (CI), não no "open" (dev)
  retries: {
    runMode: 2,
    openMode: 0,
  },

  viewportWidth: 1280,
  viewportHeight: 800,

  // Vídeo só quando falha, para economizar espaço/tempo de CI
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
      // hook para plugins/tasks futuros (ex.: log customizado, DB seed, etc.)
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
