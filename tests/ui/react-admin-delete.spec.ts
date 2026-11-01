import { test, expect } from '../../fixtures/reactadmin.fixture';

test.describe('Delete customer', () => {
    test('Deleting a customer removes it from the list', async ({ customer, customerForm, layout, customersPage }) => {
        await customerForm.deleteButton.click();

        await expect(layout.notification).toContainText('Customer deleted');
        // The deletion is undoable: it only reaches the data provider once the notification closes.
        await expect(layout.notification).toBeHidden({ timeout: 10_000 });
        await customersPage.search(customer.lastName);
        await expect(customersPage.emptyMessage).toBeVisible();
    });

    test('Undo restores a deleted customer', async ({ customer, customerForm, layout, customersPage }) => {
        await customerForm.deleteButton.click();
        await expect(layout.notification).toContainText('Customer deleted');

        await layout.notification.getByRole('button', { name: 'Undo' }).click();

        await customersPage.search(customer.lastName);
        await expect(customersPage.rows).toHaveCount(1);
        await expect(customersPage.rows.first()).toContainText(`${customer.firstName} ${customer.lastName}`);
    });
});
