/**
 * Seletores da página /minhaListaDeProdutos (nav: "Lista de Compras")
 * Etapa intermediária do fluxo de compra no site atual: os produtos
 * ficam aqui antes de serem enviados para o carrinho.
 */
export const listaComprasSelectors = {
  product: {
    nome: '[data-testid="shopping-cart-product-name"]',
    quantidade: '[data-testid="shopping-cart-product-quantity"]',
  },
  button: {
    aumentarQuantidade: '[data-testid="product-increase-quantity"]',
    diminuirQuantidade: '[data-testid="product-decrease-quantity"]',
    adicionarCarrinho: '[data-testid="adicionar carrinho"]', // testid tem espaço mesmo, confirmado no DOM
  },
};
