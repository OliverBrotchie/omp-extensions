---
name: combined-review
description: "Review a change with three parallel subagents: Standards (repo conventions), Spec (the originating issue or spec), and Quality (correctness, safety, load, tests, lean code). Use when the user asks to review a branch, PR, WIP, or \"review since X\"."
---

Three-axis review of the diff between `HEAD` and a fixed point the user supplies:

- **Standards**: does the code conform to this repo's documented coding standards?
- **Spec**: does the code faithfully implement the originating issue or spec?
- **Quality**: is the logic right, is it safe, does it hold under real load, is risky code tested, is it fast enough, and is every line needed? Read the connected code, not only the diff.

Each axis runs in its own **parallel sub-agent**, so one axis cannot mask another. The main agent aggregates the three reports side by side.

## Process

### 1. Pin the fixed point

Whatever the user said is the fixed point (a commit SHA, branch name, tag, `main`, `HEAD~5`, etc.). If they didn't specify one and the worktree has no uncommitted tracked changes, run `git fetch origin`, use `git merge-base origin/main HEAD`, and say which base you used. Ask for the fixed point only when there are uncommitted tracked changes, the current branch is `main`, or the base is ambiguous.

Capture the diff command once: `git diff <fixed-point>...HEAD` (three-dot, so the comparison is against the merge-base). Also note the commits: `git log <fixed-point>..HEAD --oneline`.

Before going further, confirm the fixed point resolves (`git rev-parse <fixed-point>`) and the diff is non-empty. A bad ref or empty diff fails here, not inside a sub-agent.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `Closes #45`, etc.), fetched from the repo's issue tracker.
2. A path the user passed.
3. A spec file under `docs/`, `specs/`, or `.scratch/` matching the branch or feature.
4. If nothing is found, ask the user where the spec is. If they say there isn't one, the Spec sub-agent reports "no spec available".

### 3. Identify the standards sources

Search the repo for every file that documents how code should be written. When `CODING_STANDARDS.md` or `CONTRIBUTING.md` exists, it must be on the list. Also read `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `README.md`, `docs/agents/`, and any repo-specific review, contribution, glossary, or domain docs.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below: a fixed set of Fowler code smells (Refactoring, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation. Skip anything tooling already enforces. If you suspect the tooling fails, run it: a finding about a linter, a type checker or a formatter is valid only with the command and its exit status quoted.

Each smell reads what it is -> how to fix; match it against the diff:

- **Mysterious Name**: a function, variable, or type whose name doesn't reveal what it does or holds. -> rename it; if no honest name comes, the design's murky.
- **Duplicated Code**: the same logic shape appears in more than one hunk or file in the change. -> extract the shared shape, call it from both.
- **Feature Envy**: a method that reaches into another object's data more than its own. -> move the method onto the data it envies.
- **Data Clumps**: the same few fields or params keep travelling together (a type wanting to be born). -> bundle them into one type, pass that.
- **Primitive Obsession**: a primitive or string standing in for a domain concept that deserves its own type. -> give the concept its own small type.
- **Repeated Switches**: the same switch/if-cascade on the same type recurs across the change. -> replace with polymorphism, or one map both sites share.
- **Shotgun Surgery**: one logical change forces scattered edits across many files in the diff. -> gather what changes together into one module.
- **Divergent Change**: one file or module is edited for several unrelated reasons. -> split so each module changes for one reason.
- **Speculative Generality**: abstraction, parameters, or hooks added for needs the spec doesn't have. -> delete it; inline back until a real need shows.
- **Message Chains**: long `a.b().c().d()` navigation the caller shouldn't depend on. -> hide the walk behind one method on the first object.
- **Middle Man**: a class or function that mostly just delegates onward. -> cut it, call the real target direct.
- **Refused Bequest**: a subclass or implementer that ignores or overrides most of what it inherits. -> drop the inheritance, use composition.

### 4. Spawn three sub-agents in parallel

Issue all three calls together, in the foreground, using the harness's review sub-agent. Aggregate the reports they return.

**Standards sub-agent prompt** should include:

- The full diff command and commit list.
- The list of standards-source files you found in step 3, plus the smell baseline from step 3 pasted in full (the sub-agent has no other access to it).
- The brief: "Read the code the hunks touch, not only the diff. Report, per file/hunk where relevant, (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls: documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces, and before you report a tooling failure run the repo's own check command and quote its exit status; a claimed failure the command does not reproduce is a finding about you. Under 400 words."

**Spec sub-agent prompt** should include:

- The diff command and commit list.
- The path or fetched contents of the spec.
- The brief: "Read the implementation the requirement names, not only the diff. Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

**Quality sub-agent prompt** should include:

- The diff command and commit list, and the fixed point.
- The entire `Quality review` section below, pasted in full, so the sub-agent has the checklist and output format.
- The brief: "Read the connected code, not only the diff. Report in the Quality review's output format. Report every finding with a concrete case. Do not change code."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

### 5. Aggregate

Present the three reports under `## Standards`, `## Spec`, and `## Quality` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings, because the three axes are deliberately separate (see *Why three axes*).

This is a review: report findings and do not edit code.

End with a one-line summary per axis: total findings, and the worst issue within that axis (if any). For the Quality axis, keep its `Verdict`, `Lean`, and `Not checked` lines; do not summarize them away. Don't pick a single winner across axes: that's the reranking the separation exists to prevent.

## Why three axes

A change can pass one axis and fail another:

- Code that follows every standard but implements the wrong thing -> **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions -> **Spec pass, Standards fail.**
- Code that does both and still carries a bug, an untested branch, a load problem, or code that should not exist -> **Quality fail.**

Reporting them separately stops one axis from masking another.

## Quality review

Review a change like the senior developer who will be paged when it breaks. Order of importance: correct, safe, holds under load, tested, fast, lean. Lean still matters: every extra line must be read, tested and fixed later. This is a report the user asked for, so give it in full.

### Understand first

- Review the diff the caller gives you, then the code it touches: callers of every changed function, the functions it calls, the tests, the README.
- Trace the real flow: where data comes in, what is stored, what goes out.
- A change can break code it does not touch. When a signature, return value or behavior changes, grep every caller.
- Find the expected load in the repo (README, deploy config): one person running a script, or many users and processes at once. Judge scale against that, and say which load you assumed.

### Look for

1. **Bug:** wrong result, crash, missed edge case (empty, zero, last item, rounding, time zones), a caller broken by the change, a fix applied in one caller while the shared function stays broken.
2. **Risk:** security holes (injection, weak randomness, secrets, missing checks on input from users), data loss (errors swallowed, writes in the wrong order, no transaction).
3. **Scale:** fine for one user, wrong for many: check-then-write races, the same work done by every process, memory or lists that only grow, a query per item, O(n^2) on big input, per-process state that must be shared.
4. **Missing test:** risky new logic (a branch, a parser, money, security, data writes, a bug fix) with no test that fails when it breaks. One good test, not coverage.
5. **Speed:** big slowdowns are problems. Small wins (work repeated in a hot loop) are suggestions; some software counts every millisecond.
6. **Lean:** code that should not exist or should be smaller.
   - delete: dead code, unused options, speculative features
   - reuse: the repo already has this helper (name the path)
   - stdlib / native: the standard library or platform already does it; a new dependency for a few lines
   - yagni: abstraction with one implementation, config nobody sets
   - merge: near-copies that must change together
   - split: one function doing several unrelated jobs, so it is hard to read or test. Split by job, never by line count, and never into helpers that exist only to make a function shorter.

### Check before you report

- Every finding needs a concrete case: "this input or situation leads to this wrong result". No case, no finding.
- Re-read the lines and confirm: the caller exists, the value can really be empty, the code really is unused.
- A shortcut marked with a `shortcut:` (or older `ponytail:`) comment that names its limit is a decision, not a finding, unless the expected load already crosses it.
- Propose the smallest fix that works. Prefer fixes that delete code. Never add layers, frameworks or config the problem does not need.
- No style taste, no "consider", no vague worries.

### Output

Very simple English: short sentences, everyday words. Explain a technical term the first time you use it. The reader may never have seen this code.

Start with `What this change does:` in two or three sentences.

Then the findings in three groups, skip empty groups:

- **Must fix:** bug, security, data loss, breaks at the expected load.
- **Should fix:** risky code without a test, real slowness, duplication, a function that mixes jobs, code that should not exist.
- **Nice to have:** small speed-ups, shorter forms.

Number findings across all groups, so the user can say "fix 2 and 5". Every finding has all four parts, each one or two short sentences:

2. **Orders land on the wrong day** (`billing/close_day.py:L40-52`)
   - **What this is:** At midnight this job closes the day and bills all orders of that day.
   - **Problem:** It takes "today" from the server clock, which runs in UTC. An order placed at 00:30 in Berlin is billed on the day before.
   - **Fix:** Compute the day once in the shop's time zone: `datetime.now(ZoneInfo("Europe/Berlin")).date()`. One line, nothing else changes.
   - **If we skip it:** Late orders show the wrong date, and accounting fixes them by hand.

End with:

- `Verdict: Ship.` or `Verdict: fix 1 and 3 first.`
- `Lean: -<N> lines possible.` when lean findings exist.
- `Not checked:` one line, if something mattered and you could not check it.

Nothing found: `What this change does:`, then `Looks good. Ship.` and one line on what you checked.

Lists findings, changes no code.
