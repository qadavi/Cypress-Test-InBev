import { gerarUsuario } from "../../support/dataGenerator";
import { homeSelectors as home } from "../../selectors/home.selectors";
import { listaComprasSelectors as lista } from "../../selectors/listaCompras.selectors";

// /carrinho hoje é só um placeholder "em construção", sem conteúdo renderizado
describe("Jornada do usuário normal", () => {
  it("acessa a plataforma pela primeira vez (cadastro), usa a lista de compras, desloga, retorna (login) e conclui a compra", () => {
    const usuario = gerarUsuario();

    cy.preencherCadastro(usuario);

    // ServeRest loga automaticamente após o cadastro e redireciona para a Home
    cy.contains(/Cadastro realizado com sucesso/i).should("be.visible");
    cy.location("pathname").should("eq", "/home");

    cy.pesquisarProduto("Logitech");
    cy.get(home.card.produto)
      .should("have.length", 1)
      .first()
      .within(() => {
        cy.get(home.button.adicionarNaLista).click();
      });

    cy.get(home.link.listaDeCompras).click();
    cy.location("pathname").should("eq", "/minhaListaDeProdutos");
    cy.get(lista.product.nome).should("contain.text", "Logitech");

    cy.get(home.link.logout).click();
    cy.location("pathname").should("eq", "/login");

    cy.preencherLogin(usuario.email, usuario.password);
    cy.location("pathname").should("eq", "/home");

    // Produtos reais via API em vez de nomes fixos: catálogo compartilhado pode mudar
    cy.request(`${Cypress.env("apiUrl")}/produtos`).then(({ body }) => {
      const [produtoA, produtoB] = body.produtos;

      // Logout limpa a lista de compras (não persiste entre sessões)
      cy.contains(home.card.produto, produtoA.nome).within(() => {
        cy.get(home.button.adicionarNaLista).click();
      });
      cy.visit("/home");
      cy.contains(home.card.produto, produtoB.nome).within(() => {
        cy.get(home.button.adicionarNaLista).click();
      });
      cy.location("pathname").should("eq", "/minhaListaDeProdutos");

      // Sem data-testid no container do item, escopa por índice (mesma ordem de inserção)
      cy.get(lista.product.nome).eq(0).should("contain.text", produtoA.nome);
      cy.get(lista.product.nome).eq(1).should("contain.text", produtoB.nome);

      cy.get(lista.button.aumentarQuantidade).eq(0).click();
      cy.get(lista.product.quantidade).eq(0).should("contain.text", "Total: 2");
      cy.get(lista.product.quantidade).eq(1).should("contain.text", "Total: 1");

      // Reduzir abaixo de 1 não remove o item nem zera, só trava em 1
      cy.get(lista.button.diminuirQuantidade).eq(1).click();
      cy.get(lista.product.quantidade).eq(1).should("contain.text", "Total: 1");
    });

    cy.get(lista.button.adicionarCarrinho).click();
    cy.location("pathname").should("eq", "/carrinho");

    cy.get(home.link.logout).click();
    cy.location("pathname").should("eq", "/login");
  });
});
