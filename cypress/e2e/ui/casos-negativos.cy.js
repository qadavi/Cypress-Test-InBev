import { gerarUsuario } from "../../support/dataGenerator";
import { cadastroUsuarioSelectors as cadastroSel } from "../../selectors/cadastroUsuario.selectors";

describe("Casos alternativos e negativos", () => {
  it("não deve cadastrar com um e-mail já utilizado", () => {
    const usuario = gerarUsuario();
    cy.apiCriarUsuario(usuario);
    cy.preencherCadastro(usuario);

    cy.contains(/Este email já está sendo usado/i).should("be.visible");
  });

  it("não deve cadastrar com campos obrigatórios vazios", () => {
    cy.visit("/cadastrarusuarios");
    cy.get(cadastroSel.button.cadastrar).click();

    cy.location("pathname").should("eq", "/cadastrarusuarios");
  });

  it("não deve logar com um e-mail não cadastrado", () => {
    cy.preencherLogin(`nao.existe.${Date.now()}@teste.com`, "QualquerSenha@123");

    cy.contains(/Email e\/ou senha inválidos/i).should("be.visible");
    cy.location("pathname").should("eq", "/login");
  });

  it("não deve acessar rotas protegidas sem estar autenticado - deve redirecionar para /login", () => {
    cy.visit("/home");
    cy.location("pathname").should("eq", "/login");

    cy.visit("/admin/home");
    cy.location("pathname").should("eq", "/login");
  });

  // A UI não esconde /admin/* de usuários comuns; só a API bloqueia a ação
  it("usuário comum consegue abrir a tela de administração, mas a API bloqueia a ação exclusiva de admin", () => {
    const usuario = gerarUsuario();
    cy.apiCriarUsuario(usuario);

    cy.preencherLogin(usuario.email, usuario.password);
    cy.location("pathname").should("eq", "/home");

    cy.visit("/admin/cadastrarprodutos");
    cy.preencherProduto({
      nome: "Produto que não deveria ser criado",
      preco: "50",
      descricao: "Tentativa de usuário comum",
      quantidade: "1",
    });

    cy.contains(/Rota exclusiva para administradores/i).should("be.visible");
  });
});
