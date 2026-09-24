# Lumatic

Personal life management webapp. Self-hosted, mobile-responsive.

---

## Modules

| Module | Version | Description |
|--------|---------|-------------|
| **Hábitos** | V0 — active | Habit tracking with streak counters, weekly/monthly grid and progress bars |
| **Tarefas** | V1 — active | Task management — list grouped by date and Kanban board view, with user-defined columns and priority |
| **Eventos** | V2 — active | Scheduled events with title, date, optional start/end time and description, browsed by month |
| **Financeiro** | V3 | Income, expenses and balance cards — pie chart by category and transaction history |
| **Ferramentas** | V4 | Pomodoro timer with current-task display |
| **Diário** | V5 | Daily journal — date list on the left, distraction-free editor on the right |

**Tarefas** in detail:

- **Columns** (Kanban) are created, renamed, recolored and reordered in the UI. Exactly one column is the
  *done* column: a task gets `completed_at` when it enters it and loses it when it leaves. Only empty columns
  can be deleted, and the done column cannot be deleted.
- **Priority** is a fixed field: none (default), low, medium or high. It colors the left edge and tag of the
  Kanban card and of the list row (the list shows one task per row).
- The done column is marked with a *Concluídas* badge on the board, so it is clear which tasks count as done.
- The starting columns (*A fazer*, *Em andamento*, *Concluída*) are created by the migration; like any user
  data they are not translated.

**Calendário** — a collapsible panel opened from the top bar, shown above the current page (the choice is
remembered in the browser). It shows any month/year with dated items from every module: events and task
due dates for now. Picking a day shows what is already scheduled there (the list starts collapsed and
opens with the arrow next to the date).
It is a view, not a module: it reads through each module's service and stores nothing (see below).

**Eventos** and **Tarefas** share the same flow: a quick-add form at the top of the page, and a dialog for
editing the details (description, etc.).

**Lixeira (Trash)** — deleted items from every module go to the trash, where they can be restored or permanently deleted. Items are purged automatically after a retention period (default 30 days, editable in **Configurações / Settings**).

---

## Interface

- Left sidebar with the modules; a top bar with the Calendário panel toggle and app-wide pages (Lixeira, Configurações)
- Lixeira groups deleted items by module
- Theme — light / dark / system (default), chosen in Settings and saved in the browser
- Language — Português (default) / English, chosen in Settings and saved in the browser
- Fully responsive — works on mobile via PWA install from browser

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend language | Python 3.12 LTS |
| Backend framework | FastAPI + SQLAlchemy 2 + Alembic |
| Database | PostgreSQL 16 |
| Frontend language | TypeScript 5.x (strict mode) |
| Frontend framework | React 18 + Vite 5 |
| Styling | TailwindCSS 3 + shadcn/ui |
| Server state | React Query v5 |
| Mobile | PWA via vite-plugin-pwa |
| Infrastructure | Docker + Docker Compose |

Architecture: **Modular Monolith** with Clean Architecture per module.
Each module owns its domain, service, repository, API, and tests.
Modules do not share database tables.

### Trash (cross-module)

- **Problem:** deletions in every module must be recoverable for a while, then disappear on their own.
- **Approach:** each module soft-deletes its own rows (`deleted_at`) and exposes list / restore / purge operations
  through its service. The `trash` module owns no tables: it aggregates modules through the `TrashSource`
  contract (`trash/domain/sources.py`), with one adapter per module in `trash/infrastructure/sources.py`.
- **Automatic purge:** a background task started in the FastAPI lifespan purges items older than the retention
  period at startup and every 24 hours (disable with `TRASH_AUTO_PURGE=false`). Retention lives in the
  `preferences` module.
- **Adding a module to the trash:** add `deleted_at` + trash operations to the module, write its adapter and
  register it in `build_trash_service`.
- **Trade-off:** an in-process loop instead of a job scheduler — enough for a single self-hosted instance; with
  several API replicas each would run its own (idempotent) purge.

### Calendar (cross-module view)

- **Problem:** one calendar should show what every module has on each day, without a shared table that would
  duplicate module data and drift out of sync.
- **Approach:** same pattern as the trash. `calendar_view` owns no tables and never writes; it aggregates
  modules through the `CalendarSource` contract (`calendar_view/domain/sources.py`), with one adapter per
  module in `calendar_view/infrastructure/sources.py`. `GET /api/v1/calendar/items?from=&to=` returns the
  merged items. The calendar never creates items; that happens in each module's page.
- **Naming:** the package is `calendar_view` because `calendar` would shadow Python's standard library module.
- **Adding a module to the calendar:** give its service a "items between two dates" query, write its adapter
  and register it in `build_calendar_service`.

---

## Getting Started

**Prerequisites:** Docker and Docker Compose.

```bash
git clone https://github.com/[user]/Lumatic.git
cd Lumatic
cp backend/.env.example backend/.env
docker-compose up
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## Manual Setup (without Docker)

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm ci
npm run dev
```

---

## Development Commands

```bash
# Tests
pytest                          # backend
npm test                        # frontend

# Lint and typecheck
flake8 backend/ && mypy backend/
npm run lint
npm run typecheck

# Database migrations
alembic revision --autogenerate -m "description"
alembic upgrade head
```

---

## Project Structure

```
Lumatic/
├── backend/
│   ├── app/main.py
│   ├── core/               (config, database)
│   ├── habits/             (V0)
│   ├── preferences/        (app-wide settings, e.g. trash retention)
│   ├── trash/              (aggregates deleted items from every module)
│   ├── calendar_view/      (aggregates dated items from every module; read-only)
│   ├── tasks/              (V1)
│   ├── events/             (V2)
│   ├── financial/          (V3)
│   ├── tools/              (V4)
│   ├── diary/              (V5)
│   └── requirements.txt
└── frontend/
    └── src/
        ├── modules/        (one folder per module)
        ├── shared/         (shared components)
        └── layouts/        (app shell: sidebar, top bar)
```

Each backend module follows: `domain/ → application/ → infrastructure/ → api/ → tests/`

---

## License

Private use only.