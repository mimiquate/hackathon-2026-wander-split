import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BalanceTab } from "./BalanceTab";
import type { TripCrewMember } from "@/lib/trips/membership";
import type { TripBalanceResult } from "@/lib/trips/balance";
import type { TripSettlement } from "@/lib/trips/settlement";

const { markTransferSettledAction } = vi.hoisted(() => ({ markTransferSettledAction: vi.fn() }));
vi.mock("./actions", () => ({ markTransferSettledAction }));

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
    totalSpend: 0,
    categoryTotals: [],
    hasPendingExpenses: false,
    transfers: [],
    ...overrides,
  };
}

function emptySettlement(overrides: Partial<TripSettlement> = {}): TripSettlement {
  return {
    transfers: [],
    historicalSettledTransfers: [],
    canSettle: false,
    ...overrides,
  };
}

const TWO_PERSON_BALANCE = emptyBalance({
  totalSpend: 100,
  balances: [
    { membershipId: "m1", paid: 100, consumed: 50, net: 50 },
    { membershipId: "m2", paid: 0, consumed: 50, net: -50 },
  ],
});

const ONE_TRANSFER = { fromMembershipId: "m2", toMembershipId: "m1", amount: 50 };

describe("BalanceTab", () => {
  it("shows the empty state when there are no expenses yet", () => {
    render(<BalanceTab tripId="trip-1" members={members} balance={emptyBalance()} settlement={emptySettlement()} />);

    expect(screen.getByText(/Todavía no cargaste ningún gasto/)).toBeInTheDocument();
  });

  it("renders each person's paid, consumed, and net figures", () => {
    render(
      <BalanceTab
        tripId="trip-1"
        members={members}
        balance={TWO_PERSON_BALANCE}
        settlement={emptySettlement({ transfers: [{ ...ONE_TRANSFER, settled: false }] })}
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
        tripId="trip-1"
        members={members}
        balance={TWO_PERSON_BALANCE}
        settlement={emptySettlement({ transfers: [{ ...ONE_TRANSFER, settled: false }] })}
      />,
    );

    expect(screen.getByText(/Bea le transfiere/)).toBeInTheDocument();
    expect(screen.getByText(/a Ana/)).toBeInTheDocument();
    expect(screen.getByText("US$ 50,00", { selector: "strong" })).toBeInTheDocument();
  });

  it("renders the total spend, category breakdown, and final cost per person", () => {
    render(
      <BalanceTab
        tripId="trip-1"
        members={members}
        balance={emptyBalance({
          totalSpend: 150,
          balances: [
            { membershipId: "m1", paid: 150, consumed: 75, net: 75 },
            { membershipId: "m2", paid: 0, consumed: 75, net: -75 },
          ],
          categoryTotals: [
            { category: "transporte", amount: 100 },
            { category: "comida", amount: 50 },
          ],
        })}
        settlement={emptySettlement({
          transfers: [{ fromMembershipId: "m2", toMembershipId: "m1", amount: 75, settled: false }],
        })}
      />,
    );

    expect(screen.getByText("US$ 150,00")).toBeInTheDocument();
    expect(screen.getByText("Transporte")).toBeInTheDocument();
    expect(screen.getByText("Comida")).toBeInTheDocument();

    const finalCostSection = screen.getByText("Costo final por persona").closest("div") as HTMLElement;
    expect(within(finalCostSection).getAllByText("US$ 75,00")).toHaveLength(2);
  });

  it("shows the all-settled state when there are no live transfers", () => {
    render(
      <BalanceTab
        tripId="trip-1"
        members={members}
        balance={emptyBalance({
          totalSpend: 100,
          balances: [
            { membershipId: "m1", paid: 50, consumed: 50, net: 0 },
            { membershipId: "m2", paid: 50, consumed: 50, net: 0 },
          ],
          categoryTotals: [{ category: "otro", amount: 100 }],
        })}
        settlement={emptySettlement()}
      />,
    );

    expect(screen.getByText("Todo saldado. Nadie le debe nada a nadie.")).toBeInTheDocument();
  });

  it("shows a pending note when any counted expense is still unadjusted", () => {
    render(
      <BalanceTab
        tripId="trip-1"
        members={members}
        balance={emptyBalance({
          totalSpend: 100,
          balances: [{ membershipId: "m1", paid: 100, consumed: 100, net: 0 }],
          categoryTotals: [{ category: "otro", amount: 100 }],
          hasPendingExpenses: true,
        })}
        settlement={emptySettlement()}
      />,
    );

    expect(screen.getByText(/pendientes de ajuste/)).toBeInTheDocument();
  });

  describe("marking a transfer settled", () => {
    it("disables the settle action before the trip is finished", () => {
      render(
        <BalanceTab
          tripId="trip-1"
          members={members}
          balance={TWO_PERSON_BALANCE}
          settlement={emptySettlement({ transfers: [{ ...ONE_TRANSFER, settled: false }], canSettle: false })}
        />,
      );

      expect(screen.getByRole("button", { name: "Marcar como saldada" })).toBeDisabled();
    });

    it("enables the settle action once the trip is finished, and marks it done on click without removing the row", async () => {
      const user = userEvent.setup();
      markTransferSettledAction.mockResolvedValue({ ok: true });

      // Three people so two transfers are outstanding — settling one should
      // leave the other actionable, rather than tripping the all-settled
      // state (that's covered by its own test below).
      const CARO: TripCrewMember = {
        membershipId: "m3",
        userId: "u3",
        displayName: "Caro",
        colorIndex: 2,
        role: "participant",
      };
      const otherTransfer = { fromMembershipId: "m3", toMembershipId: "m1", amount: 30 };

      render(
        <BalanceTab
          tripId="trip-1"
          members={[...members, CARO]}
          balance={TWO_PERSON_BALANCE}
          settlement={emptySettlement({
            transfers: [
              { ...ONE_TRANSFER, settled: false },
              { ...otherTransfer, settled: false },
            ],
            canSettle: true,
          })}
        />,
      );

      const settleButtons = screen.getAllByRole("button", { name: "Marcar como saldada" });
      expect(settleButtons).toHaveLength(2);

      await user.click(settleButtons[0]);

      expect(markTransferSettledAction).toHaveBeenCalledWith("trip-1", ONE_TRANSFER);
      await waitFor(() =>
        expect(screen.getAllByRole("button", { name: "Marcar como saldada" })).toHaveLength(1),
      );
      // The settled transfer stays visible (greyed out via SettleRow's `done`), not removed.
      expect(screen.getByText(/Bea le transfiere/)).toBeInTheDocument();
      expect(screen.getByText(/Caro le transfiere/)).toBeInTheDocument();
    });

    it("shows the all-settled state once every transfer is marked done", () => {
      render(
        <BalanceTab
          tripId="trip-1"
          members={members}
          balance={TWO_PERSON_BALANCE}
          settlement={emptySettlement({ transfers: [{ ...ONE_TRANSFER, settled: true }], canSettle: true })}
        />,
      );

      expect(screen.getByText("Todo saldado. Nadie le debe nada a nadie.")).toBeInTheDocument();
    });

    it("surfaces a settled transfer that no longer matches any live suggestion as historical", () => {
      render(
        <BalanceTab
          tripId="trip-1"
          members={members}
          balance={TWO_PERSON_BALANCE}
          settlement={emptySettlement({
            transfers: [{ ...ONE_TRANSFER, settled: false }],
            historicalSettledTransfers: [
              { fromMembershipId: "m2", toMembershipId: "m1", amount: 999, settledAt: new Date("2026-01-01") },
            ],
            canSettle: true,
          })}
        />,
      );

      expect(screen.getByText(/ya no las pide/)).toBeInTheDocument();
      expect(screen.getByText("US$ 999,00", { selector: "strong" })).toBeInTheDocument();
    });
  });
});
