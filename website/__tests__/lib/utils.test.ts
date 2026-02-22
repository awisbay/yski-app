import { cn, formatCurrency, formatDate, formatDateTime, formatRelative, formatNumber } from "@/lib/utils"

describe("cn()", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })

  it("deduplicates tailwind conflicts", () => {
    // twMerge should pick the last conflicting class
    const result = cn("p-2", "p-4")
    expect(result).toBe("p-4")
  })

  it("handles undefined and null gracefully", () => {
    expect(cn("a", undefined, null as unknown as string, "b")).toBe("a b")
  })
})

describe("formatCurrency()", () => {
  it("formats zero correctly", () => {
    expect(formatCurrency(0)).toContain("0")
    expect(formatCurrency(0)).toContain("Rp")
  })

  it("formats positive amounts", () => {
    const result = formatCurrency(1000000)
    expect(result).toContain("1.000.000")
    expect(result).toContain("Rp")
  })

  it("formats large amounts without decimals", () => {
    const result = formatCurrency(500000)
    expect(result).not.toContain(",00")
  })
})

describe("formatDate()", () => {
  it("returns em-dash for null", () => {
    expect(formatDate(null)).toBe("—")
  })

  it("returns em-dash for undefined", () => {
    expect(formatDate(undefined)).toBe("—")
  })

  it("formats a valid ISO date string", () => {
    const result = formatDate("2026-01-15T10:00:00Z")
    expect(result).toContain("2026")
    expect(result).toContain("Jan")
  })

  it("uses custom format pattern", () => {
    const result = formatDate("2026-06-01T00:00:00Z", "yyyy/MM/dd")
    expect(result).toMatch(/2026\/06\/01/)
  })

  it("returns em-dash for invalid date string", () => {
    expect(formatDate("not-a-date")).toBe("—")
  })
})

describe("formatDateTime()", () => {
  it("returns em-dash for null", () => {
    expect(formatDateTime(null)).toBe("—")
  })

  it("includes time component", () => {
    const result = formatDateTime("2026-01-15T14:30:00Z")
    // Should contain a time-like pattern (HH:mm)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe("formatNumber()", () => {
  it("formats integers with thousand separators", () => {
    expect(formatNumber(1000)).toContain("1")
    expect(formatNumber(1000)).toContain("000")
  })

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0")
  })

  it("formats large numbers", () => {
    const result = formatNumber(1234567)
    expect(result).toContain("1")
    expect(result).toContain("234")
    expect(result).toContain("567")
  })
})

describe("formatRelative()", () => {
  it("returns em-dash for null", () => {
    expect(formatRelative(null)).toBe("—")
  })

  it("returns a relative string for a recent date", () => {
    const recent = new Date(Date.now() - 60000).toISOString() // 1 minute ago
    const result = formatRelative(recent)
    expect(typeof result).toBe("string")
    expect(result.length).toBeGreaterThan(0)
    expect(result).not.toBe("—")
  })
})
