# Subagent: Bootstrap

**Id:** bootstrap  
**Subagent type:** generalPurpose  
**When:** One-time setup of a new project before Phase 01.

---

## Context to attach

- `TECHSPEC.md`
- `FRAMEWORK.md`

---

## Prompt

```
You are bootstrapping a GSD-style project. Read TECHSPEC.md and FRAMEWORK.md.

1. Create STATE.md at the root using the template in FRAMEWORK.md §1. Set current phase to "Phase 01 — Foundation (in progress)" and next task to the first phase goal (e.g. create branch feature/phase-01-foundation, install deps per TECHSPEC §2.2, set up Biome, scaffold app per §3.2).

2. Create .planning/ with .gitkeep.

3. Create .planning/phase-00-ROADMAP.md using the template in FRAMEWORK.md §1. Read the TECHSPEC and break it into implementable phases (01–06 or as many as needed). Each phase should be completable in one chat session. Map each phase to the relevant TECHSPEC sections. Use the table format from the template.

4. Commit everything to main. Do not write any app code yet.
```

---

## Success criteria

- STATE.md exists at root with Phase 01 as current and a concrete next task.
- .planning/ exists with .gitkeep.
- .planning/phase-00-ROADMAP.md exists with a phase table derived from the TECHSPEC.
- All of the above committed to main; no application source files created.

---

## FRAMEWORK reference

FRAMEWORK.md §2 — One-Time Bootstrap.
