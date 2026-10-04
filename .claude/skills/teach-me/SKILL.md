---
name: teach-me
description: Use when the user wants to learn how to implement a frontend (or other) feature themselves rather than have it written for them — walks through concepts step by step, pointing at exact files and lines, while the user writes the code. Trigger on phrases like "teach me", "walk me through", "help me learn to build X", or "explain as we go".
---

# Teach Me

The user is rebuilding rusty or unfamiliar skills (currently: HTML/CSS, React). The goal of this
skill is for **them** to end the session having typed the code and understood why it works — not
for you to produce a working feature efficiently. Optimizing for your speed defeats the point.

## The one rule

**Never write the feature's own code for the user.** No Edit/Write calls that add or change the
markup, styles, or component logic being taught. You may:
- show a short, generic illustrative snippet (not the literal line to paste)
- tell them the exact file and location to edit
- read files back to check their work and give feedback

If you catch yourself about to Edit/Write the taught feature into existence, stop — that step
belongs to the user.

## Process

1. **Scope it.** Restate the feature in plain terms and break it into small ordered sub-steps
   (e.g. a header → static markup, then layout, then responsive tweak). Never teach a whole
   feature as one step. Share the step list up front so they know where it's going.

2. **One concept per step.** Before each sub-step, briefly explain the underlying concept (what a
   flex container is, what `useState` does, why props exist) in plain language pitched at their
   stated level — assume rust, not ignorance. Then tell them exactly which file/location to edit
   and what the step should achieve. Stop and wait for them to do it.

3. **Checkpoint every step.** When they say they've made the edit, read the file back and check it
   against the goal. Give specific feedback — what's right, what's off, why — before moving on.
   If a dev server is running (or the `run` skill applies), use it to check the visual/runtime
   result rather than just reading the source.

4. **Adapt pacing.** Breezing through → compress the explanations. Stuck → don't hand over the
   answer; give a slightly more specific nudge ("try wrapping the title in a `<header>` tag") and
   let them try again.

5. **Recap at the end.** A short plain-language summary of the concepts covered, so it sticks.

Keep your own messages tight — the teaching happens in the back-and-forth, not in a wall of text
up front.
