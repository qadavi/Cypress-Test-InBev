import { gerarUsuario } from "../../support/dataGenerator";
import { homeSelectors as home } from "../../selectors/home.selectors";
import { adminSelectors as admin } from "../../selectors/admin.selectors";

describe("Jornada do administrador", () => {
  it("loga como administrador, cadastra um produto, confirma na listagem, o exclui e desloga", () => {
    const admUsuario = gerarUsuario({ administrador: "true" });
    cy.apiCriarUsuario(admUsuario);

    cy.preencherLogin(admUsuario.email, admUsuario.password);
    cy.location("pathname").should("eq", "/admin/home");

    const nomeProduto = `Produto Cypress ${Date.now()}`;
    cy.get(admin.nav.cadastrarProdutos).click();
    cy.location("pathname").should("eq", "/admin/cadastrarprodutos");
    cy.preencherProduto({
      nome: nomeProduto,
      preco: "199",
      descricao: "Produto criado por teste E2E",
      quantidade: "5",
    });

    cy.location("pathname").should("eq", "/admin/listarprodutos");
    cy.contains("tr", nomeProduto).should("be.visible");

    cy.excluirProdutoAdmin(nomeProduto);

    cy.get(admin.nav.logout).click();
    cy.location("pathname").should("eq", "/login");
  });

  it("cadastra dois produtos e exclui um; o usuário normal confirma o catálogo coerente ao pesquisar", () => {
    const admUsuario = gerarUsuario({ administrador: "true" });
    cy.apiCriarUsuario(admUsuario);

    const produtoMantido = `Produto Mantido ${Date.now()}`;
    const produtoExcluido = `Produto Excluido ${Date.now()}`;

    cy.preencherLogin(admUsuario.email, admUsuario.password);
    cy.location("pathname").should("eq", "/admin/home");

    [produtoMantido, produtoExcluido].forEach((nome) => {
      cy.get(admin.nav.cadastrarProdutos).click();
      cy.location("pathname").should("eq", "/admin/cadastrarprodutos");
      cy.preencherProduto({
        nome,
        preco: "100",
        descricao: "Produto de teste de integração admin x usuário",
        quantidade: "1",
      });
      cy.location("pathname").should("eq", "/admin/listarprodutos");
      cy.contains("tr", nome).should("be.visible");
    });

    cy.excluirProdutoAdmin(produtoExcluido);
    cy.contains("tr", produtoMantido).should("be.visible");

    cy.get(admin.nav.logout).click();
    cy.location("pathname").should("eq", "/login");

    const usuarioNormal = gerarUsuario();
    cy.apiCriarUsuario(usuarioNormal);

    cy.preencherLogin(usuarioNormal.email, usuarioNormal.password);
    cy.location("pathname").should("eq", "/home");

    cy.pesquisarProduto(produtoMantido);
    cy.contains(home.card.produto, produtoMantido).should("be.visible");

    cy.pesquisarProduto(produtoExcluido);
    cy.contains(home.card.produto, produtoExcluido).should("not.exist");

    cy.get(home.link.logout).click();
    cy.location("pathname").should("eq", "/login");
  });
});
