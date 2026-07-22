import { faker } from "@faker-js/faker";

/**
 * Gera um usuário único a cada chamada (e-mail e senha aleatórios).
 * Evita o erro "Este email já está sendo usado" ao rodar a suíte
 * várias vezes contra o ambiente compartilhado do ServeRest, e evita
 * ter uma senha fixa reaproveitada no código-fonte.
 */
export function gerarUsuario(overrides = {}) {
  return {
    nome: faker.person.fullName(),
    email: `cypress.${Date.now()}.${faker.string.alphanumeric(6)}@teste.com`,
    password: faker.internet.password({ length: 12 }),
    administrador: "false",
    ...overrides,
  };
}
