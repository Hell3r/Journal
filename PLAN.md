# Project Completion Plan

## Backend (FastAPI)

### Existing API routers
- **addresses** (`Backend/src/api/v1/addresses.py`)
- **contractors** (`Backend/src/api/v1/contractors.py`)
- **customers** (`Backend/src/api/v1/customers.py`)
- **curators** (`Backend/src/api/v1/curators.py`)
- **health** (`Backend/src/api/v1/health.py`)
- **users** (`Backend/src/api/v1/users.py`)

All routers already expose CRUD‑style endpoints (create, list, get, delete) and additional helper routes (e.g., adding/removing addresses for a contractor, 2FA handling for users, DB setup, health checks). No obvious missing endpoints were found.

### Tasks for the backend
1. **Documentation** – Add OpenAPI tags/summary for any endpoint that lacks a clear description.
2. **Permissions** – Verify that admin‑only routes (`delete_*`) are protected by proper dependencies.
3. **Tests** – Implement unit/integration tests for each router (currently no test folder is present).
4. **Error handling** – Ensure consistent `HTTPException` usage and response models for error cases.
5. **Database migrations** – Confirm Alembic scripts are up‑to‑date with the current models.
6. **CI/CD** – Add a GitHub Actions workflow to run linting, type checking (`mypy`), and tests on push.

## Frontend (React + Vite + TypeScript)

### Service layer (`Frontend/Journal/src/services/*.ts`)
| Service file | Corresponding backend router | Endpoints covered |
|--------------|----------------------------|-------------------|
| `addresses.ts` | `addresses` | get all, get by id, create, delete |
| `contractors.ts` | `contractors` | get all, get by id, create, delete, add/remove address, list contractor addresses, list address contractors |
| `customers.ts` | `customers` | get all, get by id, create, delete |
| `curators.ts` | `curators` | get all, get by id, create, delete |
| `users.ts` | `users` | login, 2FA flows, logout, register, enable/disable 2FA |

**Missing backend endpoints:**
- Systems and Works relationships have models but no API routes (e.g., `/v1/systems`, `/v1/works`).

**Missing frontend services:**
- `addresses.ts`: `updateAddress`, `deleteAddress`
- `customers.ts`: `updateCustomer`, `deleteCustomer`, `activateCustomer`
- `contractors.ts`: `updateContractor`, `deleteContractor`, `addAddressToContractor`, `removeAddressFromContractor`, `listAddressesOfContractor`, `listContractorsOfAddress`
- `users.ts`: `updateUser`, `deleteUser`, `activateUser`
- Services for systems/works relationships (e.g., `systems.ts`, `works.ts`)
| `auth.ts` | (uses `users` endpoints) | token handling, refresh logic |
| `health.ts` | `health` | health check, DB check, DB setup |
| `api.ts` | – | generic Axios instance with base URL and interceptors |

**Missing frontend services:**
- `addresses.ts`: missing `updateAddress`, `deleteAddress`
- `customers.ts`: missing `updateCustomer`, `deleteCustomer`, `activateCustomer`
- `contractors.ts`: missing `updateContractor`, `deleteContractor`, `addAddressToContractor`, `removeAddressFromContractor`, `listAddressesOfContractor`, `listContractorsOfAddress`
- Missing services for systems/works relationships in address model

All services have functions that call the expected backend routes; there are no obvious missing stubs.

### Tasks for the frontend
1. **UI integration** – Wire the service functions to the UI components (e.g., `UsersRegistry`, `ContractorsWorkspace`). Verify that each CRUD operation is triggered from the UI.
2. **State management** – Add proper loading/error handling (e.g., using React Query or custom hooks).
3. **Form validation** – Ensure all create/edit forms validate input before sending requests.
4. **Authentication flow** – Implement token storage (`sessionStorage.ts`) and automatic header injection in `api.ts`.
5. **Routing protection** – Guard routes that require authentication.
6. **Tests** – Add component tests (Jest + React Testing Library) and service tests (mocked API).
7. **Styling** – Review Tailwind classes for responsiveness and accessibility.
8. **Documentation** – Update `README.md` with setup instructions for both backend and frontend, including required environment variables.

## Overall Project Checklist
- [ ] Verify that every frontend service function has a matching backend endpoint.
- [ ] Implement missing UI bindings for any stubbed components.
- [ ] Add comprehensive test coverage (backend + frontend).
- [ ] Harden authentication and permission checks.
- [ ] Set up CI pipeline (lint, type‑check, tests, build).
- [ ] Write deployment scripts / Dockerfiles if deployment is required.
- [ ] Update documentation and add a quick‑start guide.

*This plan does not modify any existing code; it only outlines the remaining work needed to bring the project to a production‑ready state.*