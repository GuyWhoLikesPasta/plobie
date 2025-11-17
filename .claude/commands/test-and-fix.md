Run the full test suite and fix any failing tests.

Steps:

1. Run `npm run typecheck` first
2. Fix any TypeScript errors
3. Run `npm run lint` 
4. Fix any linting errors
5. Run `npm test`
6. For each failing test:
   - Read the test file
   - Understand what's being tested
   - Fix the implementation or the test
   - Re-run that specific test to verify
7. Run the full test suite again to confirm all pass
8. Commit the fixes with a descriptive message

Focus on one test at a time and verify fixes before moving to the next.

