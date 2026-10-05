# References

This project is an independent modern implementation informed by the classical transducer model and protocol.

- James Long, `jlongster/transducers.js`: https://github.com/jlongster/transducers.js
- Cognitect transducer protocol discussion/specification lineage: https://github.com/cognitect-labs/transducers-js
- Rich Hickey, *Transducers*: conceptual origin of reducing-process transformations.
- ECMAScript Iterable / Iterator protocols: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Iteration_protocols
- ECMAScript AsyncIterable / async iteration: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/for-await...of
- RxJS 7.8.2: https://github.com/ReactiveX/rxjs/tree/7.8.2

No source code from `jlongster/transducers.js` is copied into this implementation. The project preserves the established string-key protocol for interoperability and re-derives the implementation in modern TypeScript.
