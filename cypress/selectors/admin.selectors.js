/**
 * Seletores da área administrativa (/admin/*).
 * Usuários com administrador:"true" caem em /admin/home ao logar,
 * um layout totalmente separado do usuário comum, com CRUD de produtos,
 * usuários e relatórios.
 */
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
      cadastrar: '[data-testid="cadastarProdutos"]', // typo é do próprio site, confirmado no DOM
    },
    // A tabela de produtos/usuários não tem data-testid nas linhas/botões de
    // ação (Editar/Excluir); usamos cy.contains('tr', <valor único>) para
    // escopar a linha certa em meio a uma base compartilhada com centenas
    // de registros de outros usuários/execuções.
  },
};
