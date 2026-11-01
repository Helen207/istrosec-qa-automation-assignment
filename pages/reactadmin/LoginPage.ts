import { expect, type Locator, type Page } from '@playwright/test';

type Credentials = {
    username: string;
    password: string;
};

export class LoginPage {
    readonly page: Page;
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly signInButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.usernameInput = page.getByRole('textbox', { name: 'Username' });
        this.passwordInput = page.getByRole('textbox', { name: 'Password', exact: true });
        this.signInButton = page.getByRole('button', { name: 'Sign in' });
    }

    async goto() {
        await this.page.goto('./');
    }

    async login(credentials: Credentials) {
        await this.usernameInput.fill(credentials.username);
        await this.passwordInput.fill(credentials.password);
        await this.signInButton.click();

        // Later hash navigations would race with the post-login redirect to the dashboard.
        await expect(this.usernameInput).toBeHidden();
    }
}
