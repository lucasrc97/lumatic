# Lumatic

Personal life management webapp. Self-hosted, mobile-responsive.

---

## Modules

| Module | Version | Description |
|--------|---------|-------------|
| **Hábitos** | V0 — active | Habit tracking with streak counters, weekly/monthly grid and progress bars |
| **Tarefas** | V1 | Task management — list grouped by date and Kanban board view |
| **Eventos** | V2 | Calendar events with color categories and quick-add sidebar |
| **Financeiro** | V3 | Income, expenses and balance cards — pie chart by category and transaction history |
| **Ferramentas** | V4 | Pomodoro timer with current-task display |
| **Diário** | V5 | Daily journal — date list on the left, distraction-free editor on the right |

**Calendário** — unified view that aggregates events, task due dates, habit schedules and financial payment dates from all modules. It is a view, not a standalone module.

---

## Interface

- Collapsible left sidebar (or repositionable per user preference)
- Dark / light theme toggle
- Language toggle — Português (default) / English; the choice is saved in the browser
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
        └── layouts/        (sidebar, calendar view)
```

Each backend module follows: `domain/ → application/ → infrastructure/ → api/ → tests/`

---

## License

Private use only.