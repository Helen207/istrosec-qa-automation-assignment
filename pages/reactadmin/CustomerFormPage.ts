import { type Locator, type Page } from '@playwright/test';
import { type Customer } from '../../test-data/reactadmin.data';

export class CustomerFormPage {
    readonly page: Page;
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly confirmPasswordInput: Locator;
    readonly saveButton: Locator;
    readonly deleteButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.firstNameInput = page.getByRole('textbox', { name: 'First name' });
        this.lastNameInput = page.getByRole('textbox', { name: 'Last name' });
        this.emailInput = page.getByRole('textbox', { name: 'Email' });
        this.passwordInput = page.getByRole('textbox', { name: 'Password', exact: true });
        this.confirmPasswordInput = page.getByRole('textbox', { name: 'Confirm password' });
        this.saveButton = page.getByRole('button', { name: 'Save' });
        this.deleteButton = page.getByRole('button', { name: 'Delete' });
    }

    async gotoCreate() {
        await this.page.goto('#/customers/create');
    }

    async fill(customer: Customer, confirmPassword = customer.password) {
        await this.firstNameInput.fill(customer.firstName);
        await this.lastNameInput.fill(customer.lastName);
        await this.emailInput.fill(customer.email);
        await this.passwordInput.fill(customer.password);
        await this.confirmPasswordInput.fill(confirmPassword);
    }

    async save() {
        await this.saveButton.click();
    }
}
