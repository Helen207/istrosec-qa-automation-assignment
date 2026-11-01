import { test as base } from '@playwright/test';
import {LoginPage} from "../pages/saucedemo/LoginPage";
import {InventoryPage} from "../pages/saucedemo/InventoryPage";

type SauceDemoFixtures = {
    loginPage: LoginPage;
    inventoryPage: InventoryPage;
};

export const test = base.extend<SauceDemoFixtures>({
    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await use(loginPage);
    },

    inventoryPage: async ({ page }, use) => {
        const inventoryPage = new InventoryPage(page);
        await use(inventoryPage);
    },
});

export { expect } from '@playwright/test';