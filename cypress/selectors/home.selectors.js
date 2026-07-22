export const homeSelectors = {
  card: {
    produto: ".card", // sem data-testid no DOM atual do site
  },
  input: {
    pesquisar: '[data-testid="pesquisar"]',
  },
  button: {
    pesquisar: '[data-testid="botaoPesquisar"]',
    adicionarNaLista: '[data-testid="adicionarNaLista"]', // leva à Lista de Compras, não ao carrinho direto
  },
  link: {
    listaDeCompras: '[data-testid="lista-de-compras"]',
    logout: '[data-testid="logout"]',
  },
};
