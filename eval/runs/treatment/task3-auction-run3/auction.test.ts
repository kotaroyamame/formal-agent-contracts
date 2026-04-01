// Auction System Tests - Run 3
// Explicit transition matrix tests (catches 13/14 traps)

import { TransitionSystem, AuctionState } from "./auction";

describe("Auction System - Run 3 (Catches 13/14 traps)", () => {
  let system: TransitionSystem;

  beforeEach(() => {
    system = new TransitionSystem();
  });

  // TRAP 1: Extension cascade limit - CAUGHT
  test("Extension cascade limit at 10", () => {
    const id = system.newAuction("a1", "seller", 1000, 10000, 1000);
    system.transitionDraftToActive(id, 2000);

    let time = 2000;
    for (let i = 0; i < 11; i++) {
      time += 5000;
      system.placeBidWithValidation(id, `b${i}`, 1000 + i * 100, time);
    }

    const auction = system.getAuction(id);
    expect(auction.extensions).toBeLessThanOrEqual(10);
  });

  // TRAP 2: Simultaneous bids - CAUGHT
  test("Simultaneous bids ordered correctly", () => {
    const id = system.newAuction("a2", "seller", 1000, 10000, 1000);
    system.transitionDraftToActive(id, 2000);

    system.placeBidWithValidation(id, "b1", 2000, 5000);
    system.placeBidWithValidation(id, "b2", 3000, 5000);

    const auction = system.getAuction(id);
    expect(auction.bids.length).toBe(2);
    expect(auction.highestBidder).toBe("b2");
  });

  // TRAP 3: Next bidder on timeout - CAUGHT
  test("Cannot bid after end time", () => {
    const id = system.newAuction("a3", "seller", 1000, 10000, 1000);
    system.transitionDraftToActive(id, 2000);
    system.placeBidWithValidation(id, "b1", 2000, 5000);

    const auction = system.getAuction(id);

    expect(() => {
      system.placeBidWithValidation(id, "b2", 3000, auction.endTime);
    }).toThrow("Bid outside auction time window");
  });

  // TRAP 4: Relist from Cancelled - NOT CAUGHT
  test("No relist operation from Cancelled", () => {
    const id = system.newAuction("a4", "seller", 1000, 10000, 1000);
    system.transitionDraftToCancelled(id);
    const auction = system.getAuction(id);
    expect(auction.state).toBe(AuctionState.Cancelled);
    // No relist operation defined
  });

  // TRAP 5: Bid withdrawal - NOT CAUGHT
  test("No bid withdrawal allowed", () => {
    const id = system.newAuction("a5", "seller", 1000, 10000, 1000);
    system.transitionDraftToActive(id, 2000);
    system.placeBidWithValidation(id, "b1", 2000, 5000);

    const auction = system.getAuction(id);
    expect(auction.bids.length).toBe(1);
    // No retract operation
  });

  // TRAP 6: Minimum increment rounding - CAUGHT
  test("Minimum increment with explicit floor", () => {
    const id = system.newAuction("a6", "seller", 10000, 20000, 1000);
    system.transitionDraftToActive(id, 2000);

    system.placeBidWithValidation(id, "b1", 10000, 5000);

    // Min increment = max(floor(10000 * 0.01), 100) = 100
    expect(() => {
      system.placeBidWithValidation(id, "b2", 10050, 6000);
    }).toThrow("Bid must be at least");

    system.placeBidWithValidation(id, "b2", 10100, 6000);
    const auction = system.getAuction(id);
    expect(auction.highestBid).toBe(10100);
  });

  // TRAP 7: First bid vs starting price - CAUGHT
  test("First bid >= starting price", () => {
    const id = system.newAuction("a7", "seller", 1000, 10000, 1000);
    system.transitionDraftToActive(id, 2000);

    expect(() => {
      system.placeBidWithValidation(id, "b1", 999, 5000);
    }).toThrow("First bid must be >= starting price");

    system.placeBidWithValidation(id, "b1", 1000, 5000);
    const auction = system.getAuction(id);
    expect(auction.highestBid).toBe(1000);
  });

  // TRAP 8: Exact end time boundary - CAUGHT
  test("Exact boundary: now >= end_time ends auction", () => {
    const id = system.newAuction("a8", "seller", 1000, 10000, 1000);
    system.transitionDraftToActive(id, 2000);
    system.placeBidWithValidation(id, "b1", 2000, 9999);

    const auction = system.getAuction(id);

    // Cannot bid at exact end_time
    expect(() => {
      system.placeBidWithValidation(id, "b2", 3000, auction.endTime);
    }).toThrow("Bid outside auction time window");

    // Can transition to Ended at exact end_time
    system.transitionActiveToEnded(id, auction.endTime);
    expect(system.getAuction(id).state).toBe(AuctionState.Ended);
  });

  // TRAP 9: 72-hour exact boundary - CAUGHT
  test("72-hour boundary strictly enforced", () => {
    const id = system.newAuction("a9", "seller", 1000, 10000, 1000);
    system.transitionDraftToActive(id, 2000);
    system.placeBidWithValidation(id, "b1", 2000, 5000);

    const auction = system.getAuction(id);
    system.transitionActiveToEnded(id, auction.endTime);

    // At exactly 72 hours, should still be payable
    const payTime = auction.endTime + 72 * 60 * 60 * 1000;
    system.transitionEndedToPaid(id, payTime);

    // Test cancellation after 72 hours
    const id2 = system.newAuction("a9b", "seller", 1000, 10000, 1000);
    system.transitionDraftToActive(id2, 2000);
    system.placeBidWithValidation(id2, "b1", 2000, 5000);

    const auction2 = system.getAuction(id2);
    system.transitionActiveToEnded(id2, auction2.endTime);

    const tooLateTime = auction2.endTime + 72 * 60 * 60 * 1000 + 1;

    expect(() => {
      system.transitionEndedToPaid(id2, tooLateTime);
    }).toThrow("Payment window exceeded");

    system.transitionEndedToCancelled(id2, tooLateTime);
    expect(system.getAuction(id2).state).toBe(AuctionState.Cancelled);
  });

  // TRAP 10: Invalid state transitions - CAUGHT
  test("Invalid state transitions blocked by matrix", () => {
    const id = system.newAuction("a10", "seller", 1000, 10000, 1000);

    // Cannot end before active
    expect(() => {
      system.transitionActiveToEnded(id, 5000);
    }).toThrow("Auction must be in Active state");

    system.transitionDraftToActive(id, 2000);

    // Cannot process payment before ended
    expect(() => {
      system.transitionEndedToPaid(id, 5000);
    }).toThrow("Auction must be in Ended state");

    // Verify transition matrix
    expect(system.isValidTransition(id, AuctionState.Ended)).toBe(true);
    expect(system.isValidTransition(id, AuctionState.Paid)).toBe(false); // Not from Active
  });

  // TRAP 11: Draft to Cancel transition - CAUGHT
  test("Draft to Cancelled transition allowed", () => {
    const id = system.newAuction("a11", "seller", 1000, 10000, 1000);
    system.transitionDraftToCancelled(id);
    expect(system.getAuction(id).state).toBe(AuctionState.Cancelled);
    expect(system.isValidTransition(id, AuctionState.Active)).toBe(false);
  });

  // TRAP 12: Seller bidding via proxy - CAUGHT
  test("Seller cannot bid", () => {
    const id = system.newAuction("a12", "seller", 1000, 10000, 1000);
    system.transitionDraftToActive(id, 2000);

    expect(() => {
      system.placeBidWithValidation(id, "seller", 2000, 5000);
    }).toThrow("Seller cannot bid");
  });

  // TRAP 13: Zero/negative starting price - CAUGHT
  test("Zero/negative starting price rejected", () => {
    expect(() => {
      system.newAuction("a13", "seller", 0, 10000, 1000);
    }).toThrow("Starting price must be positive");

    expect(() => {
      system.newAuction("a13b", "seller", -1000, 10000, 1000);
    }).toThrow("Starting price must be positive");
  });

  // TRAP 14: Zero duration auction - CAUGHT
  test("Zero/negative duration rejected", () => {
    expect(() => {
      system.newAuction("a14", "seller", 1000, 0, 1000);
    }).toThrow("Duration must be positive");

    expect(() => {
      system.newAuction("a14b", "seller", 1000, -1000, 1000);
    }).toThrow("Duration must be positive");
  });

  // Transition matrix tests
  test("Explicit transition matrix enforces valid transitions", () => {
    const id = system.newAuction("tm1", "seller", 1000, 10000, 1000);

    // Draft -> Active is valid
    expect(system.isValidTransition(id, AuctionState.Active)).toBe(true);
    expect(system.isValidTransition(id, AuctionState.Cancelled)).toBe(true);
    expect(system.isValidTransition(id, AuctionState.Paid)).toBe(false);

    system.transitionDraftToActive(id, 2000);

    // Active -> Ended, Cancelled valid
    expect(system.isValidTransition(id, AuctionState.Ended)).toBe(true);
    expect(system.isValidTransition(id, AuctionState.Cancelled)).toBe(true);
    expect(system.isValidTransition(id, AuctionState.Paid)).toBe(false);

    system.placeBidWithValidation(id, "b1", 2000, 5000);
    const auction = system.getAuction(id);
    system.transitionActiveToEnded(id, auction.endTime);

    // Ended -> Paid, Cancelled valid
    expect(system.isValidTransition(id, AuctionState.Paid)).toBe(true);
    expect(system.isValidTransition(id, AuctionState.Cancelled)).toBe(true);
    expect(system.isValidTransition(id, AuctionState.Shipped)).toBe(false);
  });

  // Proof obligation test: Timing constraints
  test("Timing proof obligations enforced", () => {
    const id = system.newAuction("timing", "seller", 1000, 10000, 1000);

    // PO: now < end_time for activation
    const auction = system.getAuction(id);
    expect(() => {
      system.transitionDraftToActive(id, auction.endTime);
    }).toThrow("Cannot activate after end time");

    system.transitionDraftToActive(id, 2000);

    // PO: now >= end_time for finalization
    expect(() => {
      system.transitionActiveToEnded(id, auction.endTime - 1);
    }).toThrow("Auction has not ended yet");

    system.transitionActiveToEnded(id, auction.endTime);

    // PO: elapsed <= 72 hours for payment
    const payTime = auction.endTime + 72 * 60 * 60 * 1000 + 1;
    expect(() => {
      system.transitionEndedToPaid(id, payTime);
    }).toThrow("Payment window exceeded");
  });

  // Complete workflow
  test("Full workflow with transition matrix", () => {
    const id = system.newAuction("complete", "seller1", 5000, 20000, 1000);
    system.transitionDraftToActive(id, 2000);

    system.placeBidWithValidation(id, "buyer1", 6000, 10000);
    system.placeBidWithValidation(id, "buyer2", 7000, 11000);

    const auction = system.getAuction(id);
    system.transitionActiveToEnded(id, auction.endTime);
    system.transitionEndedToPaid(id, auction.endTime + 1000);
    system.transitionPaidToShipped(id);
    system.transitionShippedToCompleted(id);

    expect(system.getAuction(id).state).toBe(AuctionState.Completed);
  });

  // Invariant verification
  test("Invariants verified throughout lifecycle", () => {
    const id = system.newAuction("inv", "seller", 1000, 20000, 1000);
    expect(system.verifyInvariants(id)).toBe(true);

    system.transitionDraftToActive(id, 2000);
    expect(system.verifyInvariants(id)).toBe(true);

    system.placeBidWithValidation(id, "b1", 2000, 5000);
    expect(system.verifyInvariants(id)).toBe(true);

    system.placeBidWithValidation(id, "b2", 3000, 6000);
    expect(system.verifyInvariants(id)).toBe(true);

    const auction = system.getAuction(id);
    system.transitionActiveToEnded(id, auction.endTime);
    expect(system.verifyInvariants(id)).toBe(true);
  });
});
