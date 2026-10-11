---
title: "Accessibility engineering"
author: Dhruv Doshi
date: 2026-10-01
reviewed: 2026-10-01
status: published
topic: Frontend architecture
categories: [Frontend, Accessibility, UX]
---

Accessibility is treated as a checklist item in most organizations: run the automated audit, fix the contrast ratios, ship it. That approach produces apps that pass audits and still do not work for the people they are supposed to serve. Accessibility is an engineering discipline, not a QA gate. It starts with semantic HTML, runs through keyboard operability and focus management, uses ARIA sparingly and correctly, and gets verified by testing with actual assistive technology — baked into CI and the design system so it is the default, not the exception.

## The real problem

The checklist model fails for a structural reason: automated tools can only check about a third of what matters. A linter can tell you an image is missing alt text. It cannot tell you the alt text is wrong, or that the keyboard focus disappears into a modal trap, or that the "accessible" custom dropdown announces itself as seventeen unlabeled buttons. The things automation catches are the easy things. The things that actually block users are interaction problems, and those require engineering judgment.

The deeper problem is timing. Accessibility work that happens at the end — the "a11y pass" before launch — is the most expensive and least effective kind. By then, the component APIs are frozen, the design system is published, and every fix is a retrofit. A modal component that was built without focus management does not get "an a11y fix"; it gets rewritten, or it ships broken. Accessibility has to be a design constraint from the start, the same way performance budgets are: not a feature you add, but a property the system has.

And the business case is not charity. Roughly one in six people lives with a significant disability. Keyboard-only users include power users who never touch a mouse. Accessible apps are more robust apps: semantic HTML is easier to test, focus management forces you to think about interaction states, and the discipline of labeling everything improves the experience for voice-control users, mobile users, and everyone on a bad connection with images disabled.

## Semantic HTML first

This is the single highest-leverage accessibility practice, and it is free. Before any ARIA, any JavaScript, any framework abstraction: use the right element.

```html
<!-- Don't build a button out of a div -->
<div class="btn" onclick="submit()">Save</div>

<!-- Use a button. You get keyboard support, focus, semantics, for free -->
<button type="submit">Save</button>
```

A native `<button>` gives you keyboard operability (Tab, Enter, Space), focus indication, correct screen-reader announcement ("button, Save"), and disabled-state semantics — with zero code. The `<div>` version gives you none of that, and every piece must be reimplemented by hand, usually badly. Multiply this across every interactive element in an app and you see why "just use the div" is the root of most accessibility debt.

The elements that do the most work:

- **Landmarks**: `<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`. Screen-reader users navigate by landmarks the way sighted users scan a layout. An app with one giant `<div>` and no landmarks is a flat wall of content.
- **Headings** (`<h1>`–`<h6>`) in a logical hierarchy. They are the table of contents. Skipping from `<h1>` to `<h4>`, or using headings for visual sizing, breaks navigation for screen-reader users who jump between headings.
- **Lists** (`<ul>`, `<ol>`, `<dl>`) for list content. A screen reader announces "list, 5 items" and lets the user skip it. Five `<div>`s are five mysteries.
- **Forms**: `<label>` associated with every input (via `for`/`id` or wrapping), `<fieldset>` and `<legend>` for groups, native input types (`email`, `tel`, `number`) that trigger the right mobile keyboards and built-in validation semantics.
- **Tables** (`<table>`, `<th scope="...">`) for tabular data — and only for tabular data. Layout tables are a relic; CSS grid exists.

The rule: **if a native element exists for what you are building, use it.** Custom components should be the exception, justified by a real need the native element cannot meet. Every custom interactive component you build is an accessibility liability you now own forever.

## Keyboard operability

If it works with a mouse, it must work with a keyboard. This is non-negotiable, and it is where most apps fail first.

The baseline contract:

- **Everything interactive is reachable by Tab**, in a logical order. Tab order follows DOM order; if your visual order differs from your DOM order (CSS repositioning, I'm looking at you), keyboard users experience a surreal teleporting focus. Fix the DOM order, not the tab index.
- **Everything reachable is operable.** Focusable is not enough. The custom dropdown that receives focus but only opens on hover is a trap: the keyboard user can see it but cannot use it. Every action available on hover or click must have a keyboard equivalent.
- **Focus is always visible.** Do not remove the focus outline without replacing it. `outline: none` is the most common accessibility vandalism in CSS. If the default outline clashes with the design, design a better visible indicator — a ring, an underline, a background shift — but never nothing. Sighted keyboard users need to know where they are.
- **No keyboard traps.** Focus must be able to leave every component it can enter. The classic trap is a modal or an embedded widget that captures Tab and never releases it. Test every overlay by tabbing through it and back out.
- **Escape hatches work.** `Escape` closes dialogs, menus, and popovers. This is a platform convention; violating it breaks muscle memory.

```css
/* Never this */
:focus { outline: none; }

/* This: a visible, designed focus indicator */
:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

`:focus-visible` is the right tool: it shows the indicator for keyboard interaction while leaving mouse clicks clean. There is no longer any excuse for removing focus styles entirely.

Test keyboard operability the honest way: unplug the mouse (or put it in a drawer) and use the app for fifteen minutes. Every place you get stuck, every focus you cannot see, every action you cannot reach — that is the bug list. Do this before every major release. It takes fifteen minutes and finds what automation never will.

## Focus management

Focus management is the difference between an app that is keyboard-reachable and an app that is keyboard-usable. Reachability gets you to the door; management walks you through the building.

The three situations that require active focus management:

**Modals and dialogs.** When a dialog opens, focus moves into it — to the dialog itself or its first interactive element. While open, focus is trapped within the dialog (Tab cycles inside; it cannot escape to the background). When the dialog closes, focus returns to the element that opened it. Every part of this matters: without the initial move, screen-reader users do not know the dialog appeared; without the trap, Tab wanders into the inert background; without the return, the user is dumped at the top of the page with no idea where they were. The native `<dialog>` element handles much of this; if you build custom, you own all of it.

**Route changes in single-page apps.** When the view changes, focus stays wherever it was — often on a link in a nav menu that no longer corresponds to the visible page. Screen-reader users hear nothing change. The fix: on route change, move focus to the new view's heading (give it `tabindex="-1"` so it is focusable programmatically without entering the tab order) and update the document title. This one change makes SPAs dramatically more usable with assistive technology.

**Dynamic content updates.** Form submitted with errors? Move focus to the error summary. Async operation completed? Announce it (see live regions below). Content loaded into a panel? Consider whether focus should follow. The principle: **when the app does something the user did not directly cause, tell them — and put focus where the next action is.**

```typescript
// Route change: focus the new view's heading, update the title
function onRouteChange(route: Route) {
  document.title = `${route.title} — App Name`;
  const heading = document.query-new-heading;
  heading?.setAttribute('tabindex', '-1');
  heading?.focus({ preventScroll: false });
}
```

## ARIA: when (and only when) needed

ARIA — Accessible Rich Internet Applications — is a set of attributes that patch the accessibility tree when native semantics are insufficient. The first rule of ARIA, straight from the spec, is: **don't use ARIA if a native element will do.** The second rule is: don't change native semantics unless you really know what you're doing. These two rules eliminate most ARIA misuse.

When ARIA is genuinely needed:

- **Live regions** (`aria-live="polite"` / `"assertive"`) for dynamic updates: form validation results, toast notifications, async status changes. Without them, screen-reader users never hear about content that appeared without a page load. Use `polite` for status updates (announced when the user pauses) and `assertive` only for genuinely urgent interruptions (errors blocking progress). Overusing `assertive` is the accessibility equivalent of shouting.
- **Labeling when visible text is insufficient**: `aria-label` for icon-only buttons ("Close", not "X"), `aria-describedby` for hint text associated with inputs, `aria-labelledby` when one element labels another.
- **Widget roles for custom components you could not avoid building**: `role="dialog"`, `role="tablist"`/`tab`/`tabpanel`, `role="switch"`. But each role comes with a contract — required keyboard interactions, required states (`aria-selected`, `aria-expanded`, `aria-checked`). Adopting the role means adopting the whole contract. A `tablist` that does not support arrow-key navigation is worse than no tablist at all, because it promises behavior it does not deliver.
- **State communication**: `aria-expanded` on disclosure buttons, `aria-current` on the active nav item, `aria-invalid` and `aria-describedby` on fields with errors.

Common ARIA mistakes that make things worse:

- `role="button"` on a div without keyboard handlers. You have announced a button that is not a button.
- `aria-hidden="true"` on focusable content. The screen reader cannot see it, but the keyboard can reach it — a ghost control.
- Redundant ARIA: `role="button"` on an actual `<button>`, `aria-label` duplicating visible text. Harmless but noisy, and a sign the author does not trust native semantics.
- `tabindex` greater than 0. This hijacks the natural tab order and creates a maintenance nightmare. Use `tabindex="0"` (add to tab order) or `tabindex="-1"` (programmatic focus only). Positive values are always wrong.

## Testing with screen readers

Automated checks catch maybe a third of issues. Manual testing with a screen reader catches the rest — but only if you know what you are listening for.

**Which screen reader:** VoiceOver (built into macOS/iOS) is the most accessible starting point — free, decent, and enough to catch the big problems. NVDA (free, Windows) is the workhorse for thorough testing. JAWS is the enterprise standard but expensive. Test with at least one regularly; test with two before major releases. They behave differently, and "works in VoiceOver" is not "works everywhere."

**What to listen for on a new feature:**

1. Can I discover it? Navigate by landmarks and headings — does the feature appear in the structure?
2. Can I understand it? Do controls announce their name, role, and state? ("Search, text field" — good. "Text field" — the label is broken. "Clickable" — something is very wrong.)
3. Can I operate it? Do the announced instructions match reality? Does state change get announced (expanded/collapsed, selected, checked)?
4. Can I recover from errors? Are validation errors announced and associated with their fields, or do they appear silently?

**The rookie protocol** (for developers who have never used a screen reader): turn it on, close your eyes or turn off the monitor, and try to complete the core user flow. You will be slow and confused. That confusion is the most valuable accessibility feedback you will ever get — it is what a portion of your users experience every day. Do this once and you will never again ship an icon-only button without a label.

## Baking a11y into CI and the design system

Individual diligence does not scale. What scales is making the accessible path the default path.

**In the design system:**

- Every component ships accessible by default. The modal manages focus. The dropdown is keyboard-operable. The form field requires a label prop. Accessibility is not a variant or a prop you opt into — it is the component.
- Design tokens include contrast-checked color pairs. If the palette contains combinations that fail WCAG contrast, designers will use them. Remove the failing combinations or mark them decorative-only.
- Document the keyboard interactions of each component alongside its props. If the interaction contract is written down, it can be tested; if it is tribal knowledge, it will regress.

**In CI:**

- **Lint rules**: `eslint-plugin-jsx-a11y` (or equivalent) catches the mechanical issues — missing alt text, invalid ARIA, click handlers on non-interactive elements. Run it as an error, not a warning. Warnings are suggestions; errors are policy.
- **Automated audits** (axe-core and similar) on every PR, against the built app. They catch regressions: the alt text someone deleted, the contrast change in a redesign, the duplicate IDs. Treat new violations as build failures.
- **Component-level a11y tests**: for interactive components, write tests that verify keyboard interaction and ARIA states, not just rendered output. "Pressing Escape closes the dialog" and "focus returns to the trigger" are testable assertions.
- **What CI cannot do** — and you must say this out loud so nobody confuses green checks with actual accessibility: verify that labels are meaningful, that focus order is logical, that live regions announce the right things at the right time, or that the app is usable with a screen reader. The automated suite is a regression net, not a proof. Schedule the manual testing.

## Anti-patterns: what goes wrong

**The overlay widget.** Third-party "accessibility overlays" that promise compliance via a JavaScript snippet. They do not make apps accessible; they paper over symptoms while often breaking the experience for actual assistive-technology users (many in the disability community actively oppose them). There is no shortcut. Build it right.

**Accessibility as a separate team's job.** An "a11y team" that reviews other teams' work at the end creates a bottleneck and, worse, absolves feature teams of ownership. The a11y specialists should build the tooling, the lint rules, the component primitives, and the training — and feature teams should own the accessibility of what they ship. Centralize the platform, distribute the responsibility.

**The audit-and-forget cycle.** A big remediation push, a clean audit, then slow regression as new features ship without the same care. Accessibility is a property you maintain, like performance. The CI gates and design-system defaults are what prevent the regression; the audit is just a snapshot.

**Designing for the audit, not the user.** Contrast ratios fixed while keyboard traps remain. Alt text added ("image123.jpg" replaced with "image") while the checkout flow is unusable with a screen reader. The audit measures what is measurable. The user experiences everything. Prioritize by user impact, not by audit score.

## How to start: what good looks like

If you are starting from an app with no accessibility practice:

1. **Run an automated audit today.** Fix everything it finds. This is the easy third — do it first for momentum, but do not mistake it for done.
2. **Do the keyboard walkthrough.** Fifteen minutes, no mouse, core user flow. Fix the traps, the invisible focus, the unreachable actions. This finds the severe issues.
3. **Fix your design system's interactive components.** Modal, dropdown, tooltip, tabs, dialog — these are the highest-leverage fixes because every feature team uses them. One fixed modal component fixes fifty modals.
4. **Add lint rules and axe to CI.** Make regressions fail the build. This is the ratchet that prevents backsliding.
5. **Schedule screen-reader testing.** Monthly for the core flows, before every major release for new features. Put it on the calendar; "when we have time" means never.
6. **Train the team once.** A single workshop — semantic HTML, keyboard testing, the ARIA rules — pays for itself within a quarter. Most accessibility bugs are made by developers who were never taught, not developers who do not care.

What good looks like: a new component is accessible by default because the design system made it so; a PR that breaks accessibility fails CI the same way a PR that breaks tests does; keyboard and screen-reader testing are scheduled, not heroic; and nobody talks about "the a11y pass" anymore, because there is no pass — there is just how the team builds software. Accessibility done right is invisible. That is the point. The best accessibility work is the work nobody notices, because everything just works — for everyone.
