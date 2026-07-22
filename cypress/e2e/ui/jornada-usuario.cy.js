import { gerarUsuario } from "../../support/dataGenerator";
import { homeSelectors as home } from "../../selectors/home.selectors";
import { listaComprasSelectors as lista } from "../../selectors/listaCompras.selectors";

// Jornada completa do usuário comum, narrada como uma sessão real:
// um visitante novo se cadastra (primeiro acesso), usa o site, desloga,
// e depois retorna e loga normalmente (já cadastrado) para concluir a
// compra - em vez de várias jornadas soltas e desconectadas.
//
// No site atual, "comprar" não é mais uma ação direta: o produto vai
// primeiro para a "Lista de Compras" (/minhaListaDeProdutos), e só de lá
// é enviado ao carrinho (/carrinho, hoje apenas um placeholder "em
// construção" sem conteúdo renderizado).
describe("Jornada do usuário normal", () => {
  it("acessa a plataforma pela primeira vez (cadastro), usa a lista de compras, desloga, retorna (login) e conclui a compra", () => {
    const usuario = gerarUsuario();

    // --- Primeiro acesso: cadastro ---
    cy.preencherCadastro(usuario);

    // ServeRest loga automaticamente após o cadastro e redireciona para a Home
    cy.contains(/Cadastro realizado com sucesso/i).should("be.visible");
    cy.location("pathname").should("eq", "/home");

    cy.pesquisarProduto("Logitech");
    cy.get(home.card.produto)
      .should("have.length", 1)
      .first()
      .within(() => {
        cy.get(home.button.adicionarNaLista).click();
      });

    cy.get(home.link.listaDeCompras).click();
    cy.location("pathname").should("eq", "/minhaListaDeProdutos");
    cy.get(lista.product.nome).should("contain.text", "Logitech");

    // Encerra a primeira sessão (visitante ainda não tinha conta antes disso)
    cy.get(home.link.logout).click();
    cy.location("pathname").should("eq", "/login");

    // --- Retorno: agora já cadastrado, loga normalmente para concluir a compra ---
    cy.preencherLogin(usuario.email, usuario.password);
    cy.location("pathname").should("eq", "/home");

    // Produtos reais via API em vez de nomes fixos no código: a Home é um
    // ambiente compartilhado/público, então o catálogo pode mudar - isso
    // evita depender de um produto específico existir para sempre.
    cy.request(`${Cypress.env("apiUrl")}/produtos`).then(({ body }) => {
      const [produtoA, produtoB] = body.produtos;

      // Comportamento confirmado do app: logout limpa a lista de compras
      // (não persiste entre sessões), então o usuário monta a lista de novo -
      // desta vez com dois produtos diferentes.
      cy.contains(home.card.produto, produtoA.nome).within(() => {
        cy.get(home.button.adicionarNaLista).click();
      });
      cy.visit("/home");
      cy.contains(home.card.produto, produtoB.nome).within(() => {
        cy.get(home.button.adicionarNaLista).click();
      });
      cy.location("pathname").should("eq", "/minhaListaDeProdutos");

      // Escopo por índice usando só data-testid, sem depender de classe
      // CSS (.card.col-3 não tem nenhum atributo próprio no DOM) - a
      // ordem de renderização acompanha a ordem de inserção, confirmado
      // manualmente comparando as listas de nome/quantidade/botões.
      cy.get(lista.product.nome).eq(0).should("contain.text", produtoA.nome);
      cy.get(lista.product.nome).eq(1).should("contain.text", produtoB.nome);

      // Aumenta a quantidade do primeiro produto e confirma que o segundo
      // não foi afetado
      cy.get(lista.button.aumentarQuantidade).eq(0).click();
      cy.get(lista.product.quantidade).eq(0).should("contain.text", "Total: 2");
      cy.get(lista.product.quantidade).eq(1).should("contain.text", "Total: 1");

      // Comportamento confirmado do app: reduzir abaixo de 1 não remove o
      // item nem zera a quantidade, apenas trava em 1.
      cy.get(lista.button.diminuirQuantidade).eq(1).click();
      cy.get(lista.product.quantidade).eq(1).should("contain.text", "Total: 1");
    });

    // Envia a lista para o carrinho e desloga
    cy.get(lista.button.adicionarCarrinho).click();
    cy.location("pathname").should("eq", "/carrinho");

    cy.get(home.link.logout).click();
    cy.location("pathname").should("eq", "/login");
  });
});
