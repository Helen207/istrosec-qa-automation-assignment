import { test, expect } from '../../fixtures/reactadmin.fixture';
import { newCustomer } from '../../test-data/reactadmin.data';

test('Customer can be created, found, edited and deleted', async ({ customerForm, customersPage, layout }) => {
    // Edit and delete are undoable, so each waits for its notification to close before the list is queried.
    test.setTimeout(60_000);

    await customerForm.gotoCreate();
    await customerForm.fill(newCustomer);
    await customerForm.save();
    await expect(layout.notification).toContainText('Customer created');

    await layout.openFromSidebar('Customers');
    await customersPage.search(newCustomer.lastName);
    await expect(customersPage.rows).toHaveCount(1);
    await expect(customersPage.rows.first()).toContainText(`${newCustomer.firstName} ${newCustomer.lastName}`);

    await customersPage.openFirstRow();
    await customerForm.firstNameInput.fill('Renamed');
    await customerForm.save();
    await expect(layout.notification).toContainText('Customer updated');
    await expect(layout.notification).toBeHidden({ timeout: 10_000 });

    await customersPage.search(newCustomer.lastName);
    await expect(customersPage.rows).toHaveCount(1);
    await expect(customersPage.rows.first()).toContainText(`Renamed ${newCustomer.lastName}`);

    await customersPage.openFirstRow();
    await customerForm.deleteButton.click();
    await expect(layout.notification).toContainText('Customer deleted');
    await expect(layout.notification).toBeHidden({ timeout: 10_000 });

    await customersPage.search(newCustomer.lastName);
    await expect(customersPage.emptyMessage).toBeVisible();
});
