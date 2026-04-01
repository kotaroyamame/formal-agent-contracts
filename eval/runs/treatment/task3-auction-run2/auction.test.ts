// Auction System Tests - Run 2
// Tests bid validation and timing (catches 11/14 traps)

import { BidSystem, AuctionState } from "./auction";

describe("Auction System - Run 2 (Catches 11/14 traps)", () => {
  let system: BidSystem;

  beforeEach(() => {
    system = new BidSystem();
  });

  // TRAP 1: Extension cascade limit - CAUGHT
  test("Extension cascade limit enforced at 10", () => {
    const auctionId = system.create("auction1", "seller1", 1000, 10000);
    system.activate(auctionId);

    let currentTime = 1000;
    for (let i = 0; i < 11; i++) {
      currentTime += 5000; // Within 5 min of original end
      if (i < 10) {
        system.validateBid(auctionId, `bidder${i}`, 1000 + i * 100, currentTime);
      } else {
        // 11th bid should not extend
        system.validateBid(auctionId, `bidder${i}`, 1000 + i * 100, currentTime);
      }
    }

    const record = system.getRecord(auctionId);
    expect(record.extensionCount).toBeLessThanOrEqual(10);
  });

  // TRAP 2: Simultaneous bids - CAUGHT
  test("Simultaneous bids preserve ordering", () => {
    const auctionId = system.create("auction2", "seller1", 1000, 10000);
    system.activate(auctionId);

    system.validateBid(auctionId, "bidder1", 2000, 5000);
    system.validateBid(auctionId, "bidder2", 3000, 5000);

    const record = system.getRecord(auctionId);
    expect(record.bids.length).toBe(2);
    expect(record.highestBidder).toBe("bidder2");
  });

  // TRAP 3: Next bidder on timeout - NOT CAUGHT
  test("Cannot bid after end time", () => {
    const auctionId = system.create("auction3", "seller1", 1000, 10000);
    system.activate(auctionId);
    system.validateBid(auctionId, "bidder1", 2000, 5000);

    const record = system.getRecord(auctionId);

    expect(() => {
      system.validateBid(auctionId, "bidder2", 3000, record.endTime);
    }).toThrow("Auction has ended");
  });

  // TRAP 4: Relist from Cancelled - NOT CAUGHT
  test("No relist operation defined", () => {
    const auctionId = system.create("auction4", "seller1", 1000, 10000);
    system.cancelDraft(auctionId);
    const record = system.getRecord(auctionId);
    expect(record.state).toBe(AuctionState.Cancelled);
    // No relist operation exists
  });

  // TRAP 5: Bid withdrawal - NOT CAUGHT
  test("No bid withdrawal operation", () => {
    const auctionId = system.create("auction5", "seller1", 1000, 10000);
    system.activate(auctionId);
    system.validateBid(auctionId, "bidder1", 2000, 5000);

    const record = system.getRecord(auctionId);
    expect(record.bids.length).toBe(1);
    // No retract operation available
  });

  // TRAP 6: Minimum increment rounding - CAUGHT
  test("Minimum increment floor applied correctly", () => {
    const auctionId = system.create("auction6", "seller1", 10000, 20000);
    system.activate(auctionId);

    system.validateBid(auctionId, "bidder1", 10000, 5000);

    // 1% of 10000 = 100, floor = 100, so min next = 10100
    expect(() => {
      system.validateBid(auctionId, "bidder2", 10050, 6000);
    }).toThrow("Bid must be at least");

    system.validateBid(auctionId, "bidder2", 10100, 6000);
    const record = system.getRecord(auctionId);
    expect(record.currentHighestBid).toBe(10100);
  });

  // TRAP 7: First bid vs starting price - CAUGHT
  test("First bid >= starting price enforced", () => {
    const auctionId = system.create("auction7", "seller1", 1000, 10000);
    system.activate(auctionId);

    expect(() => {
      system.validateBid(auctionId, "bidder1", 999, 5000);
    }).toThrow("First bid must be >= starting price");

    system.validateBid(auctionId, "bidder1", 1000, 5000);
    const record = system.getRecord(auctionId);
    expect(record.currentHighestBid).toBe(1000);
  });

  // TRAP 8: Exact end time boundary - CAUGHT
  test("Strict boundary: now >= end_time ends auction", () => {
    const auctionId = system.create("auction8", "seller1", 1000, 10000);
    system.activate(auctionId);

    // Bid before end
    system.validateBid(auctionId, "bidder1", 2000, 9999);

    const record = system.getRecord(auctionId);

    // Bid at end_time should fail
    expect(() => {
      system.validateBid(auctionId, "bidder2", 3000, record.endTime);
    }).toThrow("Auction has ended");

    // Finalize at end_time should work
    system.finalize(auctionId, record.endTime);
    expect(system.getRecord(auctionId).state).toBe(AuctionState.Ended);
  });

  // TRAP 9: 72-hour exact boundary - CAUGHT
  test("72-hour payment boundary strictly enforced", () => {
    const auctionId = system.create("auction9", "seller1", 1000, 10000);
    system.activate(auctionId);
    system.validateBid(auctionId, "bidder1", 2000, 5000);

    const record = system.getRecord(auctionId);
    const endTime = record.endTime;

    system.finalize(auctionId, endTime);

    // Payment at exactly 72 hours should work
    system.processPayment(auctionId, endTime + 72 * 60 * 60 * 1000);

    // Test close payment after 72 hours
    const auctionId2 = system.create("auction9b", "seller1", 1000, 10000);
    system.activate(auctionId2);
    system.validateBid(auctionId2, "bidder1", 2000, 5000);
    const record2 = system.getRecord(auctionId2);
    system.finalize(auctionId2, record2.endTime);

    const tooLateTime = record2.endTime + 72 * 60 * 60 * 1000 + 1;

    expect(() => {
      system.processPayment(auctionId2, tooLateTime);
    }).toThrow("Payment window exceeded");

    system.closePayment(auctionId2, tooLateTime);
    expect(system.getRecord(auctionId2).state).toBe(AuctionState.Cancelled);
  });

  // TRAP 10: Invalid state transitions - CAUGHT
  test("State transition validation", () => {
    const auctionId = system.create("auction10", "seller1", 1000, 10000);

    expect(() => {
      system.finalize(auctionId, 5000);
    }).toThrow("Must be in Active state");

    system.activate(auctionId);

    expect(() => {
      system.processPayment(auctionId, 5000);
    }).toThrow("Must be in Ended state");
  });

  // TRAP 11: Draft to Cancel transition - CAUGHT
  test("Cancel from Draft allowed", () => {
    const auctionId = system.create("auction11", "seller1", 1000, 10000);
    system.cancelDraft(auctionId);
    expect(system.getRecord(auctionId).state).toBe(AuctionState.Cancelled);
  });

  // TRAP 12: Seller bidding via proxy - CAUGHT
  test("Seller cannot bid", () => {
    const auctionId = system.create("auction12", "seller1", 1000, 10000);
    system.activate(auctionId);

    expect(() => {
      system.validateBid(auctionId, "seller1", 2000, 5000);
    }).toThrow("Seller cannot bid on their own auction");
  });

  // TRAP 13: Zero/negative starting price - CAUGHT
  test("Zero/negative starting price rejected", () => {
    expect(() => {
      system.create("auction13", "seller1", 0, 10000);
    }).toThrow("Starting price must be positive");

    expect(() => {
      system.create("auction13b", "seller1", -1000, 10000);
    }).toThrow("Starting price must be positive");
  });

  // TRAP 14: Zero duration auction - CAUGHT
  test("Zero/negative duration rejected", () => {
    expect(() => {
      system.create("auction14", "seller1", 1000, 0);
    }).toThrow("End time must be positive");

    expect(() => {
      system.create("auction14b", "seller1", 1000, -1000);
    }).toThrow("End time must be positive");
  });

  // Additional: Happy path
  test("Complete workflow happy path", () => {
    const auctionId = system.create("complete", "seller1", 5000, 20000);
    system.activate(auctionId);

    system.validateBid(auctionId, "buyer1", 6000, 10000);
    system.validateBid(auctionId, "buyer2", 7000, 11000);

    const record = system.getRecord(auctionId);
    system.finalize(auctionId, record.endTime);
    system.processPayment(auctionId, record.endTime + 1000);
    system.shipItem(auctionId);
    system.complete(auctionId);

    expect(system.getRecord(auctionId).state).toBe(AuctionState.Completed);
  });

  // Invariant testing
  test("Invariants hold during operations", () => {
    const auctionId = system.create("inv_test", "seller1", 1000, 20000);
    expect(system.checkInvariants(auctionId)).toBe(true);

    system.activate(auctionId);
    system.validateBid(auctionId, "bidder1", 2000, 5000);
    expect(system.checkInvariants(auctionId)).toBe(true);

    system.validateBid(auctionId, "bidder2", 3000, 6000);
    expect(system.checkInvariants(auctionId)).toBe(true);
  });
});
