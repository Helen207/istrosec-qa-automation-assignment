import { test, expect } from '@playwright/test';
import {dummyJsonUsers} from "../../test-data/dummyjson.users";


test('POST/auth/login - returns tokens for valid credentials', async ({request}) => {
    const response = await request.post('/auth/login', {
        data: dummyJsonUsers.valid
    });

    expect(response.status()).toBe(200);

    const responseBody = await response.json();

    expect(responseBody.accessToken).toEqual(expect.any(String));
    expect(responseBody.accessToken.trim().length).toBeGreaterThan(0);

    expect(responseBody.refreshToken).toEqual(expect.any(String));
    expect(responseBody.refreshToken.trim().length).toBeGreaterThan(0);

    expect(responseBody.username).toBe(dummyJsonUsers.valid.username);
});

test('GET /auth/me - returns authenticated user details', async ({request, playwright}) => {
        // login request to get valid accessToken
        const loginResponse = await request.post('/auth/login', {
            data: dummyJsonUsers.valid
        });

        expect(loginResponse.status()).toBe(200);

        const loginBody = await loginResponse.json();
        const accessToken = loginBody.accessToken;

        // fresh context without login cookies
        const authenticatedRequest = await playwright.request.newContext({
            baseURL: 'https://dummyjson.com',
        });

        // request with valid accessToken
        try {
            const response = await authenticatedRequest.get('/auth/me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status()).toBe(200);

            const user = await response.json();

            expect(user.username).toBe(dummyJsonUsers.valid.username);
            expect(user.id).toBe(loginBody.id);
        } finally {
            await authenticatedRequest.dispose();
        }
    }
);

test('GET /auth/me - rejects missing access token', async ({request}) => {
    const response = await request.get('/auth/me');

    expect(response.status()).toBe(401);

    const responseBody = await response.json();

    expect(responseBody.message).toBe('Access Token is required');
});

test('GET /auth/me - rejects invalid access token', async ({request}) => {
    const response = await request.get('/auth/me', {
        headers: {
            Authorization: 'Bearer invalid-token-123',
        },
    });

    expect(response.status()).toBe(401);

    const responseBody = await response.json();
    expect(responseBody.message).toBe('Invalid/Expired Token!');
});

test('POST /auth/login - rejects invalid credentials', async ({request}) => {
    const response = await request.post('/auth/login', {
        data: dummyJsonUsers.invalid
    });

    expect(response.status()).toBe(400);

    const responseBody = await response.json();
    expect(responseBody.message).toBe('Invalid credentials');

    expect(responseBody).not.toHaveProperty('accessToken');
    expect(responseBody).not.toHaveProperty('refreshToken');
});

