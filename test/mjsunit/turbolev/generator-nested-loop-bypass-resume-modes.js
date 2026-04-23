// Copyright 2026 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Flags: --allow-natives-syntax --turbolev --turbofan

function* foo(limit) {
  let acc = 0;
  outer: for (let i = 0; i < limit; i++) {
    for (let j = 0; j < 3; j++) {
      try {
        if (((i + j) & 1) === 0) {
          const inVal = yield i * 10 + j + acc;
          acc = (acc + (inVal | 0) + i - j) | 0;
          if (inVal === 99) continue outer;
        } else {
          acc = (acc + i + j) | 0;
        }
      } catch (e) {
        acc = (acc + (e | 0)) | 0;
      } finally {
        acc = (acc + 1) | 0;
      }
    }
  }
  return acc;
}

function scenarioNextThrow() {
  const it = foo(4);
  const out = [];
  out.push(it.next().value);
  out.push(it.next(5).value);
  out.push(it.throw(7).value);
  out.push(it.next(99).value);

  let inVal = 2;
  while (true) {
    const r = it.next(inVal);
    out.push(r.value);
    if (r.done) break;
    inVal++;
  }
  return out;
}

function scenarioEarlyReturn() {
  const it = foo(3);
  return [it.next().value, it.return(42).value, it.next().value];
}

const expectedNextThrow = [0, 10, 29, 138, 149, 166, 148];
const expectedEarlyReturn = [0, 42, undefined];

%PrepareFunctionForOptimization(foo);
assertEquals(expectedNextThrow, scenarioNextThrow());
assertEquals(expectedEarlyReturn, scenarioEarlyReturn());

%OptimizeFunctionOnNextCall(foo);
assertEquals(expectedNextThrow, scenarioNextThrow());
assertEquals(expectedEarlyReturn, scenarioEarlyReturn());
