import { test, expect } from '../../fixtures/reactadmin.fixture';
import { type SidebarSection } from '../../pages/reactadmin/AdminLayout';

const sidebarTargets: { section: SidebarSection; url: RegExp }[] = [
    { section: 'Orders', url: /#\/orders$/ },
    { section: 'Posters', url: /#\/products$/ },
    { section: 'Customers', url: /#\/customers$/ },
    { section: 'Reviews', url: /#\/reviews$/ },
];

test.describe('Navigation', () => {
    for (const { section, url } of sidebarTargets) {
        test(`Sidebar link ${section} opens the ${section} section`, async ({ layout, page }) => {
            await layout.openFromSidebar(section);

            await expect(page).toHaveURL(url);
            await expect(layout.header).toContainText(section);
        });
    }

    test('Browser back and forward move between visited sections', async ({ layout, page }) => {
        await layout.openFromSidebar('Customers');
        await expect(page).toHaveURL(/#\/customers$/);
        await layout.openFromSidebar('Reviews');
        await expect(page).toHaveURL(/#\/reviews$/);

        await page.goBack();
        await expect(page).toHaveURL(/#\/customers$/);
        await expect(layout.header).toContainText('Customers');

        await page.goForward();
        await expect(page).toHaveURL(/#\/reviews$/);
        await expect(layout.header).toContainText('Reviews');
    });

    test('Browser back returns to the previous page of the list', async ({ customersPage, page }) => {
        await customersPage.goto();
        await expect(customersPage.rangeText).toHaveText('1-25 of 900');
        const firstPageNames = await customersPage.columnValues('Name');

        await customersPage.nextPageButton.click();
        await customersPage.waitForRowsToReplace(firstPageNames);
        const secondPageNames = await customersPage.columnValues('Name');
        await customersPage.nextPageButton.click();
        await customersPage.waitForRowsToReplace(secondPageNames);
        await expect(customersPage.rangeText).toHaveText('51-75 of 900');

        await page.goBack();

        await expect(customersPage.rangeText).toHaveText('26-50 of 900');
        await expect.poll(() => customersPage.columnValues('Name')).toEqual(secondPageNames);
    });
});
