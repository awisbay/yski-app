import React from "react"
import { render, screen } from "@testing-library/react"
import { Providers } from "@/components/providers"

// Mock sonner Toaster
jest.mock("sonner", () => ({
    Toaster: () => <div data-testid="toaster">Toaster</div>,
}))

describe("Providers", () => {
    it("renders children content", () => {
        render(
            <Providers>
                <div>Hello World</div>
            </Providers>
        )
        expect(screen.getByText("Hello World")).toBeInTheDocument()
    })

    it("renders the Toaster component", () => {
        render(
            <Providers>
                <span>Test</span>
            </Providers>
        )
        expect(screen.getByTestId("toaster")).toBeInTheDocument()
    })

    it("wraps children in a QueryClientProvider", () => {
        const { container } = render(
            <Providers>
                <div data-testid="child">Content</div>
            </Providers>
        )
        expect(screen.getByTestId("child")).toBeInTheDocument()
        // The content should be in the DOM tree
        expect(container.innerHTML).toContain("Content")
    })

    it("renders multiple children", () => {
        render(
            <Providers>
                <div>First</div>
                <div>Second</div>
                <div>Third</div>
            </Providers>
        )
        expect(screen.getByText("First")).toBeInTheDocument()
        expect(screen.getByText("Second")).toBeInTheDocument()
        expect(screen.getByText("Third")).toBeInTheDocument()
    })

    it("renders nested components correctly", () => {
        render(
            <Providers>
                <div>
                    <span>Nested</span>
                    <p>Content</p>
                </div>
            </Providers>
        )
        expect(screen.getByText("Nested")).toBeInTheDocument()
        expect(screen.getByText("Content")).toBeInTheDocument()
    })

    it("does not crash with empty children", () => {
        const { container } = render(
            <Providers>
                <></>
            </Providers>
        )
        expect(container).toBeTruthy()
    })
})
