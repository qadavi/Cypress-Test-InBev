/**
 * Seletores da página /home
 */
export const homeSelectors = {
  card: {
    // .card não tem data-testid no DOM atual do site
    produto: ".card",
  },
  input: {
    pesquisar: '[data-testid="pesquisar"]',
  },
  button: {
    pesquisar: '[data-testid="botaoPesquisar"]',
    adicionarNaLista: '[data-testid="adicionarNaLista"]', // botão do card, hoje leva à Lista de Compras (não ao carrinho direto)
  },
  link: {
    listaDeCompras: '[data-testid="lista-de-compras"]',
    logout: '[data-testid="logout"]', // usado com cy.get(...)
  },
};
