import { faker } from "@faker-js/faker";

export function gerarUsuario(overrides = {}) {
  return {
    nome: faker.person.fullName(),
    email: `cypress.${Date.now()}.${faker.string.alphanumeric(6)}@teste.com`,
    password: faker.internet.password({ length: 12 }),
    administrador: "false",
    ...overrides,
  };
}
