import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ExportButton } from "@/components/shared/ExportButton"
import * as exportLib from "@/lib/export"

jest.mock("@/lib/export", () => ({
  exportToExcel: jest.fn(),
}))

describe("ExportButton", () => {
  beforeEach(() => jest.clearAllMocks())

  it("renders default label", () => {
    render(<ExportButton data={[{ a: 1 }]} filename="test" />)
    expect(screen.getByText("Export Excel")).toBeInTheDocument()
  })

  it("renders custom label", () => {
    render(<ExportButton data={[{ a: 1 }]} filename="test" label="Unduh Data" />)
    expect(screen.getByText("Unduh Data")).toBeInTheDocument()
  })

  it("calls exportToExcel with data and filename on click", async () => {
    const data = [{ name: "Alice", amount: 100 }]
    render(<ExportButton data={data} filename="pengguna-export" />)
    await userEvent.click(screen.getByRole("button"))
    expect(exportLib.exportToExcel).toHaveBeenCalledWith(data, "pengguna-export")
  })

  it("is disabled when data is empty", () => {
    render(<ExportButton data={[]} filename="empty" />)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("does not call exportToExcel when disabled", async () => {
    render(<ExportButton data={[]} filename="empty" />)
    await userEvent.click(screen.getByRole("button"))
    expect(exportLib.exportToExcel).not.toHaveBeenCalled()
  })

  it("is disabled when disabled prop is true", () => {
    render(<ExportButton data={[{ a: 1 }]} filename="test" disabled />)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("renders a download icon", () => {
    const { container } = render(<ExportButton data={[{ a: 1 }]} filename="test" />)
    expect(container.querySelector("svg")).toBeInTheDocument()
  })
})
