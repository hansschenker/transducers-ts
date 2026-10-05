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
import { arrayTransformer } from './iterable.js';

type AsyncSource<Value> = AsyncIterable<Value> | Iterable<Value>;

export function transduceAsync<Input, Output, Result>(
  source: AsyncSource<Input>,
  transducer: Transducer<Input, Output>,
  reducer: Transformer<Result, Output>,
): Promise<Result>;
export function transduceAsync<Input, Output, Result>(
  source: AsyncSource<Input>,
  transducer: Transducer<Input, Output>,
  reducer: Transformer<Result, Output>,
  initial: Result,
): Promise<Result>;
export async function transduceAsync<Input, Output, Result>(
  source: AsyncSource<Input>,
  transducer: Transducer<Input, Output>,
  reducer: Transformer<Result, Output>,
  initial?: Result,
): Promise<Result> {
  const transformed = transducer(reducer);
  let result =
    arguments.length >= 4 ? (initial as Result) : transformed[INIT]();

  for await (const input of source) {
    const stepped = transformed[STEP](result, input);
    if (isReduced(stepped)) {
      result = stepped[VALUE];
      break;
    }
    result = stepped;
  }

  return transformed[RESULT](result);
}

export async function intoArrayAsync<Value>(
  source: AsyncSource<Value>,
): Promise<Value[]>;
export async function intoArrayAsync<Input, Output>(
  source: AsyncSource<Input>,
  transducer: Transducer<Input, Output>,
): Promise<Output[]>;
export async function intoArrayAsync<Input, Output>(
  source: AsyncSource<Input>,
  transducer?: Transducer<Input, Output>,
): Promise<Output[]> {
  const active =
    transducer ??
    (identityT<Input>() as unknown as Transducer<Input, Output>);

  return transduceAsync(source, active, arrayTransformer<Output>());
}

/**
 * Lazily expose transducer outputs from an Iterable or AsyncIterable.
 * Transformation steps remain synchronous; time comes from the source.
 */
export async function* toAsyncIterable<Input, Output>(
  source: AsyncSource<Input>,
  transducer: Transducer<Input, Output>,
): AsyncIterableIterator<Output> {
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

  for await (const input of source) {
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
