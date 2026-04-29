# GSD Subagent Methodology

This folder defines **subagent prompts and context** for the GSD-style pipeline. Use it to scale the workflow with Cursor's subagent (MCP task) capability. The design is **project-agnostic**: phase structure comes from each project's **ROADMAP** and **TECHSPEC**, so the same `.cursor/gsd/` works for any project that uses the framework.

---

## When to use subagents

- **Long phases** — Any phase with many atomic commits can be handed to a subagent so the main chat stays focused.
- **Fresh context** — Subagents start with only the context you pass; they don't carry prior chat noise.
- **Audit** — The audit task is read-heavy and benefits from a dedicated subagent (e.g. `explore` type) that compares TECHSPEC to the codebase and writes the audit file.
- **Bootstrap** — One-time setup (STATE.md, .planning/, roadmap) can be delegated so the main agent doesn't mix bootstrap with Phase 01.

---

## How to invoke

### Option A: User asks, main agent delegates

When the user says **"GSD session start — Phase NN"** (any number), **"Run bootstrap"**, or **"Run audit"**:

1. **Phases**: Use the **generic** `subagents/phase.md`. Pass the phase number (NN) in the prompt. The subagent will read **this project's** `.planning/phase-00-ROADMAP.md` and TECHSPEC to know what Phase NN means. No project-specific phase file is required.
2. **Bootstrap**: Use `subagents/bootstrap.md` (generic: creates STATE, .planning/, roadmap from TECHSPEC).
3. **Audit**: Use `subagents/audit.md` (generic: compare project to TECHSPEC, write TECHSPEC-AUDIT.md).

Then call **mcp_task** with the prompt from that file (for phase, substitute NN with the actual number), **subagent_type** (generalPurpose or explore for audit), and **attachments** (TECHSPEC.md, STATE.md, ROADMAP, FRAMEWORK.md as listed in the file).

### Option B: User invokes directly

User opens a new chat and pastes the prompt from the subagent file (for phase, use "Phase NN" and attach ROADMAP + TECHSPEC). No delegation; the main agent runs the phase. Subagent files remain the canonical prompt source.

---

## Subagent index (generic)

| Id        | File                 | Purpose                                                                 | Subagent type   |
| --------- | -------------------- | ----------------------------------------------------------------------- | --------------- |
| bootstrap | `subagents/bootstrap.md` | One-time: STATE.md, .planning/, phase-00-ROADMAP.md from TECHSPEC       | generalPurpose  |
| phase     | `subagents/phase.md` | **Any** Phase NN; scope comes from this project's ROADMAP + TECHSPEC    | generalPurpose  |
| audit     | `subagents/audit.md` | Compare project to TECHSPEC; write .planning/TECHSPEC-AUDIT.md           | explore         |

There are no separate files for "Phase 01", "Phase 02", etc. The **phase structure** (names, goals, TECHSPEC sections) is defined per project in `.planning/phase-00-ROADMAP.md`. The generic phase subagent reads that file so it works for 01–06, 07+, or a completely different breakdown (e.g. 01–05 or 01–10).

---

## Bugfixes (FRAMEWORK §6.3)

For **bug fixes**, use the same phase flow with the prompt:

```
GSD session start — Phase NN (bugfix: <short description>).
```

- **Phase NN**: Use the phase number that owns the affected code (from ROADMAP), or the next phase number if the bug spans multiple areas.
- **SPEC**: Create and commit a spec (e.g. `.planning/phase-NN-SPEC-BUGFIX-<slug>.md`) that describes: **bug** (observed vs expected), **root cause** (if known), **fix approach**. Commit the SPEC before implementation.
- **Tests**: Include or update tests that reproduce the bug before the fix (red → green). Same gate (`npm test && npx biome check .`), same SUMMARY, same merge.
- **Branch**: `feature/phase-NN-bugfix-<slug>`; for critical hotfixes use `hotfix/phase-NN-<slug>` but still SPEC first and SUMMARY before merge.

The same **phase.md** subagent handles bugfix sessions: it reads ROADMAP + TECHSPEC and runs the workflow; the SPEC content is bug-focused instead of feature scope.

---

## Example: different project, different phases

- **Project A** (this repo): ROADMAP has 01 Foundation, 02 Data+Store, 03 Services+MSW, 04 Orchestration+UI, 05 Manual Analysis, 06 Tests. User says "GSD session start — Phase 03" → subagent runs with phase.md, reads ROADMAP, sees Phase 03 = "Services + Mocking" and the listed TECHSPEC sections, and executes that.
- **Project B**: ROADMAP has 01 Setup, 02 API layer, 03 Screens, 04 Tests. User says "GSD session start — Phase 02" → same phase.md, subagent reads Project B's ROADMAP and TECHSPEC and runs Phase 02 for that project.

---

## Rule integration

The rule `.cursor/rules/gsd-subagent-router.mdc` tells the main agent to delegate "GSD session start — Phase NN", "Run bootstrap", or "Run audit" to the appropriate subagent (phase.md with NN, bootstrap.md, or audit.md) and pass the right context.

---

## Reference

- **FRAMEWORK.md** — Full pipeline (files to take, bootstrap, phase prompts, audit, post-launch).
- **TECHSPEC.md** — Single source of truth; §8 = plan constraints and DoD.
- **STATE.md** — Current phase and next task.
- **.planning/phase-00-ROADMAP.md** — Defines phase names, goals, and TECHSPEC sections for **this** project; created at bootstrap.
