export const listaComprasSelectors = {
  product: {
    nome: '[data-testid="shopping-cart-product-name"]',
    quantidade: '[data-testid="shopping-cart-product-quantity"]',
  },
  button: {
    aumentarQuantidade: '[data-testid="product-increase-quantity"]',
    diminuirQuantidade: '[data-testid="product-decrease-quantity"]',
    adicionarCarrinho: '[data-testid="adicionar carrinho"]', // espaço no testid é assim mesmo no DOM
  },
};
