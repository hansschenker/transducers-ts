/** Classical JavaScript transducer protocol keys. */
export const INIT = '@@transducer/init' as const;
export const STEP = '@@transducer/step' as const;
export const RESULT = '@@transducer/result' as const;
export const REDUCED = '@@transducer/reduced' as const;
export const VALUE = '@@transducer/value' as const;

/** A reduction result that requests early termination. */
export interface Reduced<Result> {
  readonly [REDUCED]: true;
  readonly [VALUE]: Result;
}

export type StepResult<Result> = Result | Reduced<Result>;

/**
 * The classical transducer transformer protocol.
 *
 * Result is the accumulator type. Input is the value accepted by this stage.
 */
export interface Transformer<Result, Input> {
  [INIT](): Result;
  [STEP](result: Result, input: Input): StepResult<Result>;
  [RESULT](result: Result): Result;
}

/**
 * A transducer rewires a downstream transformer.
 *
 * Input is what this transducer accepts from upstream.
 * Output is what it may emit downstream.
 */
export type Transducer<Input, Output> = <Result>(
  downstream: Transformer<Result, Output>,
) => Transformer<Result, Input>;

export interface TransformerSpec<Result, Input> {
  readonly init: () => Result;
  readonly step: (result: Result, input: Input) => StepResult<Result>;
  readonly result?: (result: Result) => Result;
}

/** Build a protocol-compatible transformer from named functions. */
export const transformer = <Result, Input>(
  spec: TransformerSpec<Result, Input>,
): Transformer<Result, Input> => ({
  [INIT]: spec.init,
  [STEP]: spec.step,
  [RESULT]: spec.result ?? ((result) => result),
});

export const reduced = <Result>(result: Result): Reduced<Result> => ({
  [REDUCED]: true,
  [VALUE]: result,
});

export const isReduced = <Result>(
  result: Result | Reduced<Result>,
): result is Reduced<Result> =>
  typeof result === 'object' &&
  result !== null &&
  (result as Partial<Reduced<Result>>)[REDUCED] === true;

export const unreduced = <Result>(result: StepResult<Result>): Result =>
  isReduced(result) ? result[VALUE] : result;

export const ensureReduced = <Result>(
  result: StepResult<Result>,
): Reduced<Result> => (isReduced(result) ? result : reduced(result));
