Frontend - Astro z React dla komponentów interaktywnych:
- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:
- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

Testing & Quality:
- Vitest 4 do testów jednostkowych z coverage (provider: v8)
- Playwright 1.49 do testów E2E (Chromium, Firefox, WebKit)
- ESLint + Prettier do lintowania i formatowania kodu
- Husky do pre-commit hooks

CI/CD i Hosting:
- GitHub Actions do tworzenia pipeline'ów CI/CD
  - Workflow dla pull requestów: Lint → (Unit + E2E Tests równolegle) → Status Comment
  - Artefakty: coverage reports, raporty Playwright
  - Środowisko integration z sekretami Supabase
- DigitalOcean do hostowania aplikacji (planowane)
