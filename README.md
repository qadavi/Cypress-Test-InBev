# cypress-serverest

Suíte de automação de testes com **Cypress**, cobrindo:

- **3 cenários E2E** (UI) contra [front.serverest.dev](https://front.serverest.dev/)
- **3 cenários de API** contra [serverest.dev](https://serverest.dev/) (Swagger)

## Estrutura do projeto

```
cypress-serverest/
├── cypress.config.js          # Configuração central (baseUrl, timeouts, retries, env)
├── cypress/
│   ├── e2e/
│   │   ├── ui/                 # Cenários E2E (interface)
│   │   │   ├── cadastro-usuario.cy.js
│   │   │   ├── login.cy.js
│   │   │   └── fluxo-compra.cy.js
│   │   └── api/                # Cenários de API
│   │       ├── usuarios.cy.js
│   │       ├── login.cy.js
│   │       └── produtos.cy.js
│   ├── selectors/               # Seletores centralizados, um arquivo por página
│   │   ├── login.selectors.js
│   │   ├── cadastroUsuario.selectors.js
│   │   ├── home.selectors.js
│   │   └── carrinho.selectors.js
│   ├── fixtures/
│   │   └── usuario.json
│   └── support/
│       ├── e2e.js              # Ponto de entrada de suporte
│       ├── commands.js         # App Actions (apiLogin, uiLogin, apiCriarUsuario)
│       └── dataGenerator.js    # Massa de dados dinâmica com @faker-js/faker
└── .github/workflows/cypress.yml  # Pipeline de CI (GitHub Actions)
```

### Seletores x App Actions x lógica de teste

Esse projeto segue o modelo recomendado pelo próprio time do Cypress como
alternativa ao Page Object Model tradicional:

- **`cypress/selectors/*.selectors.js`** — só os seletores, agrupados por
  tipo de elemento (`input`, `button`, `link`, `checkbox`, `text`), um
  arquivo por página. Nenhuma lógica aqui, só strings/regex. Se o DOM
  mudar, o ajuste fica isolado neste arquivo.

  ```javascript
  export const loginSelectors = {
    input: {
      email: 'input[type="email"]',
      senha: 'input[type="password"]',
    },
    button: {
      entrar: "Entrar",
    },
  };
  ```

- **`cypress/support/commands.js` (App Actions)** — comandos customizados
  usados **somente** para configurações complexas/repetidas que não são o
  foco do teste (ex.: logar para poder testar o carrinho, criar usuário via
  API para poder testar o login). Ganham velocidade pois evitam repetir
  fluxos de UI desnecessariamente (`cy.apiCriarUsuario`, `cy.apiLogin`,
  `cy.uiLogin` com `cy.session`).

- **Dentro do `it()`** — a interação que está sendo validada usa comandos
  padrão do Cypress diretamente (`cy.get`, `cy.contains`, `.type()`,
  `.click()`), importando só os seletores necessários. Isso mantém o teste
  legível e explícito — dá para ler o `it()` e entender exatamente o que
  está sendo clicado/preenchido, sem pular para um método de Page Object.

  ```javascript
  import { loginSelectors as sel } from "../../selectors/login.selectors";

  it("deve logar com sucesso", () => {
    cy.get(sel.input.email).type(usuario.email);
    cy.get(sel.input.senha).type(usuario.password);
    cy.contains("button", sel.button.entrar).click();
    cy.location("pathname").should("eq", "/home");
  });
  ```

  Regra prática usada nos specs: se o login (ou cadastro) é o que está
  sendo testado, ele é feito com comandos diretos; se é apenas
  pré-requisito de outro fluxo (ex.: carrinho, logout), usa-se a App
  Action (`cy.uiLogin`).

## Boas práticas aplicadas (baseadas na documentação oficial do Cypress)

1. **Setup de estado via API, não via UI** — usuários usados nos testes de UI são
   criados com `cy.request` (`cy.apiCriarUsuario`), não preenchendo formulários
   repetidamente. Isso torna os testes mais rápidos e resilientes.
   https://docs.cypress.io/guides/references/best-practices#Setting-Up-State

2. **`cy.session()` para cache de login** — o comando `cy.uiLogin` usa
   `cy.session` para evitar logar via UI em todo `it()`, seguindo a
   recomendação oficial de "Login mais rápido".
   https://docs.cypress.io/guides/references/best-practices#Multiple-tests-should-not-depend-on-a-single-test

3. **Testes independentes entre si** — nenhum teste depende do estado deixado
   por outro; cada `describe` cria sua própria massa de dados.

4. **Dados dinâmicos e únicos** — uso de `@faker-js/faker` + timestamp para
   nome/e-mail, evitando colisões ao rodar a suíte várias vezes contra o
   ambiente compartilhado do ServeRest.

5. **Seletores centralizados por página** — cada página tem seu próprio
   arquivo em `cypress/selectors/`, agrupando os seletores por tipo de
   elemento. Prioriza atributos estáveis (`type`, `name`) e texto visível
   em vez de classes CSS frágeis. Ideal é migrar para atributos
   `data-cy`/`data-testid` dedicados quando se tem acesso ao código-fonte do
   front. https://docs.cypress.io/guides/references/best-practices#Selecting-Elements

6. **Retries apenas no modo `run` (CI)** — configurado em `cypress.config.js`,
   sem mascarar falhas durante o desenvolvimento local (`open`).

7. **Comandos customizados (`Cypress.Commands.add`)** para eliminar duplicação
   entre specs (`apiLogin`, `apiCriarUsuario`, `uiLogin`).

8. **Limpeza de dados (teardown)** — os testes de API que criam produtos/
   usuários fazem o `DELETE` ao final, evitando "sujar" o ambiente
   compartilhado.

9. **Sem `cy.wait(tempo fixo)`** — toda sincronização é feita por asserções
   (`should`), que fazem retry automático, nunca por espera fixa em milissegundos.

## Cenários cobertos

### E2E (UI)
| Arquivo | Cenários |
|---|---|
| `cadastro-usuario.cy.js` | Cadastro com sucesso · e-mail duplicado · validação de campos obrigatórios |
| `login.cy.js` | Login com sucesso · senha inválida · logout |
| `fluxo-compra.cy.js` | Adicionar produto ao carrinho · conferir item/valor no carrinho · esvaziar carrinho |

### API
| Arquivo | Cenários |
|---|---|
| `usuarios.cy.js` | Criar usuário (201) · consultar e validar schema · e-mail duplicado (400) + exclusão |
| `login.cy.js` | Autenticação com sucesso (token JWT) · senha incorreta (401) · e-mail inválido (400) |
| `produtos.cy.js` | Listar produtos e validar schema · criar produto como admin · bloqueio sem token/sem privilégio |

## Como executar

```bash
# instalar dependências
npm install

# abrir o Test Runner (modo interativo)
npm run cy:open

# rodar tudo em modo headless
npm run test:all

# rodar somente os cenários E2E (UI)
npm run test:e2e

# rodar somente os cenários de API
npm run test:api
```

## Observações

- Os testes de UI usam seletores baseados em atributos padrão de formulário
  (`type="email"`, `type="password"`) e texto visível, pois o projeto
  `front.serverest.dev` está em fase **beta** e pode não expor `data-testid`
  em todos os elementos. Recomenda-se validar/ajustar os seletores com o
  **Selector Playground** do Cypress antes da primeira execução.
- O ambiente do ServeRest é compartilhado publicamente e os dados são
  resetados diariamente — por isso os testes geram massa de dados única
  a cada execução e fazem limpeza (`DELETE`) do que criam via API.
