import React from "react"
import { render, screen } from "@testing-library/react"
import { DonutChart } from "@/components/charts/DonutChart"

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
    { name: "Admin", value: 5 },
    { name: "Pengurus", value: 12 },
    { name: "Sahabat", value: 150 },
    { name: "Relawan", value: 30 },
]

describe("DonutChart", () => {
    it("renders without crashing", () => {
        const { container } = render(<DonutChart data={sampleData} />)
        expect(container).toBeTruthy()
    })

    it("renders a responsive container", () => {
        render(<DonutChart data={sampleData} />)
        expect(screen.getByTestId("responsive-container")).toBeInTheDocument()
    })

    it("renders with empty data", () => {
        const { container } = render(<DonutChart data={[]} />)
        expect(container).toBeTruthy()
    })

    it("renders with a single data entry", () => {
        const { container } = render(
            <DonutChart data={[{ name: "Admin", value: 10 }]} />
        )
        expect(container).toBeTruthy()
    })

    it("renders with a formatter function", () => {
        const formatter = (value: number) => `${value} orang`
        const { container } = render(
            <DonutChart data={sampleData} formatter={formatter} />
        )
        expect(container).toBeTruthy()
    })

    it("handles data with more entries than colors array", () => {
        // COLORS array has 7 entries, creating 10 entries to test cycling
        const manyEntries = Array.from({ length: 10 }, (_, i) => ({
            name: `Category ${i + 1}`,
            value: (i + 1) * 10,
        }))
        const { container } = render(<DonutChart data={manyEntries} />)
        expect(container).toBeTruthy()
    })

    it("renders with zero-value entries", () => {
        const zeroData = [
            { name: "Active", value: 0 },
            { name: "Inactive", value: 0 },
        ]
        const { container } = render(<DonutChart data={zeroData} />)
        expect(container).toBeTruthy()
    })

    it("renders without formatter prop", () => {
        const { container } = render(<DonutChart data={sampleData} />)
        // Should render without errors even without a formatter
        expect(container.firstChild).toBeTruthy()
    })
})
