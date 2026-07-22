import { gerarUsuario } from "../../support/dataGenerator";
import { homeSelectors as home } from "../../selectors/home.selectors";
import { adminSelectors as admin } from "../../selectors/admin.selectors";

// Jornada exclusiva do administrador: usuários com administrador:"true"
// caem em uma área própria (/admin/*), com CRUD de produtos/usuários -
// bem mais rica que a jornada do usuário comum.
describe("Jornada do administrador", () => {
  it("loga como administrador, cadastra um produto, confirma na listagem, o exclui e desloga", () => {
    const admUsuario = gerarUsuario({ administrador: "true" });
    cy.apiCriarUsuario(admUsuario);

    cy.preencherLogin(admUsuario.email, admUsuario.password);

    // Administrador é redirecionado para uma área distinta da Home comum
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

    // Cadastro redireciona para a listagem, onde o produto deve aparecer
    cy.location("pathname").should("eq", "/admin/listarprodutos");
    cy.contains("tr", nomeProduto).should("be.visible");

    // Exclui o produto recém-criado e confirma que ele some da listagem
    cy.excluirProdutoAdmin(nomeProduto);

    cy.get(admin.nav.logout).click();
    cy.location("pathname").should("eq", "/login");
  });

  it("cadastra dois produtos e exclui um; o usuário normal confirma o catálogo coerente ao pesquisar", () => {
    // Jornada começa e é conduzida pelo admin (cadastro/exclusão de
    // produtos é ação exclusiva dele); o usuário normal entra só para
    // confirmar que o resultado da ação do admin é visível no catálogo -
    // por isso mora aqui, e não num arquivo à parte.
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

    // Usuário normal confirma que o catálogo reflete a mudança do admin
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
