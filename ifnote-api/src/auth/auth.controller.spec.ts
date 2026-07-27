import { AuthController } from "./auth.controller";
import { AUTH_COOKIE_NAME } from "../common/auth/auth-cookie";
import type { Response } from "express";

/**
 * Controller-level wiring test: proves login/register set the httpOnly
 * auth cookie and logout clears it. AuthService is mocked (no DB needed);
 * we only assert the cookie side-effects on the Express Response.
 */
function makeRes() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response & { cookie: jest.Mock; clearCookie: jest.Mock };
}

const FAKE_RESULT = {
  token: "jwt.token.value",
  user: { id: "u1", email: "a@b.com", name: null, role: "user" as const },
};

describe("AuthController cookie wiring", () => {
  const origEnv = { ...process.env };
  afterEach(() => {
    process.env = { ...origEnv };
    jest.clearAllMocks();
  });

  function makeController(overrides: Partial<Record<"login" | "register", jest.Mock>> = {}) {
    const auth = {
      login: overrides.login ?? jest.fn().mockResolvedValue(FAKE_RESULT),
      register: overrides.register ?? jest.fn().mockResolvedValue(FAKE_RESULT),
    };
    // Only login/register/logout touch cookies; me() not exercised here.
    return new AuthController(auth as never);
  }

  it("login sets the auth cookie with the issued token", async () => {
    process.env.JWT_EXPIRES_IN = "7d";
    const res = makeRes();
    const ctrl = makeController();
    const out = await ctrl.login({ email: "a@b.com", password: "secret12" }, res);

    expect(res.cookie).toHaveBeenCalledTimes(1);
    const [name, token, opts] = res.cookie.mock.calls[0];
    expect(name).toBe(AUTH_COOKIE_NAME);
    expect(token).toBe(FAKE_RESULT.token);
    expect(opts).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(opts.maxAge).toBe(7 * 86_400_000);
    // Body still returns token (back-compat)
    expect(out).toEqual(FAKE_RESULT);
  });

  it("register sets the auth cookie", async () => {
    const res = makeRes();
    const ctrl = makeController();
    await ctrl.register({ email: "a@b.com", password: "secret12" }, res);
    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(res.cookie.mock.calls[0][0]).toBe(AUTH_COOKIE_NAME);
  });

  it("logout clears the auth cookie with matching options", () => {
    const res = makeRes();
    const ctrl = makeController();
    ctrl.logout(res);
    expect(res.clearCookie).toHaveBeenCalledTimes(1);
    const [name, opts] = res.clearCookie.mock.calls[0];
    expect(name).toBe(AUTH_COOKIE_NAME);
    expect(opts).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });

  it("cookie is not marked Secure outside production (dev over http)", async () => {
    process.env.NODE_ENV = "development";
    const res = makeRes();
    const ctrl = makeController();
    await ctrl.login({ email: "a@b.com", password: "secret12" }, res);
    expect(res.cookie.mock.calls[0][2].secure).toBe(false);
  });
});
