# QA Automation Assignment

Automated tests implemented using Playwright and TypeScript.

## Tech Stack
- Playwright
- TypeScript
- Node.js

## Requirements

- Node.js 20 or newer (required by Playwright 1.64). Developed and checked with Node.js v26.13.0 and npm 11.20.0.
- Network access: Tasks #1, #2 and #4 run against public sites (marmelab.com, jsonplaceholder.typicode.com, saucedemo.com, dummyjson.com).

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

The tests in `api-healthcheck` need the local mock server. Playwright starts it automatically (`webServer` in `playwright.config.ts`), so no manual step is needed for the commands in this README.

To run the mock server on its own (it listens on `http://127.0.0.1:3001`):

```bash
npm run mock:start
```

In another terminal, check that it is up and try the reference payload (`test-data/healthcheck.payload.ts`):

```bash
curl http://127.0.0.1:3001/health
# {"status":"ready"}

curl -X POST http://127.0.0.1:3001/healthcheck \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"not-a-uuid"}'
# {"status":"error","errors":[{"field":"agent_id",...}, ...]}
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

**End-to-end flow**

| Test Case | Reason |
|---|---|
| Customer can be created, found, edited and deleted | The sample scenario from the assignment as one chain. The separate tests above find a break in one step; this one proves that the steps work together, i.e. that what one step saves is what the next step reads. |

### Implementation Decisions

- **Page Object Model (bonus):** `pages/reactadmin/` contains `LoginPage`, `AdminLayout` (sidebar, header, notifications), `CustomersListPage` and `CustomerFormPage`. Tests contain only intent and assertions.
- **Fixtures:** `fixtures/reactadmin.fixture.ts` provides the page objects, signs in before every test and offers a `customer` fixture that creates a customer through the UI for the tests that need one.
- **Locators:** role-based locators (`getByRole`) and accessible descriptions for field errors; no CSS classes (they are generated by MUI).
- **Waiting:** no fixed sleeps. Assertions poll for the real condition, e.g. rows replaced after paging (the list keeps showing the previous rows and updates its range text before the new data arrives).
- Each test case is a separate test; the three required-field cases are generated from a list, as in Task #3.

### Known Limitations and Omitted Scenarios

- **Delete confirmation dialog:** the demo has none for a single record, it shows an *Undo* notification instead. Edits and deletions are committed to the data provider only after that notification closes, so the tests wait for it to close (up to 10 s) before searching.
- **Cancel:** the create/edit form has no Cancel button, so there is no cancel test.
- **Breadcrumbs:** the demo has none (I checked the list and edit pages of customers, posters, orders and reviews), so that navigation item of the assignment is not testable here.
- **Not covered:** bulk delete, other resources (orders, reviews, posters), the dashboard, other browsers and responsive layouts.
- The tests depend on a public demo site; they need network access and will fail if the demo's structure or seed data changes (900 customers, 25 per page).


## Task #2 – API CRUD Testing

**API:** https://jsonplaceholder.typicode.com/

The goal is to verify basic CRUD operations, response data and selected negative scenarios.

### Test Coverage

| Test Case | Reason |
|---|---|
| GET /posts | The list is what clients render first. The test checks that the body is a non-empty array and that items carry a numeric `id`, which clients use to link to the detail view; a changed shape or an empty list would break every consumer at once. |
| GET /posts/1 | Asserts the exact `id`, `userId`, `title` and `body` of a known record, not just status 200. A server that returns 200 with the wrong or half-empty record would silently show clients incorrect data. |
| GET /posts/9999 | A missing resource must be reported as 404 with an empty body. If it returned 200 with `null` or another record, clients could not tell "does not exist" from valid data. |
| GET /posts/invalid-id | Malformed input is the cheapest way to provoke a server error. The test pins the current behaviour (404, empty body) and would catch a regression to a 500 or a leaked stack trace. |
| GET /posts?userId=1 | Filtering is server-side data scoping. The test checks that **every** returned post belongs to user 1, not only the first, because a filter that over-matches would show one user's data in another user's view. |
| POST /posts | Creation must return `201` (not a generic 200), echo the submitted fields and assign an `id`. Clients need that `id` to refer to the new resource, and 201 is how they know it was created. |
| PUT /posts/1 | A full update has to return every submitted field with its new value; this is the contract clients rely on to refresh their local copy after saving. |
| PATCH /posts/1 | A partial update must change only the sent field. The test re-reads the original post and checks that `id`, `userId` and `title` stay untouched, which catches a PATCH that behaves like PUT and wipes the fields that were not sent. |
| DELETE /posts/1 | Clients use the success response as the signal to remove the item from their UI. The test pins `200` and an empty body so a change in the success contract is noticed. |
| PUT /posts/9999 (known defect) | Updating a post that does not exist must give a client error. JSONPlaceholder answers `500` and puts a server stack trace with file paths in the body, which is both a wrong status and an information leak. The test expects `404` and is marked `test.fail()`: it counts as passing while the defect exists and turns red when the API is fixed. |

### Known Limitations and Omitted Scenarios

JSONPlaceholder is a fake REST API. POST, PUT, PATCH and DELETE operations are simulated, and changes are not persisted. Therefore, the tests verify the response rather than actual database changes.

**Error states of write operations:** I checked all four write methods against a non-existing id. Only `PUT` fails (500); `PATCH` and `DELETE` return 200 and `POST` with an empty body returns 201, as the fake API does not validate anything. The `PUT` case is the only one that is clearly wrong, so it is the only one with a test.

**DELETE – non-existing post:** I considered testing the deletion of a non-existing post. However, JSONPlaceholder returns `200 OK` and `{}` for both existing and non-existing posts. Since this behavior is already covered by the successful DELETE response test, I decided not to include a separate test with limited additional value.

**Invalid request payloads:** I did not include extensive input validation tests because JSONPlaceholder does not provide a complete production-like validation contract.

In a production API, I would additionally test input validation, data persistence, authorization and more negative scenarios based on the API specification.


## Task 3 – Agent Healthcheck Validation

Implemented a local Express mock server with Zod schema validation. The server accepts valid healthcheck payloads with HTTP 200 and `{ "status": "ok" }`, and rejects invalid payloads with HTTP 400 and a structured `errors` array.

**Testing approach:** Positive tests cover the reference payload and important boundary conditions. Data-driven negative tests cover missing and unexpected fields, invalid UUIDs, numeric constraints, timestamp formats, IP addresses, and nested object validation. Each invalid case is executed as a separate Playwright test.

### Test Coverage

The healthcheck is how the server learns which agents exist, what they run on and whether they are alive. Wrongly **accepting** a payload stores untrusted or ambiguous data about a host in a security product; wrongly **rejecting** a valid one makes a healthy agent look dead and creates a blind spot. Both directions are tested.

**Positive tests (must be accepted)**

| Test Case | Reason |
|---|---|
| Reference payload | Baseline. If the documented payload is rejected, every agent is reported as failing, and all the negative tests would be meaningless because they are derived from this payload. |
| Empty `session_info` | A host with nobody logged in (freshly booted, server) is a normal state. Rejecting it would make legitimate agents disappear. |
| UTC timestamp with milliseconds | ISO 8601 allows fractional seconds, so a stricter validator would reject real agents. The test checks that the `Z` rule is not implemented as a rigid regex. |
| Adapter with empty `addresses` | A disconnected adapter has no IP. An empty array is still a valid array of valid addresses, so the server must not reject it. |
| Each role value, and all roles together | `roles` is an enum with three allowed values. Testing only `workstation` would let a server that forgot `server` or `domain_controller` pass, and those hosts would be rejected in production. |
| IPv4-only and IPv6-only adapter | The address check has separate IPv4 and IPv6 branches; a host may legitimately have only one of them. |
| Empty `base_board_sn` | The rule only says "string" (`"None"` is just the usual placeholder), so an empty value must not be treated like an empty `computer_name`. |
| Lowercase UUIDs | The rule says "8-4-4-4-12 hex characters", which includes lowercase. A case-sensitive check would reject agents that format UUIDs differently. |
| Zero OS version numbers | Boundary of the "integer >= 0" rule; `0` must be accepted. |

**Negative tests (must be rejected with 400 and an error that names the field)**

| Test Case | Reason |
|---|---|
| Empty payload | A bare `{}` must not count as a heartbeat. Also checks that errors are reported, not just a status code. |
| Malformed JSON body | The response contract is JSON in both directions. A truncated body from a crashing agent must get the same `{"status":"error","errors":[...]}` answer, not a framework HTML error page that the agent cannot parse. |
| Missing `agent_id` | `agent_id` is the identity of the agent; accepting a payload without it creates an unattributable host record. |
| Invalid UUID format | Identifiers are used as keys. Malformed ones lead to lookup errors, collisions or spoofed identities. |
| Unknown root field | The contract is strict by design: unknown fields are data nobody validated that could reach storage or logs, and they also reveal agent/server version drift. |
| Unknown adapter field | The same strictness must hold in nested objects, where validators most often stop checking. |
| Negative `os_build` | Range check. The OS build number is used to judge patch level, and a negative value is never produced by a real agent. |
| Decimal `os_build` | Integer check, separate from the range check, so that each rule can fail on its own. |
| String `os_build` | Type confusion (`"22000"` vs `22000`) breaks numeric comparisons downstream and suggests a hand-crafted payload. |
| Timestamp with timezone offset | The rule demands UTC with a `Z` suffix; `+00:00` is the same instant but a different format that other components may not parse. |
| Timestamp without timezone | An ambiguous local time skews the ordering of boot and update events, which matters when reconstructing an incident. |
| Non-existing calendar date | `2022-02-30` matches the timestamp format but is not a real date; it passes a regex-only validator. |
| Invalid IPv4 address | Addresses are used for asset inventory and network attribution; `999.999.999.999` would attribute a host to a non-existent address. |
| Invalid IPv6 address | Separate parser, separate bug surface from IPv4. |
| Empty IPv6 zone index | `%7` is explicitly allowed, so the boundary is `fe80::1%` with an empty zone; a lenient implementation accepts any text after `%`. |
| Empty `adapter_info` | The rule requires at least one adapter; an agent that reports none has no network identity. |
| Missing adapter `name` | Required key inside a nested object. |
| Empty `roles` | Roles tell the server which policies apply to the host, so a host without a role would have no classification. |
| Unsupported role (`admin`) | Enum check: an arbitrary role value must never be able to select a policy the product does not define. |
| Unknown session `state` | Enum check: the session state tells whether a user is active on the host. |
| Empty `computer_name` / whitespace-only `os_name` | The non-empty string rule. These names identify the host in the console, so a blank value produces an unnamed asset. Whitespace-only is covered because it looks filled in but is not. |
| Malformed `system_product_uuid` | `agent_id` is tested, but each field is validated separately; this catches a schema where only one of the two UUID fields is checked. |
| Non-string `base_board_sn` | The rule is "string"; a number would pass a check that only looks for a present value. |
| Date-only `last_update_time` | Second timestamp field, with a different failure shape than the full timestamp cases above. |
| IPv6 zone index with an invalid character | `%7` is allowed, but arbitrary text after `%` is not; this pins the character set the mock accepts. |
| Empty adapter `name` | Non-empty rule inside a nested object, where it is easy to forget. |
| `addresses` given as a string | Type check: a bare string would otherwise be iterated character by character, or accepted as a single address. |
| Empty `session_name`, negative `session_id`, missing `account_sid` | `session_info` was otherwise tested only through `state`. These cover its non-empty, range and required-key rules. |

### Riskiest Areas

1. **Identity fields** (`agent_id`, `system_product_uuid`): a wrong value means a host is mislabelled or impersonated.
2. **Enum values** (`roles`, `state`) and **unknown fields**: they decide how the server classifies the host and what data enters the system.
3. **Timestamps and addresses**: the most format-sensitive fields, and the ones where plain regexes usually accept invalid input.

### Consciously Omitted

- A missing-field test for every single field: one representative (`agent_id`) plus the empty payload covers the same required-field mechanism.
- Negative values for `os_major` / `os_minor`: they share the integer rule that is tested on `os_build` and `session_id`.
- Transport-level cases (invalid JSON, wrong content type, huge payloads, other HTTP methods) and string length limits: the assignment defines no contract for them.
- Authentication of the agent, rate limiting and load: outside the validation rules given in the assignment.

**Validation decisions:**
- Unknown fields are rejected at both root and nested object levels using strict schemas. This favors a clearly defined security-agent contract, although it reduces forward compatibility when new fields are introduced.
- UTC timestamps must end in `Z`; fractional seconds are accepted. Calendar validity is checked in addition to the timestamp format.
- `session_info` may be empty, while `adapter_info` and `roles` must contain at least one entry.
- IPv4 and IPv6 addresses are supported, including IPv6 zone identifiers. A zone index may contain letters, digits and `_ . ~ -`; an empty zone (`fe80::1%`) or any other character is rejected. The assignment only gives `%7` as an example, so this character set is my own choice.
- "Non-empty string" is checked after trimming, so a whitespace-only `computer_name`, `os_name`, `session_name` or adapter `name` is rejected. The assignment does not say whether `"   "` counts as empty; I treat it as empty because a blank host name is as useless as a missing one. This is pinned by a test, so changing it is a conscious decision.
- Invalid JSON bodies are answered with the same `{"status":"error","errors":[...]}` format (field `root`) instead of the framework's default HTML page.

The mock server is started automatically through Playwright's `webServer` configuration. Tests can be run with `npx playwright test --project=api-healthcheck`.


## Task #4 – Authentication & Authorization

### Part A – UI Authentication (SauceDemo)

**Application:** https://www.saucedemo.com/

The tests cover the main authentication scenarios using Playwright, Page Object Model and custom fixtures.

| Test Case | Reason |
|---|---|
| Successful login | Establishes that the legitimate path works (URL is the inventory page and the product list is visible). The negative tests below only mean something if a valid login really does succeed. |
| Invalid credentials | Wrong credentials must show an error and grant nothing: the test checks the message, that no redirect happens and that the protected list is absent. The message says only that username and password do not match, so it does not reveal which one was right (no user enumeration). |
| Locked-out user | A lock is the control for disabled or compromised accounts. It has to hold even when the password is correct, so the test uses the valid password and expects the lock message and no session. |
| Direct URL access | Hiding a link is not access control. Opening `/inventory.html` without logging in is the simplest bypass (forced browsing), so the test expects a redirect to the login page and no protected content. |
| Logout and session termination | After logout a shared or stolen browser must not give access. The test logs in, logs out and then opens the protected URL directly, expecting the login page again, so it proves the session was ended and not only hidden. |

### Implementation Decisions

I used Page Object Model to separate UI locators and actions from test logic. Custom Playwright fixtures provide Page Object instances to individual tests while keeping browser contexts isolated.

Test credentials are stored separately from the tests to avoid duplication and simplify maintenance. Only publicly available demo credentials are included in the repository.

### Part B – API Authentication (DummyJSON)

**API:** https://dummyjson.com/

| Test Case | Reason |
|---|---|
| Valid login | Everything else depends on tokens being issued. The test checks that both tokens are non-empty strings (an empty string would pass a plain "is present" check) and belong to the requested user. |
| Authenticated user | Shows that a token authorizes access **and** is bound to the right identity: `/auth/me` must return the user who logged in (same `username` and `id`), not another account. It uses a fresh request context without cookies, so success comes from the `Bearer` header and not from a leftover session. |
| Missing token | A protected endpoint must not fall back to anonymous access. Expects `401` and the "Access Token is required" message. |
| Invalid token | Forged or garbage tokens are the basic attack on token authentication. The test expects `401` with "Invalid/Expired Token!", not a `200` and not a server error. |
| Invalid credentials | A failed login must not issue tokens, even partially. Expects `400`, a generic "Invalid credentials" message and no `accessToken` / `refreshToken` in the body. |
| Expired token | A token must stop working when it expires, otherwise a stolen token is valid forever. The login uses `expiresInMins: 1` (the shortest lifetime DummyJSON honours), checks that `/auth/me` first returns 200, then polls until it returns 401 with `Token Expired!`. The first check proves the 401 is caused by expiry and not by a bad token. The test takes about a minute because the lifetime cannot be shorter. |

**Additional security scenarios**

The two additional scenarios cover the two ways authentication fails open:

- **Invalid token** - the server must verify the token it receives. If it only checked that a header exists, anyone could reach user data with an arbitrary string.
- **Invalid credentials** - the login endpoint must not issue a token, or give hints about which part was wrong, after a failed attempt. This is the response a credential-stuffing or brute-force attempt receives on every try.

The `expiresInMins` login parameter was not used; see Limitations.

**Token expiry**

`expiresInMins` is used to issue a token that lives for one minute. DummyJSON ignores `0` (it falls back to the 30-day default) and rejects negative values, so one minute is the shortest lifetime possible and the test has to wait for it. It polls every 5 seconds with a 90-second limit instead of sleeping. Locally it runs in parallel with the other tests, so the whole run takes about a minute; in CI (one worker) the minute is added to the run.

**Limitations**

Refresh token rotation, session revocation, rate limiting and more advanced authorization scenarios are not covered due to the limited scope of the assignment. See the next section for what I would add.

### What I would test next in a production environment

- **Refresh token flow:** a refresh token issues a new access token, an old or reused refresh token is rejected (rotation and replay), and logout invalidates it. Not covered: I did not investigate the refresh endpoint's rotation and revocation behaviour within the scope of the assignment.
- **Brute force and rate limiting:** many failed logins for one account and from one address should lock or slow the attempts, and the response must not reveal whether the user exists. Not covered: a public demo API must not be hammered, and the limits are unknown.
- **Authorization, not only authentication:** one user's token must not read or change another user's data (object-level access), and low-privilege users must not reach admin functions. Not covered: I am not aware of per-user resources or role checks in DummyJSON that would make this testable.
- **Token handling:** tampered signature, `alg: none`, wrong audience or issuer, and tokens sent in the query string or logged. Partly covered by the invalid token test; the rest needs access to the token format and server logs.
- **Session behaviour in the UI:** the browser Back button after logout, session timeout on inactivity, and concurrent sessions of one user. Not covered: SauceDemo is a demo shop, and I would not expect its session handling to say anything about a real product.
- **Transport and headers:** HTTPS only, cookie flags (`Secure`, `HttpOnly`, `SameSite`), CORS, and error messages that leak internals. Not covered: not controllable on a third-party demo.

**Risks this suite does not cover:** everything above, plus load and availability, and behaviour of the sites over time (the tests depend on public demos that can change or be down). I left these out because they need either a system I own and can break, or a specification the demo APIs do not have.