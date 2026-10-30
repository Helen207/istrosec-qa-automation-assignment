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