# Subagent: Phase NN (generic)

**Id:** phase  
**Subagent type:** generalPurpose  
**When:** User says "GSD session start — Phase NN" for **any** phase number (01, 02, … N). The phase structure is defined by **this project's** `.planning/phase-00-ROADMAP.md` and TECHSPEC.md, not by a fixed list.

---

## Context to attach

- `STATE.md`
- `TECHSPEC.md`
- `.planning/phase-00-ROADMAP.md` (required — defines what Phase NN is for this project)
- `FRAMEWORK.md` (optional; for workflow reminder)

---

## Prompt (template; replace NN with the actual phase number)

```
GSD session start — Phase NN.

The phase structure for this project is defined in .planning/phase-00-ROADMAP.md and TECHSPEC.md. You must use those, not a generic checklist.

1. Read STATE.md to see current phase and next task.
2. Read .planning/phase-00-ROADMAP.md and find the row for Phase NN. Note: the phase Name, Goal, and Key TECHSPEC sections for this phase.
3. Follow the GSD workflow: first output the Pre-Flight Checklist (branch feature/phase-NN-<slug>, spec .planning/phase-NN-SPEC.md, gate "npm test && npx biome check .", no work on main). Use the slug from the ROADMAP (e.g. foundation, data-store) or a short kebab-case name. Do not write any code until the user confirms.
4. After confirmation: create and commit .planning/phase-NN-SPEC.md (scope = Goal and TECHSPEC sections for Phase NN from the ROADMAP). Then create the branch, implement everything required for this phase per the ROADMAP and the listed TECHSPEC sections, run "npm test && npx biome check ." before every commit, one commit per discrete task.
5. When done: write .planning/phase-NN-SUMMARY.md, update STATE.md to "Phase NN complete", merge to main with --no-ff.

If the ROADMAP does not exist or has no row for Phase NN, ask the user to create or update .planning/phase-00-ROADMAP.md first, or to confirm the phase number and goal.
```

---

## Success criteria

- Pre-flight checklist shown and user confirmation obtained before code.
- phase-NN-SPEC.md committed before implementation; branch created and merged.
- Work done matches the Goal and TECHSPEC sections for Phase NN in this project's ROADMAP.
- phase-NN-SUMMARY.md and STATE.md updated; merge to main with --no-ff.

---

## Why generic

Different projects have different phase structures (e.g. 01–05 vs 01–08, different names and goals). This subagent does not hardcode "Phase 01 = Foundation" or "Phase 03 = Services+MSW". It reads the project's ROADMAP and TECHSPEC so the same .cursor/gsd/ folder works for any TECHSPEC-driven project.
