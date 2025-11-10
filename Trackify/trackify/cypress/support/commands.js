// Custom Cypress commands

Cypress.Commands.add('apiLogin', ({ email, password }) => {
  return cy.request({
    method: 'POST',
    url: 'http://127.0.0.1:8000/auth/login',
    body: { email, password },
    failOnStatusCode: false,
  }).then((resp) => {
    expect(resp.status).to.be.oneOf([200, 201]);
    const token = resp.body?.access_token;
    expect(token, 'access_token').to.be.a('string').and.have.length.greaterThan(10);
    window.localStorage.setItem('access_token', token);
    return token;
  });
});

Cypress.Commands.add('setToken', (token) => {
  window.localStorage.setItem('access_token', token);
});

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })