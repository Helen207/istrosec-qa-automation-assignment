import { test, expect } from '../../fixtures/reactadmin.fixture';

test.describe('Customers list', () => {
    test.beforeEach(async ({ customersPage }) => {
        await customersPage.goto();
        await expect(customersPage.rangeText).toHaveText('1-25 of 900');
    });

    test('Next page shows the following 25 customers', async ({ customersPage }) => {
        const firstPageNames = await customersPage.columnValues('Name');

        await customersPage.nextPageButton.click();

        await expect(customersPage.rangeText).toHaveText('26-50 of 900');
        await customersPage.waitForRowsToReplace(firstPageNames);
        await expect(customersPage.rows).toHaveCount(25);
    });

    test('Sorting by orders ascending orders the rows from fewest to most orders', async ({ customersPage }) => {
        await customersPage.sortBy('Orders');

        await expect.poll(async () => {
            const orders = await customersPage.numericColumn('Orders');
            return orders.every((count, i) => i === 0 || orders[i - 1] <= count) && orders[0] === 0;
        }).toBe(true);
    });

    test('Sorting by orders descending orders the rows from most to fewest orders', async ({ customersPage }) => {
        await customersPage.sortBy('Orders');
        await customersPage.sortBy('Orders');

        await expect.poll(async () => {
            const orders = await customersPage.numericColumn('Orders');
            return orders.every((count, i) => i === 0 || orders[i - 1] >= count) && orders[0] > 0;
        }).toBe(true);
    });

    test('Search narrows the list to customers matching the term', async ({ customersPage }) => {
        const [firstName] = await customersPage.columnValues('Name');
        const term = firstName.trim().split(' ').pop()!;

        await customersPage.search(term);

        await expect(customersPage.rangeText).not.toHaveText('1-25 of 900');
        await expect.poll(() => customersPage.columnValues('Name')).toContain(firstName);
    });

    test('Search without a match shows the empty state', async ({ customersPage }) => {
        await customersPage.search('zzzzqq-no-such-customer');

        await expect(customersPage.emptyMessage).toBeVisible();
        await expect(customersPage.rows).toHaveCount(0);
    });

    test('Has ordered filter lists only customers with at least one order', async ({ customersPage }) => {
        await customersPage.filterOption('Has ordered', 'Yes').click();

        await expect(customersPage.rangeText).not.toHaveText('1-25 of 900');
        await expect.poll(async () => {
            const orders = await customersPage.numericColumn('Orders');
            return orders.length > 0 && orders.every((count) => count > 0);
        }).toBe(true);
    });
});
