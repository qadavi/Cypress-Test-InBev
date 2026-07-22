// ***********************************************************
// App Actions
//
// Usados APENAS para configurações complexas/repetidas (setup),
// nunca para substituir a interação que está sendo validada pelo
// teste em si. Ex.: "logar para poder testar o carrinho" -> App Action.
// "testar se o login funciona" -> interação direta no spec, com
// comandos padrão do Cypress (cy.get/cy.contains), usando os
// seletores centralizados em cypress/selectors/.
//
// Boas práticas aplicadas (docs.cypress.io):
//  - Preferir setup de estado via API em vez de UI (mais rápido/estável)
//  - Usar cy.session para cachear login e evitar repetir o fluxo na UI
// ***********************************************************

import { loginSelectors } from "../selectors/login.selectors";
import { cadastroUsuarioSelectors } from "../selectors/cadastroUsuario.selectors";
import { homeSelectors } from "../selectors/home.selectors";
import { adminSelectors } from "../selectors/admin.selectors";

const apiUrl = Cypress.env("apiUrl");

/**
 * App Action: cria um usuário direto na API (mais rápido e estável
 * que preencher o formulário de cadastro na UI).
 * Retorna o corpo da resposta (contém o _id do usuário criado).
 */
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

/**
 * App Action: autentica na API e retorna o token JWT.
 */
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

/**
 * App Action: cria um produto direto na API (usuário do token precisa
 * ser administrador). Retorna a resposta completa (contém o _id).
 */
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

/**
 * App Action: cria um carrinho direto na API para o usuário autenticado
 * pelo token informado. Retorna a resposta completa (contém o _id).
 */
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

/**
 * Visita /login e submete o formulário. Não faz asserção de resultado -
 * fica a cargo de quem chama, já que o destino esperado varia (Home,
 * área admin, ou permanecer em /login em casos negativos). Encapsula os
 * passos que se repetem em quase todo spec de UI.
 */
Cypress.Commands.add("preencherLogin", (email, password) => {
  cy.visit("/login");
  cy.get(loginSelectors.input.email).type(email);
  cy.get(loginSelectors.input.senha).type(password, { log: false });
  cy.get(loginSelectors.button.entrar).click();
});

/**
 * Visita /cadastrarusuarios e submete o formulário. Mesma ideia do
 * preencherLogin: só os passos repetidos, sem asserção.
 */
Cypress.Commands.add("preencherCadastro", (usuario) => {
  cy.visit("/cadastrarusuarios");
  cy.get(cadastroUsuarioSelectors.input.nome).type(usuario.nome);
  cy.get(cadastroUsuarioSelectors.input.email).type(usuario.email);
  cy.get(cadastroUsuarioSelectors.input.senha).type(usuario.password);
  cy.get(cadastroUsuarioSelectors.button.cadastrar).click();
});

/**
 * Preenche e submete o formulário de cadastro de produto (admin). Não
 * faz a navegação até a tela - varia entre os specs (clicar no link do
 * menu vs. cy.visit direto) e essa diferença costuma ser parte do que
 * está sob teste, então fica a cargo de quem chama.
 */
Cypress.Commands.add("preencherProduto", (produto) => {
  cy.get(adminSelectors.produto.input.nome).type(produto.nome);
  cy.get(adminSelectors.produto.input.preco).type(produto.preco);
  cy.get(adminSelectors.produto.input.descricao).type(produto.descricao);
  cy.get(adminSelectors.produto.input.quantidade).type(produto.quantidade);
  cy.get(adminSelectors.produto.button.cadastrar).click();
});

/**
 * Exclui um produto pela linha na listagem do admin (nome único na
 * tabela) e confirma que ele some - ação e verificação sempre andam
 * juntas nesse fluxo, por isso ficam num único comando.
 */
Cypress.Commands.add("excluirProdutoAdmin", (nomeProduto) => {
  cy.contains("tr", nomeProduto).within(() => {
    cy.contains("button", "Excluir").click();
  });
  cy.contains("tr", nomeProduto).should("not.exist");
});

/**
 * Pesquisa um produto na Home (campo + botão "Pesquisar").
 */
Cypress.Commands.add("pesquisarProduto", (nome) => {
  cy.get(homeSelectors.input.pesquisar).clear().type(nome);
  cy.get(homeSelectors.button.pesquisar).click();
});

/**
 * App Action: login via UI, usando cy.session para cachear a sessão
 * entre testes. Só deve ser usado quando o login é pré-requisito de
 * outra funcionalidade (ex.: carrinho), nunca nos specs que testam
 * o próprio login.
 */
Cypress.Commands.add("uiLogin", (email, password) => {
  cy.session(
    [email, password],
    () => {
      cy.preencherLogin(email, password);
      cy.location("pathname").should("not.eq", "/login");
    },
    {
      validate() {
        // valida se a sessão ainda é válida checando o localStorage do app
        cy.window().its("localStorage").invoke("getItem", "serverest/userToken").should("exist");
      },
    }
  );
});
