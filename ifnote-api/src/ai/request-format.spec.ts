import { resolveRequestFormat } from "./request-format";

/**
 * resolveRequestFormat() auto-detects the Anthropic Messages API from the
 * base URL host, so an Anthropic endpoint accidentally left with format
 * "openai" still gets Anthropic headers/defaults. For every other host it
 * must respect the explicitly chosen format and never throw on bad input.
 */
describe("resolveRequestFormat", () => {
  it("returns anthropic for api.anthropic.com host", () => {
    expect(resolveRequestFormat("https://api.anthropic.com/v1", "openai")).toBe(
      "anthropic",
    );
  });

  it("ignores case and trailing slash", () => {
    expect(resolveRequestFormat("https://API.Anthropic.com/v1/", "openai")).toBe(
      "anthropic",
    );
  });

  it("keeps chosen format for other hosts", () => {
    expect(resolveRequestFormat("https://api.openai.com/v1", "openai")).toBe(
      "openai",
    );
  });

  it("keeps azure when chosen even on other hosts", () => {
    expect(
      resolveRequestFormat("https://my-resource.openai.azure.com", "azure"),
    ).toBe("azure");
  });

  it("does not throw on invalid url and returns the input format", () => {
    expect(resolveRequestFormat("not a url", "openai")).toBe("openai");
    expect(resolveRequestFormat("", "custom")).toBe("custom");
    expect(resolveRequestFormat(null, "azure")).toBe("azure");
    expect(resolveRequestFormat(undefined, "openai")).toBe("openai");
  });
});
