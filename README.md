# QA Automation Assignment

Automated tests implemented using Playwright and TypeScript.

## Tech Stack
- Playwright
- TypeScript
- Node.js

## Setup

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Install Playwright browsers:
   ```bash
   npx playwright install
   ```
4. Run all tests:
   ```bash
   npx playwright test
   ```

To run only the CRUD API tests:

```bash
npx playwright test --project=api-crud
```

## Task #2 – API CRUD Testing

**API:** https://jsonplaceholder.typicode.com/

The goal is to verify basic CRUD operations, response data and selected negative scenarios.

### Test Coverage

| Test Case | Reason |
|---|---|
| GET /posts | Verify that the API returns a non-empty list of posts with the expected structure. |
| GET /posts/1 | Verify that an existing post can be retrieved by its ID. |
| GET /posts/99999 | Verify that a non-existing post returns 404 instead of incorrect data. |
| GET /posts/invalid-id | Verify how the API handles an invalid ID format without returning an internal server error. |
| GET /posts?userId=1 | Verify that filtering returns only posts belonging to the requested user. |
| POST /posts | Verify that the API accepts a new post and returns the submitted data and generated ID. |
| PUT /posts/1 | Verify that a full update returns the expected updated data. |
| PATCH /posts/1 | Verify that a partial update changes the requested field without affecting other fields. |
| DELETE /posts/1 | Verify that the API returns the expected successful deletion response. |

### Known Limitations and Omitted Scenarios

JSONPlaceholder is a fake REST API. POST, PUT, PATCH and DELETE operations are simulated, and changes are not persisted. Therefore, the tests verify the response rather than actual database changes.

**DELETE – non-existing post:** I considered testing the deletion of a non-existing post. However, JSONPlaceholder returns `200 OK` and `{}` for both existing and non-existing posts. Since this behavior is already covered by the successful DELETE response test, I decided not to include a separate test with limited additional value.

**Invalid request payloads:** I did not include extensive input validation tests because JSONPlaceholder does not provide a complete production-like validation contract.

In a production API, I would additionally test input validation, data persistence, authorization and more negative scenarios based on the API specification.


## Task #4 – Authentication & Authorization

### Part A – UI Authentication (SauceDemo)

**Application:** https://www.saucedemo.com/

The tests cover the main authentication scenarios using Playwright, Page Object Model and custom fixtures.

| Test Case | Reason |
|---|---|
| Successful login | Verify that valid credentials allow access to the protected inventory page. |
| Invalid credentials | Ensure that invalid credentials are rejected and access to protected content is not granted. |
| Locked-out user | Verify that a locked account cannot authenticate, even with valid credentials. |
| Direct URL access | Ensure that unauthenticated users cannot bypass the login page by navigating directly to a protected URL. |
| Logout and session termination | Verify that logout removes access to protected content and that the user cannot reopen the protected page without authenticating again. |

### Implementation Decisions

I used Page Object Model to separate UI locators and actions from test logic. Custom Playwright fixtures provide Page Object instances to individual tests while keeping browser contexts isolated.

Test credentials are stored separately from the tests to avoid duplication and simplify maintenance. Only publicly available demo credentials are included in the repository.

### Part B – API Authentication (DummyJSON)

**API:** https://dummyjson.com/

| Test Case | Reason |
|---|---|
| Valid login | Verify that valid credentials return non-empty access and refresh tokens. |
| Authenticated user | Verify that a valid bearer token grants access to `/auth/me` and returns the correct user's details. |
| Missing token | Verify that protected user information cannot be accessed without authentication. |
| Invalid token | Verify that invalid bearer tokens are rejected and cannot be used to access protected data. |
| Invalid credentials | Verify that incorrect credentials are rejected and no authentication tokens are issued. |

**Additional security scenarios**

I selected invalid token and invalid credentials tests because authentication bypass and unauthorized token issuance are important security risks.

**Limitations**

Token expiration, refresh token rotation, session revocation, rate limiting and more advanced authorization scenarios are not covered due to the limited scope of the assignment. These would be relevant areas for further testing in a production environment.