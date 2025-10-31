describe('Login redirects based on role', () => {
  const adminEmail = Cypress.env('ADMIN_EMAIL') || 'admin@example.com';
  const adminPassword = Cypress.env('ADMIN_PASSWORD') || 'AdminPassword123!';
  const managerEmail = Cypress.env('MANAGER_EMAIL') || 'manager@example.com';
  const managerPassword = Cypress.env('MANAGER_PASSWORD') || 'ManagerPassword123!';
  const employeeEmail = Cypress.env('EMPLOYEE_EMAIL') || 'employee@example.com';
  const employeePassword = Cypress.env('EMPLOYEE_PASSWORD') || 'EmployeePassword123!';

  function uiLogin(email, password) {
    cy.visit('/');
    cy.get('input[label="Email"], input[type="email"]').first().clear().type(email);
    cy.get('input[label="Password"], input[type="password"]').first().clear().type(password);
    cy.contains('button', /^log in$|^login$/i).click();
  }

  it('admin redirects to /admin', () => {
    uiLogin(adminEmail, adminPassword);
    cy.url({ timeout: 15000 }).should('match', /\/admin(\b|\/)/);
  });

  it('manager redirects to /manager', () => {
    uiLogin(managerEmail, managerPassword);
    cy.url({ timeout: 15000 }).should('match', /\/manager(\b|\/)/);
  });

  it('employee redirects to /home', () => {
    uiLogin(employeeEmail, employeePassword);
    cy.url({ timeout: 15000 }).should('match', /\/home(\b|\/)/);
  });
});


