import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BalanceTab } from "./BalanceTab";
import type { TripCrewMember } from "@/lib/trips/membership";
import type { TripBalanceResult } from "@/lib/trips/balance";

const ANA: TripCrewMember = { membershipId: "m1", userId: "u1", displayName: "Ana", colorIndex: 0, role: "admin" };
const BEA: TripCrewMember = {
  membershipId: "m2",
  userId: "u2",
  displayName: "Bea",
  colorIndex: 1,
  role: "participant",
};
const members = [ANA, BEA];

function emptyBalance(overrides: Partial<TripBalanceResult> = {}): TripBalanceResult {
  return {
    currency: "USD",
    balances: [],
    transfers: [],
    totalSpend: 0,
    categoryTotals: [],
    hasPendingExpenses: false,
    ...overrides,
  };
}

describe("BalanceTab", () => {
  it("shows the empty state when there are no expenses yet", () => {
    render(<BalanceTab members={members} balance={emptyBalance()} />);

    expect(screen.getByText(/Todavía no cargaste ningún gasto/)).toBeInTheDocument();
  });

  it("renders each person's paid, consumed, and net figures", () => {
    render(
      <BalanceTab
        members={members}
        balance={emptyBalance({
          totalSpend: 100,
          balances: [
            { membershipId: "m1", paid: 100, consumed: 50, net: 50 },
            { membershipId: "m2", paid: 0, consumed: 50, net: -50 },
          ],
          transfers: [{ fromMembershipId: "m2", toMembershipId: "m1", amount: 50 }],
          categoryTotals: [{ category: "otro", amount: 100 }],
        })}
      />,
    );

    expect(screen.getByText("Pagó US$ 100,00 · Consumió US$ 50,00")).toBeInTheDocument();
    expect(screen.getByText("Pagó US$ 0,00 · Consumió US$ 50,00")).toBeInTheDocument();
    expect(screen.getByText("+US$ 50,00")).toBeInTheDocument();
    expect(screen.getByText("-US$ 50,00")).toBeInTheDocument();
  });

  it("renders the transfer list in plain language", () => {
    render(
      <BalanceTab
        members={members}
        balance={emptyBalance({
          totalSpend: 100,
          balances: [
            { membershipId: "m1", paid: 100, consumed: 50, net: 50 },
            { membershipId: "m2", paid: 0, consumed: 50, net: -50 },
          ],
          transfers: [{ fromMembershipId: "m2", toMembershipId: "m1", amount: 50 }],
          categoryTotals: [{ category: "otro", amount: 100 }],
        })}
      />,
    );

    expect(screen.getByText(/Bea le transfiere/)).toBeInTheDocument();
    expect(screen.getByText(/a Ana/)).toBeInTheDocument();
    expect(screen.getByText("US$ 50,00", { selector: "strong" })).toBeInTheDocument();
  });

  it("renders the total spend, category breakdown, and final cost per person", () => {
    render(
      <BalanceTab
        members={members}
        balance={emptyBalance({
          totalSpend: 150,
          balances: [
            { membershipId: "m1", paid: 150, consumed: 75, net: 75 },
            { membershipId: "m2", paid: 0, consumed: 75, net: -75 },
          ],
          transfers: [{ fromMembershipId: "m2", toMembershipId: "m1", amount: 75 }],
          categoryTotals: [
            { category: "transporte", amount: 100 },
            { category: "comida", amount: 50 },
          ],
        })}
      />,
    );

    expect(screen.getByText("US$ 150,00")).toBeInTheDocument();
    expect(screen.getByText("Transporte")).toBeInTheDocument();
    expect(screen.getByText("Comida")).toBeInTheDocument();

    const finalCostSection = screen.getByText("Costo final por persona").closest("div") as HTMLElement;
    expect(within(finalCostSection).getAllByText("US$ 75,00")).toHaveLength(2);
  });

  it("shows the all-settled state once every balance nets to zero", () => {
    render(
      <BalanceTab
        members={members}
        balance={emptyBalance({
          totalSpend: 100,
          balances: [
            { membershipId: "m1", paid: 50, consumed: 50, net: 0 },
            { membershipId: "m2", paid: 50, consumed: 50, net: 0 },
          ],
          transfers: [],
          categoryTotals: [{ category: "otro", amount: 100 }],
        })}
      />,
    );

    expect(screen.getByText("Todo saldado. Nadie le debe nada a nadie.")).toBeInTheDocument();
  });

  it("shows a pending note when any counted expense is still unadjusted", () => {
    render(
      <BalanceTab
        members={members}
        balance={emptyBalance({
          totalSpend: 100,
          balances: [{ membershipId: "m1", paid: 100, consumed: 100, net: 0 }],
          transfers: [],
          categoryTotals: [{ category: "otro", amount: 100 }],
          hasPendingExpenses: true,
        })}
      />,
    );

    expect(screen.getByText(/pendientes de ajuste/)).toBeInTheDocument();
  });
});
