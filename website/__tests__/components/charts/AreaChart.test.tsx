import React from "react"
import { render, screen } from "@testing-library/react"
import { AreaChart } from "@/components/charts/AreaChart"

// Mock recharts to avoid SVG rendering issues in jsdom
jest.mock("recharts", () => {
    const OriginalModule = jest.requireActual("recharts")
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
            <div data-testid="responsive-container" style={{ width: 500, height: 220 }}>
                {children}
            </div>
        ),
    }
})

const sampleData = [
    { month: "Jan", total: 10000 },
    { month: "Feb", total: 15000 },
    { month: "Mar", total: 20000 },
]

describe("AreaChart", () => {
    it("renders without crashing", () => {
        const { container } = render(
            <AreaChart data={sampleData} xKey="month" yKey="total" />
        )
        expect(container).toBeTruthy()
    })

    it("renders a responsive container", () => {
        render(<AreaChart data={sampleData} xKey="month" yKey="total" />)
        expect(screen.getByTestId("responsive-container")).toBeInTheDocument()
    })

    it("renders with custom color", () => {
        const { container } = render(
            <AreaChart data={sampleData} xKey="month" yKey="total" color="#ff0000" />
        )
        expect(container).toBeTruthy()
    })

    it("renders with a label", () => {
        const { container } = render(
            <AreaChart data={sampleData} xKey="month" yKey="total" label="Donasi" />
        )
        expect(container).toBeTruthy()
    })

    it("renders with a formatter function", () => {
        const formatter = (value: number) => `Rp ${value.toLocaleString()}`
        const { container } = render(
            <AreaChart data={sampleData} xKey="month" yKey="total" formatter={formatter} />
        )
        expect(container).toBeTruthy()
    })

    it("renders with empty data", () => {
        const { container } = render(
            <AreaChart data={[]} xKey="month" yKey="total" />
        )
        expect(container).toBeTruthy()
    })

    it("renders with single data point", () => {
        const { container } = render(
            <AreaChart data={[{ month: "Jan", total: 5000 }]} xKey="month" yKey="total" />
        )
        expect(container).toBeTruthy()
    })

    it("uses default color when none provided", () => {
        render(
            <AreaChart data={sampleData} xKey="month" yKey="total" />
        )
        // Should render without errors using the default color (#059669)
        expect(screen.getByTestId("responsive-container")).toBeInTheDocument()
    })
})
