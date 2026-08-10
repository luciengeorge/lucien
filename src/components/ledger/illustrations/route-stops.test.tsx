import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ROUTE_STOPS, RouteStops } from "./route-stops";

afterEach(() => {
  cleanup();
});

describe("RouteStops", () => {
  it("names every stop and when he got there", () => {
    render(<RouteStops />);

    for (const stop of ROUTE_STOPS) {
      expect(screen.getByText(stop.place)).toBeTruthy();
      expect(screen.getByText(stop.year)).toBeTruthy();
    }
  });

  it("runs in order, so it reads as a route rather than a set of places", () => {
    const { container } = render(<RouteStops />);

    expect(container.querySelector("ol")).toBeTruthy();
    expect(container.querySelectorAll("ol > li").length).toBe(ROUTE_STOPS.length);
  });

  it("is text a screen reader can read, not a picture of a map", () => {
    render(<RouteStops />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Beirut")).toBeTruthy();
  });

  it("keeps the connectors between stops out of the accessibility tree", () => {
    const { container } = render(<RouteStops />);

    const connectors = container.querySelectorAll("[data-slot='route-connector']");
    expect(connectors.length).toBe(ROUTE_STOPS.length - 1);
    for (const connector of connectors) {
      expect(connector.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("marks only where he is now, so the stamp still means current", () => {
    const { container } = render(<RouteStops />);

    const current = container.querySelectorAll("[data-current='true']");
    expect(current.length).toBe(1);
    expect(ROUTE_STOPS.at(-1)?.place).toBe("London");
  });
});
