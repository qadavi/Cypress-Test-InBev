import { gerarUsuario } from "../../support/dataGenerator";

const apiUrl = Cypress.env("apiUrl");

// Fluxo contínuo de um usuário comum via API, narrado como uma sessão
// real (mesmo espírito dos specs de UI em cypress/e2e/ui/): cadastro,
// login, gerenciamento do próprio perfil, um carrinho que é montado e
// cancelado, e um segundo que é de fato concluído.
describe("API - Jornada do usuário", () => {
  it("cadastra, loga, edita o perfil, desiste de um carrinho e conclui outro, depois exclui a própria conta", () => {
    const usuario = gerarUsuario();
    let idUsuario;
    let token;
    let idProdutoA;
    let idProdutoB;
    let idCarrinho;

    // POST /usuarios - cadastro
    cy.request("POST", `${apiUrl}/usuarios`, usuario).then((resp) => {
      expect(resp.status).to.eq(201);
      expect(resp.body.message).to.eq("Cadastro realizado com sucesso");
      idUsuario = resp.body._id;
    });

    // POST /login
    cy.then(() => {
      cy.request("POST", `${apiUrl}/login`, {
        email: usuario.email,
        password: usuario.password,
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body.authorization).to.match(/^Bearer\s.+/);
        token = resp.body.authorization;
      });
    });

    // GET /usuarios - confirma que o cadastro aparece na listagem
    cy.then(() => {
      cy.request("GET", `${apiUrl}/usuarios?email=${usuario.email}`).then((resp) => {
        expect(resp.body.usuarios).to.have.length(1);
        expect(resp.body.usuarios[0]._id).to.eq(idUsuario);
      });
    });

    // GET /usuarios/{id} - consulta o próprio perfil
    cy.then(() => {
      cy.request("GET", `${apiUrl}/usuarios/${idUsuario}`).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body.nome).to.eq(usuario.nome);
      });
    });

    // PUT /usuarios/{id} - edita o nome
    cy.then(() => {
      cy.request("PUT", `${apiUrl}/usuarios/${idUsuario}`, {
        ...usuario,
        nome: "Nome Atualizado via Jornada",
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body.message).to.eq("Registro alterado com sucesso");
      });
    });

    // GET /produtos - escolhe 2 produtos reais do catálogo
    cy.then(() => {
      cy.request("GET", `${apiUrl}/produtos`).then((resp) => {
        idProdutoA = resp.body.produtos[0]._id;
        idProdutoB = resp.body.produtos[1]._id;
      });
    });

    // POST /carrinhos - monta um carrinho...
    cy.then(() => {
      cy.request({
        method: "POST",
        url: `${apiUrl}/carrinhos`,
        headers: { Authorization: token },
        body: { produtos: [{ idProduto: idProdutoA, quantidade: 1 }] },
      }).then((resp) => {
        expect(resp.status).to.eq(201);
      });
    });

    // GET /carrinhos - confirma que aparece na listagem geral
    cy.then(() => {
      cy.request("GET", `${apiUrl}/carrinhos`).then((resp) => {
        const meuCarrinho = resp.body.carrinhos.find((c) => c.idUsuario === idUsuario);
        expect(meuCarrinho).to.exist;
      });
    });

    // DELETE /carrinhos/cancelar-compra - ...mas desiste e cancela
    cy.then(() => {
      cy.request({
        method: "DELETE",
        url: `${apiUrl}/carrinhos/cancelar-compra`,
        headers: { Authorization: token },
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body.message).to.eq(
          "Registro excluído com sucesso. Estoque dos produtos reabastecido"
        );
      });
    });

    // POST /carrinhos - reconsidera e monta outro carrinho
    cy.then(() => {
      cy.request({
        method: "POST",
        url: `${apiUrl}/carrinhos`,
        headers: { Authorization: token },
        body: { produtos: [{ idProduto: idProdutoB, quantidade: 1 }] },
      }).then((resp) => {
        idCarrinho = resp.body._id;
      });
    });

    // GET /carrinhos/{id} - confere o carrinho antes de fechar a compra
    cy.then(() => {
      cy.request("GET", `${apiUrl}/carrinhos/${idCarrinho}`).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body.produtos[0].idProduto).to.eq(idProdutoB);
      });
    });

    // DELETE /carrinhos/concluir-compra - desta vez finaliza a compra
    cy.then(() => {
      cy.request({
        method: "DELETE",
        url: `${apiUrl}/carrinhos/concluir-compra`,
        headers: { Authorization: token },
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body.message).to.eq("Registro excluído com sucesso");
      });
    });

    // DELETE /usuarios/{id} - encerra a conta (sem carrinho pendente, agora é permitido)
    cy.then(() => {
      cy.request("DELETE", `${apiUrl}/usuarios/${idUsuario}`).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body.message).to.eq("Registro excluído com sucesso");
      });
    });
  });
});
