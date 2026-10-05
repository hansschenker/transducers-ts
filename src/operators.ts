import { composeT } from './compose.js';
import {
  INIT,
  RESULT,
  STEP,
  ensureReduced,
  isReduced,
  unreduced,
  type Transducer,
} from './protocol.js';

const assertNonNegativeInteger = (value: number, name: string): void => {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer`);
  }
};

const assertPositiveInteger = (value: number, name: string): void => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer`);
  }
};

export const identityT = <Value>(): Transducer<Value, Value> =>
  (downstream) => downstream;

export const mapT = <Input, Output>(
  project: (value: Input) => Output,
): Transducer<Input, Output> =>
  (downstream) => ({
    [INIT]: () => downstream[INIT](),
    [STEP]: (result, input) => downstream[STEP](result, project(input)),
    [RESULT]: (result) => downstream[RESULT](result),
  });

export const filterT = <Value>(
  predicate: (value: Value) => boolean,
): Transducer<Value, Value> =>
  (downstream) => ({
    [INIT]: () => downstream[INIT](),
    [STEP]: (result, input) =>
      predicate(input) ? downstream[STEP](result, input) : result,
    [RESULT]: (result) => downstream[RESULT](result),
  });

export const takeT = <Value>(count: number): Transducer<Value, Value> => {
  assertNonNegativeInteger(count, 'count');

  return (downstream) => {
    let seen = 0;

    return {
      [INIT]: () => downstream[INIT](),
      [STEP]: (result, input) => {
        if (seen >= count) {
          return ensureReduced(result);
        }

        seen += 1;
        const next = downstream[STEP](result, input);
        return seen >= count ? ensureReduced(next) : next;
      },
      [RESULT]: (result) => downstream[RESULT](result),
    };
  };
};

export const takeWhileT = <Value>(
  predicate: (value: Value) => boolean,
): Transducer<Value, Value> =>
  (downstream) => ({
    [INIT]: () => downstream[INIT](),
    [STEP]: (result, input) =>
      predicate(input)
        ? downstream[STEP](result, input)
        : ensureReduced(result),
    [RESULT]: (result) => downstream[RESULT](result),
  });

export const dropT = <Value>(count: number): Transducer<Value, Value> => {
  assertNonNegativeInteger(count, 'count');

  return (downstream) => {
    let seen = 0;

    return {
      [INIT]: () => downstream[INIT](),
      [STEP]: (result, input) => {
        if (seen < count) {
          seen += 1;
          return result;
        }
        return downstream[STEP](result, input);
      },
      [RESULT]: (result) => downstream[RESULT](result),
    };
  };
};

export const dropWhileT = <Value>(
  predicate: (value: Value) => boolean,
): Transducer<Value, Value> =>
  (downstream) => {
    let dropping = true;

    return {
      [INIT]: () => downstream[INIT](),
      [STEP]: (result, input) => {
        if (dropping && predicate(input)) {
          return result;
        }

        dropping = false;
        return downstream[STEP](result, input);
      },
      [RESULT]: (result) => downstream[RESULT](result),
    };
  };

export const scanT = <Input, State>(
  accumulator: (state: State, value: Input) => State,
  seed: State,
): Transducer<Input, State> =>
  (downstream) => {
    let state = seed;

    return {
      [INIT]: () => downstream[INIT](),
      [STEP]: (result, input) => {
        state = accumulator(state, input);
        return downstream[STEP](result, state);
      },
      [RESULT]: (result) => downstream[RESULT](result),
    };
  };

export const distinctUntilChangedT = <Value>(
  equals: (previous: Value, current: Value) => boolean = Object.is,
): Transducer<Value, Value> =>
  (downstream) => {
    let hasPrevious = false;
    let previous!: Value;

    return {
      [INIT]: () => downstream[INIT](),
      [STEP]: (result, input) => {
        if (hasPrevious && equals(previous, input)) {
          return result;
        }

        hasPrevious = true;
        previous = input;
        return downstream[STEP](result, input);
      },
      [RESULT]: (result) => downstream[RESULT](result),
    };
  };

export const partitionT = <Value>(
  size: number,
): Transducer<Value, readonly Value[]> => {
  assertPositiveInteger(size, 'size');

  return (downstream) => {
    let buffer: Value[] = [];

    return {
      [INIT]: () => downstream[INIT](),
      [STEP]: (result, input) => {
        buffer.push(input);
        if (buffer.length < size) {
          return result;
        }

        const partition = buffer;
        buffer = [];
        return downstream[STEP](result, partition);
      },
      [RESULT]: (result) => {
        let next = result;

        if (buffer.length > 0) {
          const finalPartition = buffer;
          buffer = [];
          next = unreduced(downstream[STEP](next, finalPartition));
        }

        return downstream[RESULT](next);
      },
    };
  };
};

export const catT = <Value>(): Transducer<Iterable<Value>, Value> =>
  (downstream) => ({
    [INIT]: () => downstream[INIT](),
    [STEP]: (result, input) => {
      let next = result;

      for (const value of input) {
        const stepped = downstream[STEP](next, value);
        if (isReduced(stepped)) {
          return stepped;
        }
        next = stepped;
      }

      return next;
    },
    [RESULT]: (result) => downstream[RESULT](result),
  });

export const mapcatT = <Input, Output>(
  project: (value: Input) => Iterable<Output>,
): Transducer<Input, Output> => composeT(mapT(project), catT<Output>());
