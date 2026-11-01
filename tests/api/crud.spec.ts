import { test, expect } from '@playwright/test';

// GET /posts/1 – Retrieve existing post
//
// Verifies that the API returns the record for the requested ID with the expected data, which lowers the risk of the application working with a wrong or incomplete record.
test('GET /posts/1 - returns correct post', async ({ request }) => {
    const response = await request.get('/posts/1');

    expect(response.status()).toBe(200);

    const post = await response.json();

    expect(post).toMatchObject({
        id: 1,
        userId: 1,
        title: "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
        body: 'quia et suscipit\n' +
            'suscipit recusandae consequuntur expedita et cum\n' +
            'reprehenderit molestiae ut ut quas totam\n' +
            'nostrum rerum est autem sunt rem eveniet architecto'
    });

    expect(post.title).toEqual(expect.any(String));
    expect(post.title.trim().length).toBeGreaterThan(0);

    expect(post.body).toEqual(expect.any(String));
    expect(post.body.trim().length).toBeGreaterThan(0);
});

test('GET /posts - returns list of posts', async ({ request }) => {

    const response = await request.get('/posts');

    expect(response.status()).toBe(200);

    const posts = await response.json();

    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0].id).toEqual(expect.any(Number));
});

test('GET /posts/9999 - returns 404 for non-existing post', async ({ request }) => {
    const response = await request.get('/posts/9999');

    expect(response.status()).toBe(404);
    
    const post = await response.json();
    
    expect(post).toEqual({})
});

test('GET /posts?userId=1 - returns only posts of that user', async ({ request }) => {
    const userId = 1;

    const response = await request.get('/posts', {
         params: {
             userId: userId,
         },
     });

    expect(response.status()).toBe(200);

    const posts = await response.json();

    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);

    for (const post of posts) {
        expect(post.userId).toEqual(userId);
    }
});

test('GET /posts/invalid-id - returns 404 for an invalid id format', async ({ request }) => {
    const response = await request.get('/posts/invalid-id');

    expect(response.status()).toBe(404);

    const responseBody = await response.json();
    expect(responseBody).toEqual({});
})

test('POST /posts - creates new post successfully', async ({ request }) => {
    const newPost = {
        title: 'New created test',
        body: 'Testing POST request with playwright yay',
        userId: 1
    };

    const response = await request.post('/posts', {data: newPost});

    expect(response.status()).toBe(201);

    const responseBody = await response.json();

    expect(responseBody.id).toEqual(expect.any(Number));
    expect(responseBody.id).toBeGreaterThan(0);
    expect(responseBody).toMatchObject(newPost);
});

test('PUT /posts/1 - update existing post', async ({ request }) => {
    const updatedPost = {
        id: 1,
        title: 'Updated test',
        body: 'Testing PUT request with playwright yay',
        userId: 1
    }

    const response = await request.put('/posts/1', {data: updatedPost});

    expect(response.status()).toBe(200);

    const responseBody = await response.json();

    expect(responseBody).toMatchObject(updatedPost);
});

test('PATCH /posts/1 - partial update existing post', async ({ request }) => {
    const originalResponse = await request.get('/posts/1');

    expect(originalResponse.status()).toBe(200);
    const originalPost = await originalResponse.json();

    const patchedPost = {
        body: 'Testing PATCH request with playwright yay',
    }

    const response = await request.patch('/posts/1', {data: patchedPost});

    expect(response.status()).toBe(200);

    const responseBody = await response.json();

    expect(responseBody).toMatchObject(patchedPost);

    // verify that other values were not updated
    expect(responseBody.id).toBe(originalPost.id);
    expect(responseBody.userId).toBe(originalPost.userId);
    expect(responseBody.title).toEqual(originalPost.title);
});

test('DELETE /posts/1 - deletes existing post', async ({ request }) => {
    const response = await request.delete('/posts/1');

    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toEqual({})
});

// JSONPlaceholder answers 500 (with a stack trace in the body) instead of 404 when the post does not exist.
// test.fail() keeps the suite green while that defect exists and fails once it is fixed, so the marker gets removed.
test('PUT /posts/9999 - returns 404 for non-existing post', async ({ request }) => {
    test.fail();

    const response = await request.put('/posts/9999', {
        data: { id: 9999, title: 'Updated test', body: 'Testing PUT on missing post', userId: 1 },
    });

    expect(response.status()).toBe(404);
});
