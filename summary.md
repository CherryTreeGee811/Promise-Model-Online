## Objective
- Reach 70%+ TypeScript client test coverage (currently **61.23%** after Phase 4). Continue Phase 4 "heavyweights first" to close the gap.

## Important Details
- TS tests use vitest with jsdom environment; coverage via `@vitest/coverage-v8`, reporter `['text', 'clover']`.
- Node.js v26 `localStorage` warning silenced via `NODE_OPTIONS='--no-experimental-webstorage'`.
- Codecov has per-flag 70% targets: TS coverage will fail until 70% is reached.
- All tests should have `// Arrange`, `// Act`, `// Assert` comments.
- Production code bugs found by tests must be fixed (not worked around).
- D3 graph rendering (canvas/SVG) is mocked or tested at the pure-function level, not the rendering level.
- Phase 4 order: `strides/list.ts` ✓ → `moments/detail.ts` ✓ → `stack-graph-core.ts` ✓ → `graph-context-menu.ts` → `projects/graph.ts` → `epics/detail.ts`, `journeys/detail.ts`, `flows/detail.ts` → `utils/burndown.ts`.

## Work State
### Completed
- **Phase 1** (test fixes): `scrollIntoView` polyfill in `vitest.setup.ts`, fixed assertions in `projects-list`, `projects-history`, `moments-my-tasks`, `comments-autocomplete`. All original failures resolved.
- **Phase 2** (projects modules): `projects-share.test.ts` (18 tests, +revoke flow), `projects-add.test.ts` (14 tests), `projects-settings.test.ts` (17 tests). Production fix: export/delete buttons got `type="button"`.
- **Phase 3** (quick-win test files): `projects-api.test.ts` (56 tests), `projects-audit.test.ts` (16 tests), `iteration-create-modal.test.ts` (12 tests), `stride-create-modal.test.ts` (17 tests), `iterations-list.test.ts` (20 tests).
- **Dev infra**: Prettier, `.prettierrc`, `.editorconfig` expanded, `format`/`lint:fix` scripts.
- **Phase 4 heavyweights**:
  - `strides-list-page.test.ts` (22 tests). `strides/list.ts` coverage: 16% → **55.1%**.
  - `moments-detail.test.ts` (42 tests). `moments/detail.ts` coverage: 4% → **86.23%**.
  - `stack-graph-core.test.ts` (42 tests, 11 exported pure functions). `stack-graph-core.ts` coverage: ~15% (limited by D3 rendering code).
- **Production bugs fixed**: Status/type revert in `detail.ts` (captures previousValue properly). Export button double-submit in `settings.ts`.
- **Coverage**: 43.87% → **61.23%** (704 tests across 76 files, all passing).

### Active
- **Phase 4 continues**: Next target `projects/graph-context-menu.ts` (low coverage).

### Blocked
- (none)

## Next Move
1. Write tests for `projects/graph-context-menu.ts`.
2. Continue through remaining heavyweights: `projects/graph.ts`, `epics/detail.ts`, `journeys/detail.ts`, `flows/detail.ts`, `utils/burndown.ts`.
3. Run full suite + coverage check after each major file.

## Relevant Files
- `PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts`: Low coverage, context menu logic.
- `PromiseModelOnline.Client/wwwroot/js/projects/graph.ts`: 37%, graph rendering shell.
- `PromiseModelOnline.Client/wwwroot/js/utils/burndown.ts`: 33%, burndown chart logic.
- `PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts`: 20%, permission helpers.
- `PromiseModelOnline.Client/wwwroot/js/utils/inline-edit-add-form.ts`: 20%, inline add form.
- Existing passing tests: 704 across 76 files.
