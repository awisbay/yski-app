import React from "react"
import { render, screen } from "@testing-library/react"
import { DataTablePagination } from "@/components/data-table/DataTablePagination"
import {
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
    ColumnDef,
} from "@tanstack/react-table"

interface TestItem {
    id: number
    name: string
}

const columns: ColumnDef<TestItem, unknown>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Name" },
]

// Generate 50 items for pagination testing
const generateItems = (count: number): TestItem[] =>
    Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }))

// Wrapper that sets up a real TanStack Table
function PaginationWrapper({ data, pageSize = 10 }: { data: TestItem[]; pageSize?: number }) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: { pageIndex: 0, pageSize },
        },
    })
    return <DataTablePagination table={table} />
}

describe("DataTablePagination", () => {
    it("renders total data count", () => {
        render(<PaginationWrapper data={generateItems(25)} />)
        expect(screen.getByText("25 total data")).toBeInTheDocument()
    })

    it("renders 'Baris per halaman' label", () => {
        render(<PaginationWrapper data={generateItems(10)} />)
        expect(screen.getByText("Baris per halaman")).toBeInTheDocument()
    })

    it("shows current page info", () => {
        render(<PaginationWrapper data={generateItems(50)} pageSize={10} />)
        // Page 1 of 5
        expect(screen.getByText(/Hal\. 1 dari 5/)).toBeInTheDocument()
    })

    it("renders four navigation buttons", () => {
        const { container } = render(<PaginationWrapper data={generateItems(50)} pageSize={10} />)
        // first, prev, next, last buttons
        const buttons = container.querySelectorAll("button")
        expect(buttons.length).toBeGreaterThanOrEqual(4)
    })

    it("disables first/prev buttons on page 1", () => {
        const { container } = render(<PaginationWrapper data={generateItems(50)} pageSize={10} />)
        // Nav buttons have variant="outline" — select them specifically
        const navButtons = container.querySelectorAll('button[data-variant="outline"]')
        // First two nav buttons (first page, previous page) should be disabled
        expect(navButtons[0]).toBeDisabled()
        expect(navButtons[1]).toBeDisabled()
    })

    it("shows correct total count when data is empty", () => {
        render(<PaginationWrapper data={[]} />)
        expect(screen.getByText("0 total data")).toBeInTheDocument()
    })

    it("shows page 1 of 1 when all data fits in one page", () => {
        render(<PaginationWrapper data={generateItems(5)} pageSize={10} />)
        expect(screen.getByText(/Hal\. 1 dari 1/)).toBeInTheDocument()
    })

    it("disables all navigation buttons when only one page", () => {
        const { container } = render(<PaginationWrapper data={generateItems(5)} pageSize={10} />)
        // Nav buttons have variant="outline" — all should be disabled on single page
        const navButtons = container.querySelectorAll('button[data-variant="outline"]')
        navButtons.forEach((btn) => {
            expect(btn).toBeDisabled()
        })
    })
})
