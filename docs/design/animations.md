# Animation & Micro-interactions

**Part of:** [Design System](./design-system.md)
**Version:** 1.0
**Last Updated:** January 15, 2025

---

## Motion Principles

1. **Purposeful, not decorative** - Guide attention, provide feedback
2. **Fast and subtle** - Business users prioritize speed (< 300ms)
3. **Respect user preferences** - Honor `prefers-reduced-motion`
4. **Consistent timing** - Standard easing curves

---

## Key Animations

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Button Hover | 200ms | ease-in-out | Color transition |
| Toast Entry | 300ms | ease-out | Slide + fade from top-right |
| Modal Open | 200ms | ease-out | Scale from 95% to 100% |
| Dropdown Expand | 150ms | ease-out | Slide down with fade |
| Loading Spinner | 1000ms | linear | Continuous rotation |
| Skeleton Pulse | 2000ms | ease-in-out | Opacity pulse |
| Form Error Shake | 400ms | ease-in-out | Horizontal shake |
| Table Row Hover | 150ms | ease-out | Background color change |

---

## Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Performance Target

**60 FPS** for all animations (16ms frame budget)

---

## Related Documents

- [← Back to Design System Index](./design-system.md)
- [← Previous: Accessibility](./accessibility.md)
- [Next: Performance →](./performance.md)
