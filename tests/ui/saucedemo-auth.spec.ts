import { test, expect } from '../../fixtures/saucedemo.fixture';
import {sauceDemoUsers} from "../../test-data/saucedemo.users";


// I used custom Playwright fixtures to provide Page Object instances to tests.
// This avoids repeated initialization while keeping each test isolated, since fixtures use the test-specific Playwright page.
test('Successful login redirects user to inventory page',
    async ({ page, loginPage, inventoryPage }) => {

    await loginPage.goto();

    await loginPage.login(sauceDemoUsers.standard);

    await expect(page).toHaveURL(
        'https://www.saucedemo.com/inventory.html'
    );

    await expect(inventoryPage.inventoryList).toBeVisible();
});

test('Login with invalid credentials is rejected', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.goto();

    await loginPage.login(sauceDemoUsers.invalid);

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage)
        .toContainText('Username and password do not match');

    await expect(page).not.toHaveURL('https://www.saucedemo.com/inventory.html');
    await expect(inventoryPage.inventoryList).not.toBeVisible();
});

test('Going directly to inventory page should redirect to login page', async ({ page, loginPage, inventoryPage }) => {
    await page.goto('https://www.saucedemo.com/inventory.html');

    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();

    await expect(inventoryPage.inventoryList).not.toBeVisible();
});

test('Login with locked out user', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.goto();

    await loginPage.login(sauceDemoUsers.lockedOut);

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage)
        .toContainText('Sorry, this user has been locked out.');
});

test('Log out and session termination', async ({ page, loginPage, inventoryPage }) => {
    // login
    await loginPage.goto();
    await loginPage.login(sauceDemoUsers.standard);
    await await expect(inventoryPage.inventoryList).toBeVisible();

    // logout
    await inventoryPage.logout();

    // verify login page is displayed
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();

    // try to access protected page after logout
    await page.goto('https://www.saucedemo.com/inventory.html');

    // verify access is denied
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(inventoryPage.inventoryList).not.toBeVisible();
})