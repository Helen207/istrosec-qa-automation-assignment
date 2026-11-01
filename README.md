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

To run a single task, use its project:

```bash
npx playwright test --project=ui-react-admin   # Task #1
npx playwright test --project=api-crud         # Task #2
npx playwright test --project=api-healthcheck  # Task #3
npx playwright test --project=ui-chromium      # Task #4 Part A
npx playwright test --project=api-auth         # Task #4 Part B
```

## Task #1 – UI Automation (React Admin)

**Application:** https://marmelab.com/react-admin-demo/ (login `demo` / `demo`)

All tests run against the **Customers** resource (900 records, sortable columns, filters, search, create/edit form). The demo keeps its data in the browser and resets it on every reload, so each test starts from the same state and tests can run in parallel without affecting each other or the public demo. Four areas are covered: list view, create/edit form, delete flow and navigation.

### Test Coverage

**List view**

| Test Case | Reason |
|---|---|
| Next page shows the following 25 customers | Pagination is the only way to reach most of the 900 records; the test checks that the next page contains different rows, not only that the counter changes. |
| Sorting by orders ascending / descending | Sorting must reorder the actual rows. Two tests, because ascending and descending are separate clicks and can break independently. A numeric column is used to avoid locale-dependent string ordering. |
| Search narrows the list to matching customers | Search is the main way to find a record; the customer used as the search term must still be in the result and the total must shrink. |
| Search without a match shows the empty state | Verifies that an empty result is communicated instead of showing a blank or stale table. |
| Has ordered filter lists only customers with at least one order | Verifies that a filter restricts the data by its meaning (every remaining row has orders > 0), not only that the count changes. |

**Create / edit form**

| Test Case | Reason |
|---|---|
| Creating a customer with valid data | Happy path: success notification, redirect to the edit page and persisted field values. |
| Created customer is present in the customers list | Verifies that the record is really stored and findable, not only that the form was accepted. |
| Submitting without first name / last name / email | Required-field validation, one test per field so a regression in one field is pinpointed. Checks the field error and the form-level notice. |
| Submitting with a malformed email | The email field relies on browser validation; the test verifies that submission is blocked. |
| Submitting with mismatching passwords | Cross-field validation that a per-field required check would not catch. |
| Editing a field saves the change and shows it in the list | Verifies the update (`Customer updated`) is persisted, not only displayed in the form. |
| Save stays disabled until the form is changed | Prevents empty submits; checks the enabled/disabled transition. |

**Delete flow**

| Test Case | Reason |
|---|---|
| Deleting a customer removes it from the list | The record must disappear from search results after the deletion is committed. |
| Undo restores a deleted customer | React Admin deletes are undoable instead of using a confirmation dialog; Undo is the safety net against accidental deletion. |

**Navigation**

| Test Case | Reason |
|---|---|
| Sidebar links (Orders, Posters, Customers, Reviews) | Each link must open the right section; one test per link. |
| Browser back and forward move between visited sections | Single-page apps often break history; verifies URL and visible content stay consistent. |
| Browser back returns to the previous page of the list | Verifies that pagination state is part of browser history. |


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


## Task 3 – Agent Healthcheck Validation

Implemented a local Express mock server with Zod schema validation. The server accepts valid healthcheck payloads with HTTP 200 and `{ "status": "ok" }`, and rejects invalid payloads with HTTP 400 and a structured `errors` array.

**Testing approach:** Positive tests cover the reference payload and important boundary conditions. Data-driven negative tests cover missing and unexpected fields, invalid UUIDs, numeric constraints, timestamp formats, IP addresses, and nested object validation. Each invalid case is executed as a separate Playwright test.

**Validation decisions:**
- Unknown fields are rejected at both root and nested object levels using strict schemas. This favors a clearly defined security-agent contract, although it reduces forward compatibility when new fields are introduced.
- UTC timestamps must end in `Z`; fractional seconds are accepted. Calendar validity is checked in addition to the timestamp format.
- `session_info` may be empty, while `adapter_info` and `roles` must contain at least one entry.
- IPv4 and IPv6 addresses are supported, including IPv6 zone identifiers.

The mock server is started automatically through Playwright's `webServer` configuration. Tests can be run with `npx playwright test --project=api-healthcheck`.


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