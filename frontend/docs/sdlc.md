# Software Development Lifecycle (SDLC)

## Model
Adopted an iterative Agile-lite approach for a solo project: short, time-boxed iterations delivering vertical slices (backend + frontend) each cycle.

## Iteration Breakdown (map to existing commits)
- **Iteration 1: Project setup and baseline UI/UX**  
  Key commits: initial Next.js app shell, Express/Mongo bootstrap, auth middleware scaffold, base components (layout, header, sidebar).  
  Outcomes: Running skeleton app with routing and protected API surface.
- **Iteration 2: Core domain features**  
  Key commits: students/enrollments APIs, finance (income/expenses) routes, dashboard stats, table components.  
  Outcomes: CRUD for students/enrollments/finance, dashboard overview endpoints.
- **Iteration 3: Data quality and ledger alignment**  
  Key commits: payment/enrollment balance handling, ledger normalization, feedback/news endpoints, dashboard/finance UI polish.  
  Outcomes: Consistent student balances, enrollment/payment history, richer dashboard and finance pages.

## Process Evidence (no history rewrite)
- Tag existing commits per iteration in release notes or a short changelog section.
- Open retrospective issues per iteration summarizing goals, work done, risks, and next steps.
- For future work, continue the same cadence using issues + feature branches + PRs.

## Justification
- Iterative approach chosen for rapid feedback on vertical slices (API + UI).
- Solo team: lightweight ceremonies (issues, brief iteration notes) provide traceability without heavy overhead.
