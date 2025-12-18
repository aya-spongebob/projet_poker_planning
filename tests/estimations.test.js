import { describe, it, expect } from "vitest";
import { average, median, absoluteMajority, relativeMajority } from "../src/estimation.js";

describe("estimation", () => {
  it("average", () => {
    expect(average([1, 2, 3])).toBe(2);
    expect(average([])).toBe(null);
  });

  it("median", () => {
    expect(median([1, 3, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBe(null);
  });

  it("absoluteMajority", () => {
    expect(absoluteMajority([3, 3, 3, 2])).toBe(3);
    expect(absoluteMajority([1, 2, 2, 3])).toBe(null);
  });

  it("relativeMajority", () => {
    expect(relativeMajority([1, 2, 2, 3])).toBe(2);
    expect(relativeMajority([])).toBe(null);
  });
});
