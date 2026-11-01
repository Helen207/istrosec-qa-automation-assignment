import { type Locator, type Page } from '@playwright/test';

export type SidebarSection =
    | 'Dashboard'
    | 'Orders'
    | 'Invoices'
    | 'Posters'
    | 'Categories'
    | 'Customers'
    | 'Segments'
    | 'Reviews';

export class AdminLayout {
    readonly page: Page;
    readonly header: Locator;
    readonly notification: Locator;

    constructor(page: Page) {
        this.page = page;
        this.header = page.getByRole('banner');
        this.notification = page.getByRole('alert');
    }

    sidebarLink(section: SidebarSection): Locator {
        const link = this.page.getByRole('menuitem', { name: section, exact: true });
        // "Customers" is both a collapsible group heading and a link to the list.
        return section === 'Customers' ? link.last() : link;
    }

    async openFromSidebar(section: SidebarSection) {
        await this.sidebarLink(section).click();
    }
}
