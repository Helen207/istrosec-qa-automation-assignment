import { expect, type Locator, type Page } from '@playwright/test';

export class CustomersListPage {
    readonly page: Page;
    readonly table: Locator;
    readonly rows: Locator;
    readonly searchInput: Locator;
    readonly rangeText: Locator;
    readonly nextPageButton: Locator;
    readonly emptyMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.table = page.getByRole('table');
        this.rows = this.table.locator('tbody').getByRole('row');
        this.searchInput = page.getByRole('textbox', { name: 'Search' });
        this.rangeText = page.getByText(/^\d+-\d+ of \d+$/);
        this.nextPageButton = page.getByRole('button', { name: 'Go to next page' });
        this.emptyMessage = page.getByText('No Customers found using the current filters.');
    }

    async goto() {
        await this.page.goto('#/customers');
    }

    async search(term: string) {
        await this.searchInput.fill(term);
    }

    // The filter's label and its buttons are siblings, and "Yes"/"No" repeat across filter groups.
    filterOption(group: string, option: string): Locator {
        return this.page
            .getByText(group, { exact: true })
            .locator('xpath=../following-sibling::ul[1]')
            .getByRole('button', { name: option, exact: true });
    }

    async sortBy(column: string) {
        await this.table.getByRole('button', { name: `Sort by ${column.toLowerCase()}` }).click();
    }

    async columnValues(column: string): Promise<string[]> {
        const headers = await this.table.getByRole('columnheader').allTextContents();
        const position = headers.findIndex((header) => header.trim() === column) + 1;
        return this.rows.locator(`td:nth-child(${position})`).allTextContents();
    }

    async numericColumn(column: string): Promise<number[]> {
        return (await this.columnValues(column)).map(Number);
    }

    async openFirstRow() {
        await this.rows.first().getByRole('link').click();
    }

    // The list keeps showing the previous rows until the new page has loaded, and the
    // range text updates before them, so only the rows prove the new data arrived.
    async waitForRowsToReplace(previousNames: string[]) {
        await expect.poll(async () => {
            const names = await this.columnValues('Name');
            return names.length > 0 && names.every((name) => !previousNames.includes(name));
        }).toBe(true);
    }
}
