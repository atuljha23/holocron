# Rule — test-first where the contract is clear

When the expected behavior is well-defined before you write code (bug fix, API endpoint, pure function), write the failing test first. Then make it pass.

## Why
- Guarantees the test would have caught the bug — you saw it fail.
- Clarifies the contract in your head before you ossify it in code.
- Yields tests that assert behavior rather than mirror the implementation.

## Exceptions
- Exploratory / spike work where the shape is unknown. Write code first, tests after you know what you want.
- UI tinkering for visual outcomes the tests can't cheaply express.

## Aligns with the QA rubric
- Assert behavior, not implementation.
- One logical check per test.
- Table-driven when the shape repeats.
