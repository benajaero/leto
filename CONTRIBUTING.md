# Contributing to LETO

Thanks for helping improve LETO. This guide covers the workflow, coding standards, and how to propose changes.

## Quick start

```bash
pnpm install
pnpm run dev
```

Run tests:

```bash
pnpm test
```

Run lint:

```bash
pnpm run lint
```

## Project structure

- `src/ui`: React UI and view components
- `src/engine`: Core computation and metrics
- `src/data`: Data fetchers and caching
- `src/workers`: Engine worker
- `spec.md`: MVP requirements and behaviors

## Development workflow

1) Create a branch from `main`.
2) Make a focused change set.
3) Run `pnpm run lint` and `pnpm test`.
4) Open a PR with a clear summary and verification steps.

## Spec-first changes

If your change affects behavior, outputs, or UX, update `spec.md` so the spec and implementation stay aligned.

## Code style

- Keep functions small and readable.
- Prefer clear naming over abbreviations.
- Add comments only when logic is not obvious.

## Reporting issues

Use the GitHub issue templates. Include steps to reproduce, expected behavior, and actual behavior.

## License

By contributing, you agree that your contributions are licensed under CC BY-SA 4.0.
