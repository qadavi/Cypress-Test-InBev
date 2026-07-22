/**
 * Seletores da página /login
 * Centralizados aqui para que uma mudança no DOM exija ajuste
 * em um único lugar, sem tocar na lógica dos testes.
 *
 * Baseados em data-testid (confirmado em front.serverest.dev/login),
 * mais robustos que seletores de tipo/texto.
 */
export const loginSelectors = {
  input: {
    email: '[data-testid="email"]',
    senha: '[data-testid="senha"]',
  },
  button: {
    entrar: '[data-testid="entrar"]', // usado com cy.get(...)
  },
};
