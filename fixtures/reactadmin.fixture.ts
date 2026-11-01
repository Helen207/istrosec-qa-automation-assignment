import { expect, test as base } from '@playwright/test';
import { LoginPage } from '../pages/reactadmin/LoginPage';
import { AdminLayout } from '../pages/reactadmin/AdminLayout';
import { CustomersListPage } from '../pages/reactadmin/CustomersListPage';
import { CustomerFormPage } from '../pages/reactadmin/CustomerFormPage';
import { newCustomer, reactAdminUser, type Customer } from '../test-data/reactadmin.data';

type ReactAdminFixtures = {
    loginPage: LoginPage;
    layout: AdminLayout;
    customersPage: CustomersListPage;
    customerForm: CustomerFormPage;
    signedIn: void;
    customer: Customer;
};

export const test = base.extend<ReactAdminFixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },

    layout: async ({ page }, use) => {
        await use(new AdminLayout(page));
    },

    customersPage: async ({ page }, use) => {
        await use(new CustomersListPage(page));
    },

    customerForm: async ({ page }, use) => {
        await use(new CustomerFormPage(page));
    },

    // The demo keeps all data in the browser and resets it on reload, so every test
    // starts from the same state as long as it signs in on a fresh page.
    signedIn: [
        async ({ loginPage }, use) => {
            await loginPage.goto();
            await loginPage.login(reactAdminUser);
            await use();
        },
        { auto: true },
    ],

    // Leaves the browser on the edit page of the newly created customer.
    customer: async ({ customerForm, layout }, use) => {
        await customerForm.gotoCreate();
        await customerForm.fill(newCustomer);
        await customerForm.save();
        await expect(layout.notification).toContainText('Customer created');
        await use(newCustomer);
    },
});

export { expect } from '@playwright/test';
