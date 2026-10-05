import { Observable, Subscriber, type OperatorFunction } from 'rxjs';
import {
  INIT,
  RESULT,
  STEP,
  VALUE,
  isReduced,
  type Transducer,
  type Transformer,
} from '../protocol.js';

/**
 * Execute a synchronous transducer inside an RxJS 7 Observable pipeline.
 *
 * Each subscription gets a fresh transformer instance and therefore fresh
 * transducer state. Reduced means: finalize, complete downstream, and cancel
 * the upstream subscription.
 */
export const transduce = <Input, Output>(
  transducer: Transducer<Input, Output>,
): OperatorFunction<Input, Output> =>
  (source) =>
    new Observable<Output>((destination) => {
      const sink: Transformer<void, Output> = {
        [INIT]: () => undefined,
        [STEP]: (_result, input) => {
          destination.next(input);
          return undefined;
        },
        [RESULT]: () => undefined,
      };

      let transformed: Transformer<void, Input>;
      let result: void;

      try {
        transformed = transducer(sink);
        result = transformed[INIT]();
      } catch (error) {
        destination.error(error);
        return undefined;
      }

      let terminated = false;

      const complete = (): void => {
        if (terminated || destination.closed) {
          return;
        }

        terminated = true;
        try {
          result = transformed[RESULT](result);
          destination.complete();
        } catch (error) {
          destination.error(error);
        }
      };

      const sourceSubscriber = new Subscriber<Input>({
        next: (input: Input) => {
          if (terminated || destination.closed) {
            return;
          }

          try {
            const stepped = transformed[STEP](result, input);
            if (isReduced(stepped)) {
              result = stepped[VALUE];
              complete();
            } else {
              result = stepped;
            }
          } catch (error) {
            terminated = true;
            destination.error(error);
          }
        },
        error: (error: unknown) => {
          if (terminated || destination.closed) {
            return;
          }
          terminated = true;
          destination.error(error);
        },
        complete,
      });

      // This is added before subscription starts. Therefore a Reduced result
      // can synchronously complete destination and immediately close the
      // source Subscriber, even for synchronous sources such as range/of.
      destination.add(sourceSubscriber);
      source.subscribe(sourceSubscriber);
      return undefined;
    });
