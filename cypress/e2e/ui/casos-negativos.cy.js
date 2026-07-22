import { gerarUsuario } from "../../support/dataGenerator";
import { cadastroUsuarioSelectors as cadastroSel } from "../../selectors/cadastroUsuario.selectors";

// Casos alternativos/negativos: cada teste é atômico (uma condição, uma
// asserção), diferente dos arquivos "jornada-*" que encadeiam vários
// passos de um fluxo real - inclui tanto negativos de login/acesso quanto
// de cadastro, para não diluir o propósito de cada arquivo.
describe("Casos alternativos e negativos", () => {
  it("não deve cadastrar com um e-mail já utilizado", () => {
    const usuario = gerarUsuario();
    // App Action: setup de estado via API (mais rápido/estável que
    // repetir a UI) - a interação sob teste aqui é o formulário, não
    // a criação prévia do usuário duplicado.
    cy.apiCriarUsuario(usuario);
    cy.preencherCadastro(usuario);

    cy.contains(/Este email já está sendo usado/i).should("be.visible");
  });

  it("não deve cadastrar com campos obrigatórios vazios", () => {
    cy.visit("/cadastrarusuarios");
    cy.get(cadastroSel.button.cadastrar).click();

    // O formulário não deve navegar para outra rota sem os dados obrigatórios
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

  it("usuário comum consegue abrir a tela de administração, mas a API bloqueia a ação exclusiva de admin", () => {
    // A navegação /admin/* não é escondida por papel no front (qualquer
    // usuário autenticado acessa a tela), mas o back-end rejeita a ação
    // com uma mensagem clara - comportamento confirmado manualmente.
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
