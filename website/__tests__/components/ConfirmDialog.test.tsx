import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

const defaultProps = {
  open: true,
  onOpenChange: jest.fn(),
  title: "Hapus Data",
  description: "Apakah Anda yakin ingin menghapus data ini?",
  onConfirm: jest.fn(),
}

describe("ConfirmDialog", () => {
  beforeEach(() => jest.clearAllMocks())

  it("renders title and description when open", () => {
    render(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByText("Hapus Data")).toBeInTheDocument()
    expect(screen.getByText("Apakah Anda yakin ingin menghapus data ini?")).toBeInTheDocument()
  })

  it("renders default confirm and cancel labels", () => {
    render(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByText("Konfirmasi")).toBeInTheDocument()
    expect(screen.getByText("Batal")).toBeInTheDocument()
  })

  it("renders custom labels", () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Ya, Hapus"
        cancelLabel="Tidak"
      />
    )
    expect(screen.getByText("Ya, Hapus")).toBeInTheDocument()
    expect(screen.getByText("Tidak")).toBeInTheDocument()
  })

  it("calls onConfirm when confirm button is clicked", async () => {
    const onConfirm = jest.fn()
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)
    await userEvent.click(screen.getByText("Konfirmasi"))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("calls onOpenChange(false) when cancel is clicked", async () => {
    const onOpenChange = jest.fn()
    render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />)
    await userEvent.click(screen.getByText("Batal"))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("disables both buttons when loading=true", () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />)
    const confirmBtn = screen.getByText("Konfirmasi").closest("button")
    const cancelBtn = screen.getByText("Batal").closest("button")
    expect(confirmBtn).toBeDisabled()
    expect(cancelBtn).toBeDisabled()
  })

  it("shows spinner when loading=true", () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />)
    // When loading, the confirm button should contain an SVG icon (Loader2)
    const confirmBtn = screen.getByText("Konfirmasi").closest("button")
    expect(confirmBtn).toBeInTheDocument()
    const svg = confirmBtn?.querySelector("svg")
    expect(svg).toBeInTheDocument()
  })

  it("applies destructive styles for variant=destructive", () => {
    render(<ConfirmDialog {...defaultProps} variant="destructive" confirmLabel="Hapus" />)
    const btn = screen.getByText("Hapus").closest("button")
    expect(btn).toHaveClass("bg-red-600")
  })

  it("applies default green styles for variant=default", () => {
    render(<ConfirmDialog {...defaultProps} variant="default" confirmLabel="OK" />)
    const btn = screen.getByText("OK").closest("button")
    expect(btn).toHaveClass("bg-emerald-600")
  })

  it("does not render when open=false", () => {
    render(<ConfirmDialog {...defaultProps} open={false} />)
    expect(screen.queryByText("Hapus Data")).not.toBeInTheDocument()
  })
})
