/**
 * Unit Tests for Result Type
 *
 * Tests the Result type utilities for type-safe error handling.
 */

import { describe, it, expect } from "vitest";
import {
	ok,
	err,
	isOk,
	isErr,
	unwrap,
	unwrapOr,
	mapResult,
	mapError,
	tryCatch,
	trySync,
	combine,
} from "@/lib/result";

describe("Result Type Basics", () => {
	it("should create success result with ok()", () => {
		const result = ok(42);
		expect(result.success).toBe(true);
		expect(result.data).toBe(42);
	});

	it("should create error result with err()", () => {
		const error = new Error("Something went wrong");
		const result = err(error);
		expect(result.success).toBe(false);
		expect(result.error).toBe(error);
	});

	it("should check success with isOk()", () => {
		const success = ok(100);
		const failure = err(new Error("fail"));
		expect(isOk(success)).toBe(true);
		expect(isOk(failure)).toBe(false);
	});

	it("should check failure with isErr()", () => {
		const success = ok(100);
		const failure = err(new Error("fail"));
		expect(isErr(success)).toBe(false);
		expect(isErr(failure)).toBe(true);
	});
});

describe("unwrap", () => {
	it("should unwrap successful result", () => {
		const result = ok("hello");
		expect(unwrap(result)).toBe("hello");
	});

	it("should throw on error result", () => {
		const error = new Error("fail");
		const result = err(error);
		expect(() => unwrap(result)).toThrow("fail");
	});
});

describe("unwrapOr", () => {
	it("should return data for successful result", () => {
		const result = ok("value");
		expect(unwrapOr(result, "default")).toBe("value");
	});

	it("should return default for error result", () => {
		const result = err(new Error("fail"));
		expect(unwrapOr(result, "default")).toBe("default");
	});
});

describe("mapResult", () => {
	it("should transform successful result", () => {
		const result = ok(5);
		const mapped = mapResult(result, (n) => n * 2);
		expect(isOk(mapped) && mapped.data).toBe(10);
	});

	it("should not transform error result", () => {
		const error = new Error("fail");
		const result = err(error);
		const mapped = mapResult(result, (n: number) => n * 2);
		expect(isErr(mapped) && mapped.error).toBe(error);
	});
});

describe("mapError", () => {
	it("should transform error result", () => {
		const result = err(new Error("original"));
		const mapped = mapError(
			result,
			(e) => new Error("transformed: " + e.message),
		);
		expect(isErr(mapped) && mapped.error.message).toBe("transformed: original");
	});

	it("should not transform successful result", () => {
		const result = ok(42);
		const mapped = mapError(
			result,
			(_e: Error) => new Error("should not happen"),
		);
		expect(isOk(mapped) && mapped.data).toBe(42);
	});
});

describe("tryCatch", () => {
	it("should convert successful promise to ok result", async () => {
		const promise = Promise.resolve("success");
		const result = await tryCatch(promise);
		expect(result.success).toBe(true);
		expect(isOk(result) && result.data).toBe("success");
	});

	it("should convert rejected promise to err result", async () => {
		const error = new Error("async error");
		const promise = Promise.reject(error);
		const result = await tryCatch(promise);
		expect(result.success).toBe(false);
		expect(isErr(result) && result.error).toBe(error);
	});

	it("should handle non-Error rejections", async () => {
		const promise = Promise.reject("string error");
		const result = await tryCatch(promise);
		expect(result.success).toBe(false);
		expect(isErr(result) && result.error.message).toBe("string error");
	});
});

describe("trySync", () => {
	it("should convert successful function to ok result", () => {
		const fn = () => 42;
		const result = trySync(fn);
		expect(result.success).toBe(true);
		expect(isOk(result) && result.data).toBe(42);
	});

	it("should convert throwing function to err result", () => {
		const error = new Error("sync error");
		const fn = () => {
			throw error;
		};
		const result = trySync(fn);
		expect(result.success).toBe(false);
		expect(isErr(result) && result.error).toBe(error);
	});

	it("should handle non-Error throws", () => {
		const fn = () => {
			throw "string error";
		};
		const result = trySync(fn);
		expect(result.success).toBe(false);
		expect(isErr(result) && result.error.message).toBe("string error");
	});
});

describe("combine", () => {
	it("should combine multiple successful results", () => {
		const results = [ok(1), ok(2), ok(3)];
		const combined = combine(results);
		expect(combined.success).toBe(true);
		expect(isOk(combined) && combined.data).toEqual([1, 2, 3]);
	});

	it("should return first error if any result fails", () => {
		const error = new Error("second failed");
		const results = [ok(1), err(error), ok(3)];
		const combined = combine(results);
		expect(combined.success).toBe(false);
		expect(isErr(combined) && combined.error).toBe(error);
	});

	it("should handle empty array", () => {
		const results: (typeof ok<number>)[] = [];
		const combined = combine(results);
		expect(combined.success).toBe(true);
		expect(isOk(combined) && combined.data).toEqual([]);
	});
});
