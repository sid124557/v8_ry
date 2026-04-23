// Copyright 2026 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Flags: --allow-natives-syntax --turbolev --turbofan

function* foo(n) {
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc = (acc * 3 + i) | 0;
    for (let j = 0; j < 3; j++) {
      acc = (acc + j + 1) | 0;
      if (((i + j) & 1) === 0) {
        const delta = yield (acc ^ (i << 4) ^ j);
        acc = (acc + (delta | 0)) | 0;
      }
    }
    if ((i & 1) === 1) yield acc;
  }
  return acc;
}

function runScenario() {
  const it = foo(4);
  const out = [];
  let nextIn = 1;
  while (true) {
    const r = it.next(nextIn);
    out.push(r.value);
    if (r.done) break;
    nextIn = (nextIn * 7 + 3) & 15;
  }
  return out;
}

const expected = [1, 18, 94, 84, 223, 300, 890, 848, 848];

%PrepareFunctionForOptimization(foo);
assertEquals(expected, runScenario());

%OptimizeFunctionOnNextCall(foo);
assertEquals(expected, runScenario());
