import { gerarUsuario } from "../../support/dataGenerator";
import { faker } from "@faker-js/faker";

const apiUrl = Cypress.env("apiUrl");

function gerarProduto(overrides = {}) {
  return {
    nome: `Produto Cypress ${Date.now()}.${faker.string.alphanumeric(6)}`,
    preco: faker.number.int({ min: 10, max: 500 }),
    descricao: "Produto criado via teste automatizado de API",
    quantidade: faker.number.int({ min: 1, max: 100 }),
    ...overrides,
  };
}

// Casos alternativos/negativos da API: cada teste é atômico (uma
// condição, uma asserção), mesmo espírito de cypress/e2e/ui/casos-negativos.cy.js -
// os fluxos de "caminho feliz" já ficam nas jornadas de usuário/admin.
describe("API - Casos negativos", () => {
  it("não deve autenticar com senha incorreta e deve retornar 401 (POST /login)", () => {
    const usuario = gerarUsuario();
    cy.apiCriarUsuario(usuario);

    cy.request({
      method: "POST",
      url: `${apiUrl}/login`,
      body: { email: usuario.email, password: "SenhaIncorreta@123" },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.eq("Email e/ou senha inválidos");
    });
  });

  it("não deve autenticar com e-mail em formato inválido e deve retornar 400 (POST /login)", () => {
    cy.request({
      method: "POST",
      url: `${apiUrl}/login`,
      body: { email: "email-sem-arroba.com", password: "qualquerSenha123" },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.email).to.include("email deve ser um email válido");
    });
  });

  it("não deve permitir cadastrar dois usuários com o mesmo e-mail (POST /usuarios)", () => {
    const usuario = gerarUsuario();

    cy.request("POST", `${apiUrl}/usuarios`, usuario).then((primeiraResp) => {
      cy.request({
        method: "POST",
        url: `${apiUrl}/usuarios`,
        body: usuario,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.message).to.eq("Este email já está sendo usado");
      });

      cy.request("DELETE", `${apiUrl}/usuarios/${primeiraResp.body._id}`);
    });
  });

  it("não deve encontrar um usuário com ID inexistente e deve retornar 400 (GET /usuarios/{id})", () => {
    // IDs válidos têm exatamente 16 caracteres alfanuméricos - um ID
    // com outro tamanho cai num erro de formato diferente ("id deve
    // ter exatamente 16 caracteres"), não no "não encontrado".
    cy.request({
      method: "GET",
      url: `${apiUrl}/usuarios/a1b2c3d4e5f6g7h8`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.eq("Usuário não encontrado");
    });
  });

  it("não deve permitir editar um usuário para um e-mail já usado por outro (PUT /usuarios/{id})", () => {
    const usuarioA = gerarUsuario();
    const usuarioB = gerarUsuario();

    cy.apiCriarUsuario(usuarioA);
    cy.request("POST", `${apiUrl}/usuarios`, usuarioB).then((respB) => {
      cy.request({
        method: "PUT",
        url: `${apiUrl}/usuarios/${respB.body._id}`,
        body: { ...usuarioB, email: usuarioA.email },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.message).to.eq("Este email já está sendo usado");
      });

      cy.request("DELETE", `${apiUrl}/usuarios/${respB.body._id}`);
    });
  });

  it("não deve excluir um usuário com carrinho cadastrado (DELETE /usuarios/{id})", () => {
    const usuario = gerarUsuario();
    cy.apiCriarUsuario(usuario);

    cy.apiLogin(usuario.email, usuario.password).then((token) => {
      cy.request("GET", `${apiUrl}/produtos`)
        .its("body.produtos.0._id")
        .then((idProduto) => {
          cy.apiCriarCarrinho(token, [{ idProduto, quantidade: 1 }]).then(() => {
            cy.request("GET", `${apiUrl}/usuarios?email=${usuario.email}`)
              .its("body.usuarios.0._id")
              .then((idUsuario) => {
                cy.request({
                  method: "DELETE",
                  url: `${apiUrl}/usuarios/${idUsuario}`,
                  failOnStatusCode: false,
                }).then((response) => {
                  expect(response.status).to.eq(400);
                  expect(response.body.message).to.eq(
                    "Não é permitido excluir usuário com carrinho cadastrado"
                  );
                });

                // Limpeza: cancela o carrinho e então exclui o usuário
                cy.request({
                  method: "DELETE",
                  url: `${apiUrl}/carrinhos/cancelar-compra`,
                  headers: { Authorization: token },
                });
                cy.request("DELETE", `${apiUrl}/usuarios/${idUsuario}`);
              });
          });
        });
    });
  });

  it("deve retornar 'Nenhum registro excluído' para um usuário com ID inexistente (DELETE /usuarios/{id})", () => {
    cy.request("DELETE", `${apiUrl}/usuarios/idQueNaoExiste123`).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.message).to.eq("Nenhum registro excluído");
    });
  });

  it("não deve encontrar um produto com ID inexistente e deve retornar 400 (GET /produtos/{id})", () => {
    cy.request({
      method: "GET",
      url: `${apiUrl}/produtos/a1b2c3d4e5f6g7h8`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.eq("Produto não encontrado");
    });
  });

  it("não deve permitir criar produto sem autenticação (POST /produtos)", () => {
    cy.request({
      method: "POST",
      url: `${apiUrl}/produtos`,
      body: gerarProduto(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.eq(
        "Token de acesso ausente, inválido, expirado ou usuário do token não existe mais"
      );
    });
  });

  it("não deve permitir criar produto para usuário autenticado que não é administrador (POST /produtos)", () => {
    const usuarioComum = gerarUsuario({ administrador: "false" });
    cy.apiCriarUsuario(usuarioComum);

    cy.apiLogin(usuarioComum.email, usuarioComum.password).then((token) => {
      cy.request({
        method: "POST",
        url: `${apiUrl}/produtos`,
        headers: { Authorization: token },
        body: gerarProduto(),
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body.message).to.eq("Rota exclusiva para administradores");
      });
    });
  });

  it("não deve permitir cadastrar produto com nome já utilizado (POST /produtos)", () => {
    const admin = gerarUsuario({ administrador: "true" });
    cy.apiCriarUsuario(admin);

    cy.apiLogin(admin.email, admin.password).then((token) => {
      const produto = gerarProduto();

      cy.apiCriarProduto(produto, token).then((criacao) => {
        cy.request({
          method: "POST",
          url: `${apiUrl}/produtos`,
          headers: { Authorization: token },
          body: produto,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(400);
          expect(response.body.message).to.eq("Já existe produto com esse nome");
        });

        cy.request({
          method: "DELETE",
          url: `${apiUrl}/produtos/${criacao.body._id}`,
          headers: { Authorization: token },
        });
      });
    });
  });

  it("não deve excluir um produto que faz parte de um carrinho (DELETE /produtos/{id})", () => {
    const admin = gerarUsuario({ administrador: "true" });
    cy.apiCriarUsuario(admin);

    cy.apiLogin(admin.email, admin.password).then((token) => {
      cy.apiCriarProduto(gerarProduto(), token).then((criacao) => {
        cy.apiCriarCarrinho(token, [{ idProduto: criacao.body._id, quantidade: 1 }]).then(() => {
          cy.request({
            method: "DELETE",
            url: `${apiUrl}/produtos/${criacao.body._id}`,
            headers: { Authorization: token },
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(400);
            expect(response.body.message).to.eq(
              "Não é permitido excluir produto que faz parte de carrinho"
            );
          });

          // Limpeza: cancela o carrinho (devolve estoque) e então exclui o produto
          cy.request({
            method: "DELETE",
            url: `${apiUrl}/carrinhos/cancelar-compra`,
            headers: { Authorization: token },
          });
          cy.request({
            method: "DELETE",
            url: `${apiUrl}/produtos/${criacao.body._id}`,
            headers: { Authorization: token },
          });
        });
      });
    });
  });

  it("não deve encontrar um carrinho com ID inexistente e deve retornar 400 (GET /carrinhos/{id})", () => {
    cy.request({
      method: "GET",
      url: `${apiUrl}/carrinhos/a1b2c3d4e5f6g7h8`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.eq("Carrinho não encontrado");
    });
  });

  it("não deve permitir mais de um carrinho por usuário (POST /carrinhos)", () => {
    const usuario = gerarUsuario();
    cy.apiCriarUsuario(usuario);

    cy.apiLogin(usuario.email, usuario.password).then((token) => {
      cy.request("GET", `${apiUrl}/produtos`)
        .its("body.produtos.0._id")
        .then((idProduto) => {
          cy.apiCriarCarrinho(token, [{ idProduto, quantidade: 1 }]).then(() => {
            cy.request({
              method: "POST",
              url: `${apiUrl}/carrinhos`,
              headers: { Authorization: token },
              body: { produtos: [{ idProduto, quantidade: 1 }] },
              failOnStatusCode: false,
            }).then((response) => {
              expect(response.status).to.eq(400);
              expect(response.body.message).to.eq("Não é permitido ter mais de 1 carrinho");
            });

            cy.request({
              method: "DELETE",
              url: `${apiUrl}/carrinhos/cancelar-compra`,
              headers: { Authorization: token },
            });
          });
        });
    });
  });

  it("não deve cadastrar carrinho com produto inexistente (POST /carrinhos)", () => {
    const usuario = gerarUsuario();
    cy.apiCriarUsuario(usuario);

    cy.apiLogin(usuario.email, usuario.password).then((token) => {
      cy.request({
        method: "POST",
        url: `${apiUrl}/carrinhos`,
        headers: { Authorization: token },
        body: { produtos: [{ idProduto: "idQueNaoExiste123", quantidade: 1 }] },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.message).to.eq("Produto não encontrado");
      });
    });
  });

  it("não deve cadastrar carrinho sem autenticação (POST /carrinhos)", () => {
    cy.request({
      method: "POST",
      url: `${apiUrl}/carrinhos`,
      body: { produtos: [{ idProduto: "idQualquer123", quantidade: 1 }] },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
    });
  });

  it("não deve concluir nem cancelar compra sem autenticação (DELETE /carrinhos/concluir-compra e /cancelar-compra)", () => {
    cy.request({
      method: "DELETE",
      url: `${apiUrl}/carrinhos/concluir-compra`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
    });

    cy.request({
      method: "DELETE",
      url: `${apiUrl}/carrinhos/cancelar-compra`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
    });
  });
});
