import { test, expect } from '../../fixtures/reactadmin.fixture';
import { newCustomer } from '../../test-data/reactadmin.data';

const invalidFormNotice = 'The form is not valid. Please check for errors';

test.describe('Customer create and edit form', () => {
    test('Creating a customer with valid data saves it and opens its edit page', async ({ customerForm, layout, page }) => {
        await customerForm.gotoCreate();
        await customerForm.fill(newCustomer);
        await customerForm.save();

        await expect(layout.notification).toContainText('Customer created');
        await expect(page).toHaveURL(/#\/customers\/\d+$/);
        await expect(customerForm.firstNameInput).toHaveValue(newCustomer.firstName);
        await expect(customerForm.lastNameInput).toHaveValue(newCustomer.lastName);
        await expect(customerForm.emailInput).toHaveValue(newCustomer.email);
    });

    test('Created customer is present in the customers list', async ({ customer, layout, customersPage }) => {
        await layout.openFromSidebar('Customers');
        await customersPage.search(customer.lastName);

        await expect(customersPage.rows).toHaveCount(1);
        await expect(customersPage.rows.first()).toContainText(`${customer.firstName} ${customer.lastName}`);
    });

    for (const field of ['firstNameInput', 'lastNameInput', 'emailInput'] as const) {
        test(`Submitting without ${field.replace('Input', '')} shows a required error`, async ({ customerForm, layout, page }) => {
            await customerForm.gotoCreate();
            await customerForm.fill(newCustomer);
            await customerForm[field].clear();
            await customerForm.save();

            await expect(customerForm[field]).toHaveAccessibleDescription('Required');
            await expect(layout.notification).toContainText(invalidFormNotice);
            await expect(page).toHaveURL(/#\/customers\/create$/);
        });
    }

    test('Submitting with a malformed email is blocked', async ({ customerForm, page }) => {
        await customerForm.gotoCreate();
        await customerForm.fill({ ...newCustomer, email: 'not-an-email' });
        await customerForm.save();

        expect(await customerForm.emailInput.evaluate((el: HTMLInputElement) => el.validity.typeMismatch)).toBe(true);
        await expect(page).toHaveURL(/#\/customers\/create$/);
    });

    test('Submitting with mismatching passwords shows an error', async ({ customerForm, layout, page }) => {
        await customerForm.gotoCreate();
        await customerForm.fill(newCustomer, 'a-different-password');
        await customerForm.save();

        await expect(customerForm.confirmPasswordInput)
            .toHaveAccessibleDescription('The password confirmation is not the same as the password.');
        await expect(layout.notification).toContainText(invalidFormNotice);
        await expect(page).toHaveURL(/#\/customers\/create$/);
    });

    test('Editing a field saves the change and shows it in the list', async ({ customer, customerForm, layout, customersPage }) => {
        await customerForm.firstNameInput.fill('Renamed');
        await customerForm.save();

        await expect(layout.notification).toContainText('Customer updated');
        // The update is undoable: it only reaches the data provider once the notification closes.
        await expect(layout.notification).toBeHidden({ timeout: 10_000 });
        await customersPage.search(customer.lastName);
        await expect(customersPage.rows).toHaveCount(1);
        await expect(customersPage.rows.first()).toContainText(`Renamed ${customer.lastName}`);
    });

    test('Save stays disabled until the form is changed', async ({ customer, customerForm }) => {
        await expect(customerForm.saveButton).toBeDisabled();

        await customerForm.firstNameInput.fill(`${customer.firstName}x`);

        await expect(customerForm.saveButton).toBeEnabled();
    });
});
