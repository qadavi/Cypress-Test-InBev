// ***********************************************************
// Arquivo carregado automaticamente antes de cada spec.
// Aqui importamos comandos customizados e configurações globais.
// https://on.cypress.io/configuration
// ***********************************************************

import "./commands";

// Best practice: não deixar um erro de aplicação não tratado (fora do
// nosso controle, ex.: warning de lib de terceiros) derrubar a suíte
// inteira. Usamos com moderação e só quando o erro é conhecido e não
// relacionado ao comportamento que estamos validando.
Cypress.on("uncaught:exception", (err) => {
  if (err.message.includes("ResizeObserver loop")) {
    return false;
  }
  // deixa qualquer outro erro estourar normalmente (não mascarar bugs reais)
});
