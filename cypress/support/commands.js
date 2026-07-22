import { loginSelectors } from "../selectors/login.selectors";
import { cadastroUsuarioSelectors } from "../selectors/cadastroUsuario.selectors";
import { homeSelectors } from "../selectors/home.selectors";
import { adminSelectors } from "../selectors/admin.selectors";

const apiUrl = Cypress.env("apiUrl");

Cypress.Commands.add("apiCriarUsuario", (usuario) => {
  return cy
    .request({
      method: "POST",
      url: `${apiUrl}/usuarios`,
      body: usuario,
      failOnStatusCode: false,
    })
    .then((response) => {
      expect(response.status).to.be.oneOf([201, 400]); // 400 se e-mail já existir
      return response;
    });
});

Cypress.Commands.add("apiLogin", (email, password) => {
  return cy
    .request({
      method: "POST",
      url: `${apiUrl}/login`,
      body: { email, password },
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      return response.body.authorization;
    });
});

// token precisa ser de um usuário administrador
Cypress.Commands.add("apiCriarProduto", (produto, token) => {
  return cy
    .request({
      method: "POST",
      url: `${apiUrl}/produtos`,
      headers: { Authorization: token },
      body: produto,
    })
    .then((response) => {
      expect(response.status).to.eq(201);
      return response;
    });
});

Cypress.Commands.add("apiCriarCarrinho", (token, produtos) => {
  return cy
    .request({
      method: "POST",
      url: `${apiUrl}/carrinhos`,
      headers: { Authorization: token },
      body: { produtos },
    })
    .then((response) => {
      expect(response.status).to.eq(201);
      return response;
    });
});

Cypress.Commands.add("apiCriarUsuarioELogar", (usuario) => {
  return cy.apiCriarUsuario(usuario).then(() => cy.apiLogin(usuario.email, usuario.password));
});

Cypress.Commands.add("apiCancelarCompra", (token) => {
  return cy.request({
    method: "DELETE",
    url: `${apiUrl}/carrinhos/cancelar-compra`,
    headers: { Authorization: token },
  });
});

Cypress.Commands.add("apiPrimeiroProdutoId", () => {
  return cy.request("GET", `${apiUrl}/produtos`).its("body.produtos.0._id");
});

Cypress.Commands.add("apiExcluirUsuario", (idUsuario) => {
  return cy.request("DELETE", `${apiUrl}/usuarios/${idUsuario}`);
});

Cypress.Commands.add("apiExcluirProduto", (idProduto, token) => {
  return cy.request({
    method: "DELETE",
    url: `${apiUrl}/produtos/${idProduto}`,
    headers: { Authorization: token },
  });
});

Cypress.Commands.add("preencherLogin", (email, password) => {
  cy.visit("/login");
  cy.get(loginSelectors.input.email).type(email);
  cy.get(loginSelectors.input.senha).type(password, { log: false });
  cy.get(loginSelectors.button.entrar).click();
});

Cypress.Commands.add("preencherCadastro", (usuario) => {
  cy.visit("/cadastrarusuarios");
  cy.get(cadastroUsuarioSelectors.input.nome).type(usuario.nome);
  cy.get(cadastroUsuarioSelectors.input.email).type(usuario.email);
  cy.get(cadastroUsuarioSelectors.input.senha).type(usuario.password);
  cy.get(cadastroUsuarioSelectors.button.cadastrar).click();
});

Cypress.Commands.add("preencherProduto", (produto) => {
  cy.get(adminSelectors.produto.input.nome).type(produto.nome);
  cy.get(adminSelectors.produto.input.preco).type(produto.preco);
  cy.get(adminSelectors.produto.input.descricao).type(produto.descricao);
  cy.get(adminSelectors.produto.input.quantidade).type(produto.quantidade);
  cy.get(adminSelectors.produto.button.cadastrar).click();
});

Cypress.Commands.add("excluirProdutoAdmin", (nomeProduto) => {
  cy.contains("tr", nomeProduto).within(() => {
    cy.contains("button", "Excluir").click();
  });
  cy.contains("tr", nomeProduto).should("not.exist");
});

Cypress.Commands.add("pesquisarProduto", (nome) => {
  cy.get(homeSelectors.input.pesquisar).clear().type(nome);
  cy.get(homeSelectors.button.pesquisar).click();
});

// Não usar em specs que testam o próprio login - só como pré-requisito de outro fluxo
Cypress.Commands.add("uiLogin", (email, password) => {
  cy.session(
    [email, password],
    () => {
      cy.preencherLogin(email, password);
      cy.location("pathname").should("not.eq", "/login");
    },
    {
      validate() {
        cy.window().its("localStorage").invoke("getItem", "serverest/userToken").should("exist");
      },
    }
  );
});
