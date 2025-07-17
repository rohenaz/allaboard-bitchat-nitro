# Review Command - BitChat Nitro

## Purpose
This command helps validate that implemented features actually work from a user perspective, not just pass tests.

## Pre-Implementation Checklist

Before implementing any feature:

1. **Read the exact user request** - Don't add features not explicitly requested
2. **Identify the specific location** - Where exactly should changes be made?
3. **Understand the user journey** - What should the actual user experience be?

## Post-Implementation Validation

After implementing features, ALWAYS:

### 1. Manual Testing Required
- [ ] Start the development server (`bun run dev`)
- [ ] Navigate to the actual feature in a browser
- [ ] Click through the exact user flow that was requested
- [ ] Verify the feature works as expected from a user perspective

### 2. Real User Experience Testing
- [ ] Test with actual clicks, not just automated tests
- [ ] Check for error messages or broken flows
- [ ] Verify redirects work correctly
- [ ] Test on localhost with real browser interaction

### 3. OAuth Flow Specific Checks
- [ ] Click "Sign in with Bitcoin" button manually
- [ ] Verify redirect to sigma-auth server works
- [ ] Check that OAuth parameters are properly passed
- [ ] Ensure callback handling works correctly
- [ ] Test session persistence across page refreshes

### 4. API Integration Testing
- [ ] Test with actual API endpoints, not mocked responses
- [ ] Verify error handling with real network conditions
- [ ] Check authentication headers and token handling

## Common Pitfalls to Avoid

1. **Don't assume tests passing = feature working**
   - Tests can pass while the actual user experience is broken
   - Always manually test the feature after implementation

2. **Don't add unrequested features**
   - Only implement exactly what the user asked for
   - Don't add "nice to have" features without explicit request

3. **Don't rely on URL patterns in tests**
   - Server redirects can change URL patterns
   - Focus on testing actual user flows, not implementation details

4. **Don't ignore console errors**
   - Check browser console for JavaScript errors
   - Verify network requests are successful

## Validation Commands

### Start Development Server
```bash
bun run dev
```

### Test OAuth Flow Manually
1. Open browser to `http://localhost:5173` (or appropriate port)
2. Click "Sign in with Bitcoin"
3. Verify redirect to sigma-auth server
4. Check browser console for errors
5. Test callback handling

### Check for Broken Features
```bash
# Build the project to catch compile errors
bun run build

# Run linter to catch code issues
bun run lint

# Run tests but also manually verify
bun run test
```

## Questions to Ask Before Marking Complete

1. **Does the feature work when I click it in a browser?**
2. **Are there any console errors or warnings?**
3. **Does the user flow work end-to-end?**
4. **Did I implement exactly what was requested, nothing more?**
5. **Would a real user be able to use this feature successfully?**

## Remember

**Tests passing ≠ Feature working**

Always validate the actual user experience, not just the test results.