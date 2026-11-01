import { defineConfig, devices } from '@playwright/test';

const mockServerUrl = 'http://127.0.0.1:3001';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    // 'open: never' keeps a failed local run from blocking the terminal with a report server.
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'api-crud',
            testMatch: '**/api/crud.spec.ts',
            use: {
                baseURL: 'https://jsonplaceholder.typicode.com',
            },
        },
        {
            name: 'ui-chromium',
            testMatch: '**/ui/saucedemo-*.spec.ts',
            use: {
                ...devices['Desktop Chrome'],
            },
        },
        {
            name: 'ui-react-admin',
            testMatch: '**/ui/react-admin-*.spec.ts',
            use: {
                ...devices['Desktop Chrome'],
                baseURL: 'https://marmelab.com/react-admin-demo/',
            },
        },
        {
            name: 'api-auth',
            testMatch: '**/api/auth.spec.ts',
            use: {
                baseURL: 'https://dummyjson.com',
            },
        },
        {
            name: 'api-healthcheck',
            testMatch: '**/api/healthcheck.spec.ts',
            use: {
                baseURL: mockServerUrl,
            },
        },
    ],

    webServer: {
        command: 'npm run mock:start',
        url: `${mockServerUrl}/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
    },
});
