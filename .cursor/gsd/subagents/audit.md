# Subagent: Audit / Verification

**Id:** audit  
**Subagent type:** explore  
**When:** User says "Run audit" or "Verify project against TECHSPEC" or after Phase 06 to confirm DoD.

---

## Context to attach

- `TECHSPEC.md`
- `STATE.md`
- `.planning/` (list of phase SPECs and SUMMARYs)
- Project structure (src/, app/, services/, etc.)

---

## Prompt

```
Read TECHSPEC.md and compare the project to it. Perform the following checks and write the result to .planning/TECHSPEC-AUDIT.md:

1. **§1.3 test cases** — List each test case from §1.3 and map it to the test file and describe block that covers it. If any case is missing, list it as UNCOVERED.

2. **§8.3 Definition of Done** — For each bullet in §8.3, state MET or NOT MET and give one-line evidence (e.g. file path, commit, or "missing: ...").

3. **Phases 01–06** — Compare STATE.md phase status with actual code and .planning/ SUMMARYs. List each phase and whether it appears complete (spec + summary + merged branch).

4. **README** — Confirm README exists and addresses §1.5 and §8.3 (how to run app and tests; decisions and assumptions).

5. **Coverage** — If the project has tests, run "npm test -- --coverage" and report the coverage percentage vs §6.2 (80% minimum). If tests cannot be run in this environment, note that.

Output: write a single file .planning/TECHSPEC-AUDIT.md with the above sections. Do not modify other files unless the user explicitly asks to fix gaps.
```

---

## Success criteria

- .planning/TECHSPEC-AUDIT.md created with: §1.3 mapping, §8.3 DoD checklist, phase status, README check, coverage note.
- No other files changed unless the user asked to fix issues.

---

## FRAMEWORK reference

FRAMEWORK.md §5 — Optional: Audit / Verification.
