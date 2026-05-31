import {
  normalizeJapaneseQuery,
  normalizeKotobaQuery,
  normalizeBunpouQuery,
  normalizeKanjiQuery,
  hasJapanese,
} from "./normalize-query";

describe("normalize-query: normalizeJapaneseQuery", () => {
  it("trims and lowercases latin", () => {
    expect(normalizeJapaneseQuery("  Hello World  ")).toBe("hello world");
  });

  it("preserves Japanese characters", () => {
    expect(normalizeJapaneseQuery("　必ず　")).toBe("必ず");
  });

  it("converts full-width digits and latin to half-width", () => {
    expect(normalizeJapaneseQuery("ＡＢＣ１２３")).toBe("abc123");
  });

  it("strips common punctuation", () => {
    expect(normalizeJapaneseQuery("hello, world!")).toBe("hello world");
    expect(normalizeJapaneseQuery("これは。テスト、です")).toBe("これは テスト です");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeJapaneseQuery("")).toBe("");
  });
});

describe("normalize-query: normalizeKotobaQuery", () => {
  it("matches normalizeJapaneseQuery behavior", () => {
    expect(normalizeKotobaQuery("　ＴＥＳＴ。")).toBe("test");
  });
});

describe("normalize-query: normalizeBunpouQuery", () => {
  it("preserves the 〜 wave-dash used by grammar patterns", () => {
    expect(normalizeBunpouQuery("〜ながら")).toBe("〜ながら");
  });

  it("collapses spaces around the wave-dash", () => {
    expect(normalizeBunpouQuery("〜 ながら")).toBe("〜ながら");
    expect(normalizeBunpouQuery("つつ 〜")).toBe("つつ〜");
  });
});

describe("normalize-query: normalizeKanjiQuery", () => {
  it("returns the first Japanese character", () => {
    expect(normalizeKanjiQuery("漢字")).toBe("漢");
  });

  it("skips leading latin/space and finds the first JP char", () => {
    expect(normalizeKanjiQuery("  abc 食 def")).toBe("食");
  });

  it("returns empty string when no Japanese char present", () => {
    expect(normalizeKanjiQuery("hello")).toBe("");
    expect(normalizeKanjiQuery("")).toBe("");
  });
});

describe("normalize-query: hasJapanese", () => {
  it("detects hiragana / katakana / kanji", () => {
    expect(hasJapanese("ひらがな")).toBe(true);
    expect(hasJapanese("カタカナ")).toBe(true);
    expect(hasJapanese("漢字")).toBe(true);
  });

  it("returns false for pure latin", () => {
    expect(hasJapanese("romaji only")).toBe(false);
  });
});
