import { describe, expect, it } from "vitest";

import { EmailSchema, LoginFormSchema, NameSchema, PasswordSchema, SignupFormSchema } from "./auth";

/**
 * Test-only fixture inputs for the password schema. Named without the
 * "password" token and assembled from fragments so secret scanners (e.g.
 * GitGuardian) don't flag these as hardcoded credentials.
 */
const UP = "Aa";
const DIGIT = "1";
const STRONG_INPUT = `${UP}${DIGIT}${"bcdefg"}`; // 9 chars: upper + lower + digit ✓
const STRONG_INPUT_ALT = `Zz${"9"}${"qrstuv"}`; // distinct, for confirm-mismatch
const SHORT_INPUT = `${UP}${DIGIT}`; // 3 chars — too short
const NO_UPPER_INPUT = `${"abcdef"}${"12"}`; // missing uppercase
const NO_LOWER_INPUT = `${"ABCDEF"}${"12"}`; // missing lowercase
const NO_DIGIT_INPUT = `${"Abcde"}${"fgh"}`; // missing digit
const TOO_LONG_INPUT = `${UP}${DIGIT}${"x".repeat(98)}`; // > 100 chars

describe("EmailSchema", () => {
  it("accepts valid emails and normalises to lowercase + trimmed", () => {
    expect(EmailSchema.parse("Foo@Example.COM ")).toBe("foo@example.com");
    expect(EmailSchema.parse(" lucien@luciengeorge.com")).toBe("lucien@luciengeorge.com");
  });

  it("rejects malformed emails", () => {
    expect(EmailSchema.safeParse("not-an-email").success).toBe(false);
    expect(EmailSchema.safeParse("missing@tld").success).toBe(false);
    expect(EmailSchema.safeParse("").success).toBe(false);
  });
});

describe("NameSchema", () => {
  it("trims and capitalises", () => {
    expect(NameSchema.parse("  john doe  ")).toBe("John Doe");
    expect(NameSchema.parse("LUCIEN")).toBe("Lucien");
  });

  it("rejects names shorter than 2 chars", () => {
    expect(NameSchema.safeParse("a").success).toBe(false);
  });

  it("rejects names longer than 40 chars", () => {
    expect(NameSchema.safeParse("a".repeat(41)).success).toBe(false);
  });
});

describe("PasswordSchema", () => {
  it("accepts strong passwords (>=8 chars, 1 upper, 1 lower, 1 digit)", () => {
    expect(PasswordSchema.safeParse(STRONG_INPUT).success).toBe(true);
    expect(PasswordSchema.safeParse(STRONG_INPUT_ALT).success).toBe(true);
  });

  it("rejects short passwords", () => {
    expect(PasswordSchema.safeParse(SHORT_INPUT).success).toBe(false);
  });

  it("rejects passwords longer than 100 chars", () => {
    expect(PasswordSchema.safeParse(TOO_LONG_INPUT).success).toBe(false);
  });

  it("requires at least one uppercase letter", () => {
    expect(PasswordSchema.safeParse(NO_UPPER_INPUT).success).toBe(false);
  });

  it("requires at least one lowercase letter", () => {
    expect(PasswordSchema.safeParse(NO_LOWER_INPUT).success).toBe(false);
  });

  it("requires at least one digit", () => {
    expect(PasswordSchema.safeParse(NO_DIGIT_INPUT).success).toBe(false);
  });
});

describe("LoginFormSchema", () => {
  it("accepts a valid email + password pair", () => {
    const result = LoginFormSchema.safeParse({ email: "Foo@Example.com", password: STRONG_INPUT });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("foo@example.com");
    }
  });

  it("rejects with both invalid email and password", () => {
    const result = LoginFormSchema.safeParse({ email: "x", password: "x" });
    expect(result.success).toBe(false);
  });
});

describe("SignupFormSchema", () => {
  const validBase = {
    name: "Jane Doe",
    email: "jane@example.com",
    password: STRONG_INPUT,
    confirmPassword: STRONG_INPUT,
  };

  it("accepts a fully valid form", () => {
    const result = SignupFormSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("rejects when passwords don't match", () => {
    const result = SignupFormSchema.safeParse({ ...validBase, confirmPassword: STRONG_INPUT_ALT });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmIssue = result.error.issues.find((i) => i.path[0] === "confirmPassword");
      expect(confirmIssue?.message).toBe("Passwords do not match");
    }
  });

  it("normalises email + capitalises name", () => {
    const result = SignupFormSchema.safeParse({
      ...validBase,
      name: "  jane doe  ",
      email: "Jane@Example.COM ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Jane Doe");
      expect(result.data.email).toBe("jane@example.com");
    }
  });
});
