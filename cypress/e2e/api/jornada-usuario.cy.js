import { gerarUsuario } from "../../support/dataGenerator";

const apiUrl = Cypress.env("apiUrl");

describe("API - Jornada do usuário", () => {
  it("cadastra, loga, edita o perfil, desiste de um carrinho e conclui outro, depois exclui a própria conta", () => {
    const usuario = gerarUsuario();
    let idUsuario;
    let token;
    let idProdutoA;
    let idProdutoB;
    let idCarrinho;

    cy.request("POST", `${apiUrl}/usuarios`, usuario).then((resp) => {
      expect(resp.status).to.eq(201);
      expect(resp.body.message).to.eq("Cadastro realizado com sucesso");
      idUsuario = resp.body._id;
    });

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

    cy.then(() => {
      cy.request("GET", `${apiUrl}/usuarios?email=${usuario.email}`).then((resp) => {
        expect(resp.body.usuarios).to.have.length(1);
        expect(resp.body.usuarios[0]._id).to.eq(idUsuario);
      });
    });

    cy.then(() => {
      cy.request("GET", `${apiUrl}/usuarios/${idUsuario}`).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body.nome).to.eq(usuario.nome);
      });
    });

    cy.then(() => {
      cy.request("PUT", `${apiUrl}/usuarios/${idUsuario}`, {
        ...usuario,
        nome: "Nome Atualizado via Jornada",
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body.message).to.eq("Registro alterado com sucesso");
      });
    });

    cy.then(() => {
      cy.request("GET", `${apiUrl}/produtos`).then((resp) => {
        idProdutoA = resp.body.produtos[0]._id;
        idProdutoB = resp.body.produtos[1]._id;
      });
    });

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

    cy.then(() => {
      cy.request("GET", `${apiUrl}/carrinhos`).then((resp) => {
        const meuCarrinho = resp.body.carrinhos.find((c) => c.idUsuario === idUsuario);
        expect(meuCarrinho).to.exist;
      });
    });

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

    cy.then(() => {
      cy.request("GET", `${apiUrl}/carrinhos/${idCarrinho}`).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body.produtos[0].idProduto).to.eq(idProdutoB);
      });
    });

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

    cy.then(() => {
      cy.request("DELETE", `${apiUrl}/usuarios/${idUsuario}`).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body.message).to.eq("Registro excluído com sucesso");
      });
    });
  });
});
