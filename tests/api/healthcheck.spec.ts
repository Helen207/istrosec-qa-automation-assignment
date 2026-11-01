import { test, expect } from '@playwright/test';
import {validHealthcheckPayload} from "../../test-data/healthcheck.payload";
import { invalidCases } from '../../test-data/healthcheck.invalid-cases';


// Positive test scenarios
test('POST /healthcheck - accepts valid reference payload', async ({ request }) => {
    const response = await request.post('/healthcheck', {
        data: validHealthcheckPayload,
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
});

test('POST /healthcheck - accepts empty session_info', async ({ request }) => {
    const payload = structuredClone(validHealthcheckPayload);

    payload.session_info = [];

    const response = await request.post('/healthcheck', {
        data: payload,
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
});

test('POST /healthcheck - accepts UTC timestamp with milliseconds', async ({ request }) => {
    const payload = structuredClone(validHealthcheckPayload);
    payload.last_boot_time = '2022-07-16T20:53:27.123Z';

    const response = await request.post('/healthcheck', {
        data: payload,
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
});

test('POST /healthcheck - accepts adapter with empty addresses', async ({ request }) => {
    const payload = structuredClone(validHealthcheckPayload);

    payload.adapter_info[0].addresses = [];

    const response = await request.post('/healthcheck', {
        data: payload,
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
});

// multiple missing required fields
test('POST /healthcheck - rejects empty payload', async ({ request }) => {
    const response = await request.post('/healthcheck', {
        data: {},
    });

    expect(response.status()).toBe(400);

    const body = await response.json();

    expect(body.status).toBe('error');
    expect(body.errors.length).toBeGreaterThan(0);
});

for (const testCase of invalidCases) {
    test(`POST /healthcheck - rejects ${testCase.name}`, async ({ request }) => {
        const payload = structuredClone(validHealthcheckPayload);

        testCase.modify(payload);

        const response = await request.post('/healthcheck', {
            data: payload,
        });

        expect(response.status()).toBe(400);

        const body = await response.json();

        expect(body.status).toBe('error');

        const expectedError: Record<string, unknown> = {
            field: testCase.expectedField,
        };

        if (testCase.expectedMessage) {
            expectedError.message = expect.stringContaining(testCase.expectedMessage);
        }

        expect(body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining(expectedError),
            ])
        );
    });
}