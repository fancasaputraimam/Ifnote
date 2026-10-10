// node --test scripts/auth-errors.test.mjs  (Node 24 menjalankan .ts langsung)
import { test } from "node:test";
import assert from "node:assert/strict";
import { authErrorMessage } from "../src/lib/auth-errors.ts";

test("register 409 tells the user the email is taken, not that a note exists", () => {
  const m = authErrorMessage("register", 409);
  assert.match(m, /sudah terdaftar/);
  assert.doesNotMatch(m, /[Cc]atatan/);
});

test("login 401 says the email or password is wrong", () => {
  assert.match(authErrorMessage("login", 401), /Email atau password salah/);
});

test("login 429 names the real 15 minute lockout", () => {
  assert.match(authErrorMessage("login", 429), /15 menit/);
});

test("register 429 names the real 1 hour lockout", () => {
  assert.match(authErrorMessage("register", 429), /1 jam/);
});

test("server errors and network failures get a retry message", () => {
  assert.match(authErrorMessage("login", 500), /server/i);
  assert.match(authErrorMessage("register", 0), /koneksi/i);
});

test("validation errors point the user back at the form", () => {
  assert.match(authErrorMessage("register", 400), /isian/i);
});

test("no message contains an em dash", () => {
  for (const kind of ["login", "register"]) {
    for (const s of [0, 400, 401, 409, 429, 500, 503]) {
      assert.ok(!authErrorMessage(kind, s).includes("\u2014"), `${kind} ${s}`);
    }
  }
});
