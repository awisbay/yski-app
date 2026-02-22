import * as XLSX from "xlsx"
import { exportToExcel, exportMultiSheet } from "@/lib/export"

// Mock XLSX to avoid actual file writes in tests
jest.mock("xlsx", () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}))

describe("exportToExcel()", () => {
  beforeEach(() => jest.clearAllMocks())

  it("calls json_to_sheet with the provided data", () => {
    const data = [{ name: "Alice", amount: 100 }]
    exportToExcel(data, "test-export")
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(data)
  })

  it("calls book_append_sheet with default sheet name", () => {
    exportToExcel([{ a: 1 }], "file")
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "Sheet1"
    )
  })

  it("uses custom sheet name when provided", () => {
    exportToExcel([{ a: 1 }], "file", "Donasi")
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "Donasi"
    )
  })

  it("calls writeFile with .xlsx extension", () => {
    exportToExcel([{ a: 1 }], "my-report")
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), "my-report.xlsx")
  })
})

describe("exportMultiSheet()", () => {
  beforeEach(() => jest.clearAllMocks())

  it("creates a sheet for each entry", () => {
    exportMultiSheet(
      [
        { name: "Sheet A", data: [{ x: 1 }] },
        { name: "Sheet B", data: [{ y: 2 }] },
      ],
      "multi"
    )
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(2)
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2)
  })

  it("calls writeFile once with correct filename", () => {
    exportMultiSheet([{ name: "S1", data: [] }], "combined")
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), "combined.xlsx")
  })
})
