import { gerarUsuario } from "../../support/dataGenerator";
import { faker } from "@faker-js/faker";

const apiUrl = Cypress.env("apiUrl");

// Fluxo contínuo de um administrador via API: cadastro, login, e o CRUD
// completo de produto que só ele pode fazer.
describe("API - Jornada do administrador", () => {
  it("cadastra como admin, cadastra um produto, confere, edita, exclui, e por fim exclui a própria conta", () => {
    const admin = gerarUsuario({ administrador: "true" });
    const produto = {
      nome: `Produto Cypress ${Date.now()}.${faker.string.alphanumeric(6)}`,
      preco: faker.number.int({ min: 10, max: 500 }),
      descricao: "Produto criado via jornada de API do administrador",
      quantidade: faker.number.int({ min: 1, max: 100 }),
    };
    let idAdmin;
    let token;
    let idProduto;

    // POST /usuarios - cadastro do admin
    cy.request("POST", `${apiUrl}/usuarios`, admin).then((resp) => {
      expect(resp.status).to.eq(201);
      idAdmin = resp.body._id;
    });

    // POST /login
    cy.then(() => {
      cy.request("POST", `${apiUrl}/login`, {
        email: admin.email,
        password: admin.password,
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        token = resp.body.authorization;
      });
    });

    // POST /produtos - cadastra o produto
    cy.then(() => {
      cy.request({
        method: "POST",
        url: `${apiUrl}/produtos`,
        headers: { Authorization: token },
        body: produto,
      }).then((resp) => {
        expect(resp.status).to.eq(201);
        expect(resp.body.message).to.eq("Cadastro realizado com sucesso");
        idProduto = resp.body._id;
      });
    });

    // GET /produtos/{id} - confere o produto recém-criado
    cy.then(() => {
      cy.request("GET", `${apiUrl}/produtos/${idProduto}`).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.deep.include(produto);
      });
    });

    // PUT /produtos/{id} - edita o produto
    cy.then(() => {
      const produtoEditado = { ...produto, nome: `${produto.nome} (editado)`, preco: produto.preco + 1 };

      cy.request({
        method: "PUT",
        url: `${apiUrl}/produtos/${idProduto}`,
        headers: { Authorization: token },
        body: produtoEditado,
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body.message).to.eq("Registro alterado com sucesso");
      });
    });

    // DELETE /produtos/{id} - exclui o produto
    cy.then(() => {
      cy.request({
        method: "DELETE",
        url: `${apiUrl}/produtos/${idProduto}`,
        headers: { Authorization: token },
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body.message).to.eq("Registro excluído com sucesso");
      });
    });

    // DELETE /usuarios/{id} - encerra a conta do admin
    cy.then(() => {
      cy.request("DELETE", `${apiUrl}/usuarios/${idAdmin}`).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body.message).to.eq("Registro excluído com sucesso");
      });
    });
  });
});
