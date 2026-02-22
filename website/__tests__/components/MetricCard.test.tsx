import React from "react"
import { render, screen } from "@testing-library/react"
import { MetricCard } from "@/components/charts/MetricCard"
import { Users } from "lucide-react"

describe("MetricCard", () => {
  it("renders title and value", () => {
    render(<MetricCard title="Total Pengguna" value="1.234" />)
    expect(screen.getByText("Total Pengguna")).toBeInTheDocument()
    expect(screen.getByText("1.234")).toBeInTheDocument()
  })

  it("renders description text", () => {
    render(<MetricCard title="Donasi" value="Rp 5.000.000" description="bulan ini" />)
    expect(screen.getByText("bulan ini")).toBeInTheDocument()
  })

  it("renders positive trend with + prefix", () => {
    render(<MetricCard title="Test" value="100" trend={12.5} />)
    expect(screen.getByText("+12.5%")).toBeInTheDocument()
  })

  it("renders negative trend without + prefix", () => {
    render(<MetricCard title="Test" value="100" trend={-5.0} />)
    expect(screen.getByText("-5.0%")).toBeInTheDocument()
  })

  it("renders skeleton placeholders when loading=true", () => {
    const { container } = render(<MetricCard title="Title" value="123" loading={true} />)
    // Skeleton elements should be present (they have animate-pulse)
    const skeletons = container.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("does not show actual value when loading", () => {
    render(<MetricCard title="Pengguna" value="999" loading={true} />)
    expect(screen.queryByText("999")).not.toBeInTheDocument()
  })

  it("renders icon when provided", () => {
    const { container } = render(<MetricCard title="Users" value="5" icon={Users} />)
    // lucide renders an svg
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("does not render trend section when trend is undefined", () => {
    render(<MetricCard title="Test" value="42" />)
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it("accepts numeric value", () => {
    render(<MetricCard title="Count" value={42} />)
    expect(screen.getByText("42")).toBeInTheDocument()
  })
})
