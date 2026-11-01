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

const validVariations: { name: string; modify: (payload: typeof validHealthcheckPayload) => void }[] = [
    {
        name: 'server role',
        modify: (payload) => {
            payload.roles = ['server'];
        },
    },
    {
        name: 'domain_controller role',
        modify: (payload) => {
            payload.roles = ['domain_controller'];
        },
    },
    {
        name: 'all roles together',
        modify: (payload) => {
            payload.roles = ['workstation', 'server', 'domain_controller'];
        },
    },
    {
        name: 'IPv4-only adapter',
        modify: (payload) => {
            payload.adapter_info = [{ name: 'Ethernet', addresses: ['10.0.0.5'] }];
        },
    },
    {
        name: 'IPv6-only adapter',
        modify: (payload) => {
            payload.adapter_info = [{ name: 'Ethernet', addresses: ['2001:db8::1'] }];
        },
    },
    {
        name: 'empty base_board_sn',
        modify: (payload) => {
            payload.base_board_sn = '';
        },
    },
    {
        name: 'lowercase UUIDs',
        modify: (payload) => {
            payload.agent_id = payload.agent_id.toLowerCase();
            payload.system_product_uuid = payload.system_product_uuid.toLowerCase();
        },
    },
    {
        name: 'zero OS version numbers',
        modify: (payload) => {
            payload.os_major = 0;
            payload.os_minor = 0;
            payload.os_build = 0;
        },
    },
];

for (const variation of validVariations) {
    test(`POST /healthcheck - accepts ${variation.name}`, async ({ request }) => {
        const payload = structuredClone(validHealthcheckPayload);

        variation.modify(payload);

        const response = await request.post('/healthcheck', {
            data: payload,
        });

        expect(response.status()).toBe(200);
        expect(await response.json()).toEqual({ status: 'ok' });
    });
}

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

test('POST /healthcheck - rejects malformed JSON body in the error format', async ({ request }) => {
    const response = await request.post('/healthcheck', {
        headers: { 'content-type': 'application/json' },
        data: Buffer.from('{"agent_id": '),
    });

    expect(response.status()).toBe(400);

    const body = await response.json();

    expect(body.status).toBe('error');
    expect(body.errors).toEqual([
        expect.objectContaining({ field: 'root', message: expect.stringContaining('JSON') }),
    ]);
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