# Classical transducer protocol

`transducers-ts` keeps the established JavaScript protocol names:

```text
@@transducer/init
@@transducer/step
@@transducer/result
@@transducer/reduced
@@transducer/value
```

## Transformer

```ts
interface Transformer<Result, Input> {
  ['@@transducer/init'](): Result;
  ['@@transducer/step'](
    result: Result,
    input: Input,
  ): Result | Reduced<Result>;
  ['@@transducer/result'](result: Result): Result;
}
```

A Transformer knows how to initialize an accumulator, accept one input step, and finalize the reduction.

## Transducer

```ts
type Transducer<Input, Output> = <Result>(
  downstream: Transformer<Result, Output>,
) => Transformer<Result, Input>;
```

A transducer does not own iteration. It transforms the process that handles a value.

```text
upstream Input
     |
     v
 transducer
     |
 0..n Output
     |
     v
downstream Transformer
```

The same transducer can therefore be driven by an Iterable, AsyncIterable, push stream, or other host that can feed `step` correctly.

## Reduced

`Reduced<Result>` is a structural early-termination message:

```ts
{
  '@@transducer/reduced': true,
  '@@transducer/value': result,
}
```

Its portable meaning is:

> The reduction has enough input. Stop the source and finalize normally.

The driver decides how stopping is implemented:

```text
Iterable       -> stop pulling / close iterator
AsyncIterable  -> stop awaiting / close async iterator
RxJS           -> complete downstream + unsubscribe upstream
```

## Error is not Reduced

A thrown exception is not a normal termination request. Drivers must not reinterpret exceptions as `Reduced`.

- synchronous drivers throw;
- async drivers reject;
- the RxJS adapter sends the error through `error`.

`result()` is used for normal reduction finalization, including buffered output such as the last partial `partitionT`. It is not used to turn cancellation/error into completion.

## State ownership

A transducer may be stateful, but execution state must be created when the transducer is applied to a downstream Transformer.

```text
Transducer description
       |
       +-- execution #1 -> state #1
       |
       +-- execution #2 -> state #2
```

For RxJS this means each subscription gets independent state.
