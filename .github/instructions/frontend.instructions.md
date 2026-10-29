---
applyTo:
  - "src/**/*.jsx"
  - "src/**/*.js"
  - "src/**/*.css"
---

# Frontend instructions

This project is a React/Vite frontend for a single public event website.

## Implementation rules

- Reuse existing components, hooks, utilities, styles, and layout patterns before creating new abstractions.
- Prefer small changes in the existing component hierarchy.
- Do not introduce a new state-management library unless the task explicitly requires it.
- Do not introduce backend assumptions into frontend code.
- Preserve static-hosting behavior.
- Avoid unnecessary dependencies.
- Keep components focused and composable.
- Preserve responsive behavior and mobile usability.

## Accessibility

- Prefer semantic HTML.
- Preserve keyboard usability.
- Interactive controls must remain operable without a mouse.
- Preserve visible focus behavior.
- Respect `prefers-reduced-motion` where animations are used.
- Images must have appropriate alternative text where applicable.

## Performance

- Avoid unnecessary rerenders and large client-side dependencies.
- Reuse existing utilities before adding new ones.
- Do not add expensive effects or global listeners without cleanup.
- Keep static content and data simple when no dynamic architecture is required.

## Validation

For frontend changes, prefer focused validation first.

Run broader lint/build checks only when appropriate for the completed task.
