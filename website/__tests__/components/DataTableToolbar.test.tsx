import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DataTableToolbar } from "@/components/data-table/DataTableToolbar"

describe("DataTableToolbar", () => {
  it("renders search input with placeholder", () => {
    render(
      <DataTableToolbar
        globalFilter=""
        onGlobalFilterChange={jest.fn()}
        placeholder="Cari pengguna..."
      />
    )
    expect(screen.getByPlaceholderText("Cari pengguna...")).toBeInTheDocument()
  })

  it("shows current filter value in input", () => {
    render(
      <DataTableToolbar
        globalFilter="Alice"
        onGlobalFilterChange={jest.fn()}
      />
    )
    expect(screen.getByDisplayValue("Alice")).toBeInTheDocument()
  })

  it("calls onGlobalFilterChange when user types", async () => {
    const onChange = jest.fn()
    render(
      <DataTableToolbar
        globalFilter=""
        onGlobalFilterChange={onChange}
      />
    )
    await userEvent.type(screen.getByRole("textbox"), "Bob")
    expect(onChange).toHaveBeenCalled()
  })

  it("shows clear button when filter has value", () => {
    render(
      <DataTableToolbar
        globalFilter="hello"
        onGlobalFilterChange={jest.fn()}
      />
    )
    // The X clear button should appear
    const clearBtn = screen.getByRole("button", { hidden: true })
    expect(clearBtn).toBeInTheDocument()
  })

  it("clears filter when X button is clicked", async () => {
    const onChange = jest.fn()
    render(
      <DataTableToolbar
        globalFilter="hello"
        onGlobalFilterChange={onChange}
      />
    )
    const clearBtn = screen.getByRole("button", { hidden: true })
    await userEvent.click(clearBtn)
    expect(onChange).toHaveBeenCalledWith("")
  })

  it("renders action slot content", () => {
    render(
      <DataTableToolbar
        globalFilter=""
        onGlobalFilterChange={jest.fn()}
        actions={<button>Export</button>}
      />
    )
    expect(screen.getByText("Export")).toBeInTheDocument()
  })

  it("uses default placeholder when none provided", () => {
    render(
      <DataTableToolbar
        globalFilter=""
        onGlobalFilterChange={jest.fn()}
      />
    )
    expect(screen.getByPlaceholderText("Cari...")).toBeInTheDocument()
  })
})
