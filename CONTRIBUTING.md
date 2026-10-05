# Contributing

The project has one architectural rule above all others:

> Keep the classical transducer core independent of the execution environment.

Before adding an operator, ask whether its behavior can be expressed as an input-driven transformation of a downstream reduction process.

Good core candidates:

```text
input -> state transition -> 0..n synchronous downstream steps
```

Behaviors that require timers, schedulers, multiple live subscriptions, sharing, or future inner notifications belong in the host system rather than the classical core.

## Development

```bash
npm install
npm run check
```

A change to early termination must include an infinite-source test. A change to finalization must include a test that observes `result()` behavior. RxJS adapter changes must test synchronous cancellation as well as normal completion.
