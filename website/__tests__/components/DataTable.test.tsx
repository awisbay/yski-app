import React from "react"
import { render, screen } from "@testing-library/react"
import { DataTable } from "@/components/data-table/DataTable"
import { ColumnDef } from "@tanstack/react-table"

// Mock the DataTablePagination to simplify
jest.mock("@/components/data-table/DataTablePagination", () => ({
    DataTablePagination: () => <div data-testid="pagination">Pagination</div>,
}))

interface TestRow {
    id: number
    name: string
    email: string
}

const columns: ColumnDef<TestRow, unknown>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Nama" },
    { accessorKey: "email", header: "Email" },
]

const sampleData: TestRow[] = [
    { id: 1, name: "Alice", email: "alice@example.com" },
    { id: 2, name: "Bob", email: "bob@example.com" },
    { id: 3, name: "Charlie", email: "charlie@example.com" },
]

describe("DataTable", () => {
    it("renders table headers from column definitions", () => {
        render(<DataTable columns={columns} data={sampleData} />)
        expect(screen.getByText("ID")).toBeInTheDocument()
        expect(screen.getByText("Nama")).toBeInTheDocument()
        expect(screen.getByText("Email")).toBeInTheDocument()
    })

    it("renders all data rows", () => {
        render(<DataTable columns={columns} data={sampleData} />)
        expect(screen.getByText("Alice")).toBeInTheDocument()
        expect(screen.getByText("Bob")).toBeInTheDocument()
        expect(screen.getByText("Charlie")).toBeInTheDocument()
    })

    it("renders email cell values", () => {
        render(<DataTable columns={columns} data={sampleData} />)
        expect(screen.getByText("alice@example.com")).toBeInTheDocument()
        expect(screen.getByText("bob@example.com")).toBeInTheDocument()
    })

    it("shows empty state when data is empty", () => {
        render(<DataTable columns={columns} data={[]} />)
        expect(screen.getByText("Tidak ada data")).toBeInTheDocument()
    })

    it("renders skeleton rows when loading=true", () => {
        const { container } = render(<DataTable columns={columns} data={[]} loading={true} />)
        // 5 skeleton rows × 3 columns = 15 skeleton cells
        const skeletons = container.querySelectorAll(".h-4.w-full")
        expect(skeletons.length).toBe(15)
    })

    it("does not show 'Tidak ada data' when loading", () => {
        render(<DataTable columns={columns} data={[]} loading={true} />)
        expect(screen.queryByText("Tidak ada data")).not.toBeInTheDocument()
    })

    it("renders the pagination component", () => {
        render(<DataTable columns={columns} data={sampleData} />)
        expect(screen.getByTestId("pagination")).toBeInTheDocument()
    })

    it("renders the correct number of table rows (excluding header)", () => {
        const { container } = render(<DataTable columns={columns} data={sampleData} />)
        // Header row + 3 data rows = 4 tr elements total
        const rows = container.querySelectorAll("tbody tr")
        expect(rows.length).toBe(3)
    })

    it("applies striped row styling to odd rows", () => {
        const { container } = render(<DataTable columns={columns} data={sampleData} />)
        const dataRows = container.querySelectorAll("tbody tr")
        // Second row (index 1) should have the striped class
        expect(dataRows[1]).toHaveClass("bg-gray-50/50")
    })

    it("does not show data cells when loading", () => {
        render(<DataTable columns={columns} data={sampleData} loading={true} />)
        expect(screen.queryByText("Alice")).not.toBeInTheDocument()
    })

    it("renders table inside a bordered container", () => {
        const { container } = render(<DataTable columns={columns} data={sampleData} />)
        expect(container.querySelector(".rounded-lg.border")).toBeInTheDocument()
    })

    it("renders with single row data", () => {
        render(<DataTable columns={columns} data={[sampleData[0]]} />)
        expect(screen.getByText("Alice")).toBeInTheDocument()
        expect(screen.queryByText("Bob")).not.toBeInTheDocument()
    })
})
