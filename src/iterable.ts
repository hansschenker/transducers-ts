import {
  INIT,
  RESULT,
  STEP,
  VALUE,
  isReduced,
  type Transducer,
  type Transformer,
} from './protocol.js';
import { identityT } from './operators.js';

export function transduce<Input, Output, Result>(
  source: Iterable<Input>,
  transducer: Transducer<Input, Output>,
  reducer: Transformer<Result, Output>,
): Result;
export function transduce<Input, Output, Result>(
  source: Iterable<Input>,
  transducer: Transducer<Input, Output>,
  reducer: Transformer<Result, Output>,
  initial: Result,
): Result;
export function transduce<Input, Output, Result>(
  source: Iterable<Input>,
  transducer: Transducer<Input, Output>,
  reducer: Transformer<Result, Output>,
  initial?: Result,
): Result {
  const transformed = transducer(reducer);
  let result =
    arguments.length >= 4 ? (initial as Result) : transformed[INIT]();

  for (const input of source) {
    const stepped = transformed[STEP](result, input);
    if (isReduced(stepped)) {
      result = stepped[VALUE];
      break;
    }
    result = stepped;
  }

  return transformed[RESULT](result);
}

export const arrayTransformer = <Value>(): Transformer<Value[], Value> => ({
  [INIT]: () => [],
  [STEP]: (result, input) => {
    result.push(input);
    return result;
  },
  [RESULT]: (result) => result,
});

export function intoArray<Value>(source: Iterable<Value>): Value[];
export function intoArray<Input, Output>(
  source: Iterable<Input>,
  transducer: Transducer<Input, Output>,
): Output[];
export function intoArray<Input, Output>(
  source: Iterable<Input>,
  transducer?: Transducer<Input, Output>,
): Output[] {
  const active =
    transducer ??
    (identityT<Input>() as unknown as Transducer<Input, Output>);

  return transduce(source, active, arrayTransformer<Output>());
}

/**
 * Lazily expose transducer outputs as a standard Iterable.
 *
 * The transducer remains synchronous; only demand for outputs is lazy.
 */
export function* toIterable<Input, Output>(
  source: Iterable<Input>,
  transducer: Transducer<Input, Output>,
): IterableIterator<Output> {
  const outputs: Output[] = [];
  const sink: Transformer<void, Output> = {
    [INIT]: () => undefined,
    [STEP]: (_result, input) => {
      outputs.push(input);
      return undefined;
    },
    [RESULT]: () => undefined,
  };

  const transformed = transducer(sink);
  let result = transformed[INIT]();
  let terminated = false;

  for (const input of source) {
    const stepped = transformed[STEP](result, input);
    if (isReduced(stepped)) {
      result = stepped[VALUE];
      terminated = true;
    } else {
      result = stepped;
    }

    for (const output of outputs) {
      yield output;
    }
    outputs.length = 0;

    if (terminated) {
      break;
    }
  }

  transformed[RESULT](result);

  for (const output of outputs) {
    yield output;
  }
}
