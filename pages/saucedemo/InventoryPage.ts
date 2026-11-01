import { type Locator, type Page } from '@playwright/test';

export class InventoryPage {
    readonly page: Page;
    readonly inventoryList: Locator;
    readonly menuButton: Locator;
    readonly logoutLink: Locator;

    constructor(page: Page) {
        this.page = page;
        this.inventoryList = page.locator('[data-test="inventory-list"]');
        this.menuButton = page.locator('#react-burger-menu-btn');
        this.logoutLink = page.locator('#logout_sidebar_link');
    }

    async logout() {
        await this.menuButton.click();
        await this.logoutLink.click();
    }
}