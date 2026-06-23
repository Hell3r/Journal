Add API endpoints for systems/works relationships in backend
Implement frontend services for systems/works in address model
Update database health checks to include systems/works status
Add missing frontend services for addresses (update, delete)
Add missing frontend services for customers (update, delete, activate)
Add missing frontend services for contractors (update, delete, add/remove address, list contractor addresses, list address contractors)
Add frontend services for users (update, delete, activate)
Add frontend services for systems/works relationships
Documentation – Add OpenAPI tags/summary for any endpoint that lacks a clear description.
Permissions – Verify that admin‑only routes (delete_*) are protected by proper dependencies.
Tests – Implement unit/integration tests for each router
Error handling – Ensure consistent HTTPException usage and response models for error cases.
Database migrations – Confirm Alembic scripts are up‑to‑date with the current models.
CI/CD – Add a GitHub Actions workflow to run linting, type checking (mypy), and tests on push.
UI integration – Wire the service functions to the UI components (e.g., UsersRegistry, ContractorsWorkspace). Verify that each CRUD operation is triggered from the UI.
State management – Add proper loading/error handling (e.g., using React Query or custom hooks).
Form validation – Ensure all create/edit forms validate input before sending requests.
Authentication flow – Implement token storage (sessionStorage.ts) and automatic header injection in api.ts.
Routing protection – Guard routes that require authentication.
Tests – Add component tests (Jest + React Testing Library) and service tests (mocked API).
Styling – Review Tailwind classes for responsiveness and accessibility.
Documentation – Update README.md with setup instructions for both backend and frontend, including required environment variables.
Verify that every frontend service function has a matching backend endpoint.
Implement missing UI bindings for any stubbed components.
Add comprehensive test coverage (backend + frontend).
Harden authentication and permission checks.
Set up CI pipeline (lint, type‑check, tests, build).
Write deployment scripts / Dockerfiles if deployment is required.
Update documentation and add a quick‑start guide.