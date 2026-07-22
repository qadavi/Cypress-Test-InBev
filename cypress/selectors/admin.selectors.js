// Usuários com administrador:"true" caem em /admin/home ao logar,
// um layout separado do usuário comum.
export const adminSelectors = {
  nav: {
    cadastrarProdutos: '[data-testid="cadastrar-produtos"]',
    logout: '[data-testid="logout"]',
  },
  produto: {
    input: {
      nome: '[data-testid="nome"]',
      preco: '[data-testid="preco"]',
      descricao: '[data-testid="descricao"]',
      quantidade: '[data-testid="quantity"]',
    },
    button: {
      cadastrar: '[data-testid="cadastarProdutos"]', // typo é do próprio site
    },
  },
};
