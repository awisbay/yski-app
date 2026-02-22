import { act, renderHook } from "@testing-library/react"
import { useTable } from "@/hooks/useTable"

describe("useTable()", () => {
  it("initialises with empty sorting", () => {
    const { result } = renderHook(() => useTable())
    expect(result.current.sorting).toEqual([])
  })

  it("initialises with empty columnFilters", () => {
    const { result } = renderHook(() => useTable())
    expect(result.current.columnFilters).toEqual([])
  })

  it("initialises with empty globalFilter", () => {
    const { result } = renderHook(() => useTable())
    expect(result.current.globalFilter).toBe("")
  })

  it("initialises pagination at page 0, size 20", () => {
    const { result } = renderHook(() => useTable())
    expect(result.current.pagination.pageIndex).toBe(0)
    expect(result.current.pagination.pageSize).toBe(20)
  })

  it("initialises empty rowSelection", () => {
    const { result } = renderHook(() => useTable())
    expect(result.current.rowSelection).toEqual({})
  })

  it("setSorting updates sorting state", () => {
    const { result } = renderHook(() => useTable())
    act(() => {
      result.current.setSorting([{ id: "name", desc: false }])
    })
    expect(result.current.sorting).toEqual([{ id: "name", desc: false }])
  })

  it("setGlobalFilter updates globalFilter", () => {
    const { result } = renderHook(() => useTable())
    act(() => {
      result.current.setGlobalFilter("alice")
    })
    expect(result.current.globalFilter).toBe("alice")
  })

  it("setPagination updates page index", () => {
    const { result } = renderHook(() => useTable())
    act(() => {
      result.current.setPagination({ pageIndex: 2, pageSize: 20 })
    })
    expect(result.current.pagination.pageIndex).toBe(2)
  })

  it("setColumnFilters updates filters", () => {
    const { result } = renderHook(() => useTable())
    act(() => {
      result.current.setColumnFilters([{ id: "role", value: "admin" }])
    })
    expect(result.current.columnFilters).toEqual([{ id: "role", value: "admin" }])
  })
})
