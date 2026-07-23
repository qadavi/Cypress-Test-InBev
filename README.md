# cypress-serverest

Suíte Cypress para o [ServeRest](https://serverest.dev/): **UI** (8 testes,
[front.serverest.dev](https://front.serverest.dev/)) e **API** (19 testes).
Cada camada tem 3 arquivos: jornada do usuário, jornada do admin, casos negativos.

## Estrutura

```
cypress/
├── e2e/
│   ├── ui/    jornada-usuario.cy.js · jornada-admin.cy.js · casos-negativos.cy.js
│   └── api/   jornada-usuario.cy.js · jornada-admin.cy.js · casos-negativos.cy.js
├── selectors/  um arquivo por página (login, cadastroUsuario, home, listaCompras, admin)
├── reports/    relatório HTML/JSON gerado a cada execução (gitignored)
└── support/    commands.js (App Actions) · dataGenerator.js (faker) · e2e.js
relatorio-bugs.pdf     bugs encontrados no site/API
relatorio-testes.pdf   passo a passo de cada cenário
```

## Convenção de seletores e comandos

- **`selectors/*.js`** — só strings de `data-testid`, sem lógica.
- **`support/commands.js`** — App Actions só para setup repetido (criar
  usuário via API, preencher formulário, logar). A interação sob teste fica
  sempre explícita no `it()`, nunca escondida atrás de um método.

## Boas práticas

- Setup de estado via API, não repetindo UI
- Seletores por `data-testid`
- Dados únicos por execução (`@faker-js/faker` + timestamp) e produtos
  buscados via API — nunca por nome fixo, catálogo é público e compartilhado
- Teardown: testes de API excluem o que criam
- Sem `cy.wait()` fixo — só asserções com retry automático
- Relatório via `cypress-mochawesome-reporter`

## Cenários

| Camada | Arquivo | Cobre |
|---|---|---|
| UI | `jornada-usuario` | cadastro → lista de compras → logout/login → carrinho |
| UI | `jornada-admin` | CRUD de produto · catálogo refletido pro usuário normal |
| UI | `casos-negativos` | e-mail duplicado, login inválido, acesso sem sessão/sem ser admin |
| API | `jornada-usuario` | usuários, login, produtos, carrinho (montar/cancelar/concluir) |
| API | `jornada-admin` | CRUD completo de produto |
| API | `casos-negativos` | uma regra de negócio/erro por teste (401/400/403) |

Detalhe passo a passo em [relatorio-testes.pdf](relatorio-testes.pdf).

## Executar

```bash
npm install
npm run cy:open      # interativo
npm run test:all     # tudo, headless
npm run test:e2e     # só UI
npm run test:api     # só API
```

Relatório após a execução: `cypress/reports/index.html`.

## Observações

- `/carrinho` (UI) é um placeholder "Em construção" no site real.
- IDs da API precisam ter exatamente 16 caracteres alfanuméricos nos endpoints
  `GET .../{id}` (ver [relatorio-bugs.pdf](relatorio-bugs.pdf)).
- Ambiente público e compartilhado — testes evitam nomes fixos no catálogo.
