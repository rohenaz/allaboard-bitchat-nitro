# Visual Regression Testing Suite

This directory contains automated visual regression tests to help debug UI components and catch visual regressions during development.

## Quick Start

```bash
# Run visual tests with current dev server
bun run test:visual

# Update visual baselines (run this after confirming changes are correct)
bun run test:visual:update

# Run specific component tests
bun run test:component:modals

# Take screenshots of current state
bun run test:screenshot
```

## Test Categories

### 1. Visual Regression Tests (`visual.spec.ts`)
- Full page screenshots across different viewport sizes
- Component-specific visual tests (modals, buttons, lists)
- Dark theme validation
- Cross-browser compatibility

### 2. Component Tests (`components/`)
- Individual component testing
- State-based screenshot comparisons
- Interactive element validation

### 3. Debug Helpers (`debug/`)
- Auto-screenshot on errors
- Component state debugging
- Performance profiling

## Configuration

Visual tests use specific viewport sizes and wait conditions to ensure consistent results:
- Desktop: 1400x900
- Mobile: 375x667
- Tablet: 768x1024

## Usage Tips

1. **Always run dev server first**: `bun run dev`
2. **Update baselines carefully**: Only after visual inspection
3. **Use component selectors**: Target specific elements for faster tests
4. **Mock dynamic content**: Timestamp, random data, etc.

## Debugging

When tests fail, check the HTML report:
```bash
bun run playwright show-report
```

The report will show expected vs actual with diff highlighting. 