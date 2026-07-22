/**
 * Seletores da página /cadastrarusuarios
 * Baseados em data-testid (confirmado em front.serverest.dev/cadastrarusuarios).
 */
export const cadastroUsuarioSelectors = {
  input: {
    nome: '[data-testid="nome"]',
    email: '[data-testid="email"]',
    senha: '[data-testid="password"]',
  },
  button: {
    cadastrar: '[data-testid="cadastrar"]', // usado com cy.get(...)
  },
};
