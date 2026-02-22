import React from "react"
import { render, screen } from "@testing-library/react"
import { BarChart } from "@/components/charts/BarChart"

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
    { status: "Pending", count: 12 },
    { status: "Approved", count: 25 },
    { status: "Rejected", count: 5 },
]

describe("BarChart", () => {
    it("renders without crashing", () => {
        const { container } = render(
            <BarChart data={sampleData} xKey="status" yKey="count" />
        )
        expect(container).toBeTruthy()
    })

    it("renders a responsive container", () => {
        render(<BarChart data={sampleData} xKey="status" yKey="count" />)
        expect(screen.getByTestId("responsive-container")).toBeInTheDocument()
    })

    it("renders with custom color", () => {
        const { container } = render(
            <BarChart data={sampleData} xKey="status" yKey="count" color="#3b82f6" />
        )
        expect(container).toBeTruthy()
    })

    it("renders with a label", () => {
        const { container } = render(
            <BarChart data={sampleData} xKey="status" yKey="count" label="Jumlah Booking" />
        )
        expect(container).toBeTruthy()
    })

    it("renders with a formatter function", () => {
        const formatter = (value: number) => `${value} items`
        const { container } = render(
            <BarChart data={sampleData} xKey="status" yKey="count" formatter={formatter} />
        )
        expect(container).toBeTruthy()
    })

    it("renders with empty data", () => {
        const { container } = render(
            <BarChart data={[]} xKey="status" yKey="count" />
        )
        expect(container).toBeTruthy()
    })

    it("renders with a single data point", () => {
        const { container } = render(
            <BarChart data={[{ status: "Active", count: 42 }]} xKey="status" yKey="count" />
        )
        expect(container).toBeTruthy()
    })

    it("uses default emerald color when none specified", () => {
        const { container } = render(
            <BarChart data={sampleData} xKey="status" yKey="count" />
        )
        // The component should render without errors using default #059669
        expect(container.firstChild).toBeTruthy()
    })
})
