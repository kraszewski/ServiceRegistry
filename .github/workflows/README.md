# GitHub Workflows

This directory contains GitHub Actions workflows for CI/CD automation.

## Available Workflows

### Pull Request CI (`pull-request.yml`)

Automated CI pipeline that runs on every pull request to the `master` branch.

#### Workflow Steps:

1. **Lint** - Code quality check using ESLint
2. **Unit Tests** (parallel after lint) - Run unit tests with coverage
3. **E2E Tests** (parallel after lint) - Run end-to-end tests with Playwright
4. **Status Comment** - Post summary comment to the PR

#### Environment Requirements:

The E2E tests run in the `integration` environment and require the following secrets:
- `PUBLIC_SUPABASE_URL` - Supabase project URL for integration testing
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key for integration testing

#### Artifacts:

The workflow generates and stores the following artifacts (retained for 7 days):
- Unit test coverage reports
- E2E test coverage reports
- Playwright test reports

#### Branch:

The workflow uses the `master` branch as the target for pull requests.

## Setting Up GitHub Secrets

To enable E2E tests in CI, configure the following secrets in your repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following repository secrets:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
3. Create an **integration** environment in **Settings** → **Environments**
4. Add the same secrets to the integration environment

## Local Testing

Before pushing, you can test the workflow steps locally:

```bash
# Run linting
npm run lint

# Run unit tests with coverage
npm run test:run -- --coverage

# Run E2E tests (requires Playwright installation)
npm run test:e2e
```

## Troubleshooting

### E2E Tests Failing

- Ensure Playwright browsers are installed: `npx playwright install --with-deps`
- Check that environment variables are properly set in GitHub secrets
- Verify the integration environment is configured

### Coverage Reports Missing

- Make sure `@vitest/coverage-v8` is installed
- Check that the coverage artifacts are being uploaded correctly
- Verify the artifact retention period hasn't expired

### Status Comment Not Appearing

- Ensure the workflow has `pull-requests: write` permission
- Check that the GitHub token has proper access
- Verify the comment creation logic in the workflow file
