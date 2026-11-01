import { type Locator, type Page } from '@playwright/test';

type Credentials = {
    username: string;
    password: string;
};

export class LoginPage {
    readonly page: Page;
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly errorMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.usernameInput = page.locator('[data-test="username"]');
        this.passwordInput = page.locator('[data-test="password"]');
        this.loginButton = page.locator('[data-test="login-button"]');
        this.errorMessage = page.locator('[data-test="error"]');
    }

    async goto() {
        await this.page.goto('https://www.saucedemo.com/');
    }

    async login(credentials: Credentials) {
        await this.usernameInput.fill(credentials.username);
        await this.passwordInput.fill(credentials.password);
        await this.loginButton.click();
    }
}