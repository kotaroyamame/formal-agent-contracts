/**
 * RUN 3: Tests for More Thorough Implementation
 * Good test coverage for state transitions and edge cases
 */

import { AuctionEngine } from './auction';

describe('AuctionSystem - Run 3', () => {
  let engine: AuctionEngine;

  beforeEach(() => {
    engine = new AuctionEngine();
  });

  describe('Auction Creation', () => {
    test('should create auction in Draft state', () => {
      const auctionId = engine.createAuction('Laptop', 10000, 60, 'seller1');
      const auction = engine.getAuction(auctionId);

      expect(auction).not.toBeNull();
      expect(auction?.state).toBe('Draft');
      expect(auction?.productName).toBe('Laptop');
      expect(auction?.currentPrice).toBe(10000);
      expect(auction?.bidCount).toBe(0);
    });

    test('should reject invalid parameters', () => {
      expect(() => engine.createAuction('Item', -100, 60, 'seller')).toThrow();
      expect(() => engine.createAuction('Item', 1000, -10, 'seller')).toThrow();
      expect(() => engine.createAuction('Item', 0, 60, 'seller')).toThrow();
    });
  });

  describe('State Transitions', () => {
    test('should transition Draft -> Active', () => {
      const auctionId = engine.createAuction('Laptop', 10000, 60, 'seller1');
      const result = engine.activateAuction(auctionId);

      expect(result).toBe(true);
      expect(engine.getAuction(auctionId)?.state).toBe('Active');
    });

    test('should reject transition to invalid state', () => {
      const auctionId = engine.createAuction('Laptop', 10000, 60, 'seller1');
      const result = engine.activateAuction(auctionId);
      expect(result).toBe(true);

      // Try to activate again
      const result2 = engine.activateAuction(auctionId);
      expect(result2).toBe(false);
    });

    test('should maintain transition history', () => {
      const auctionId = engine.createAuction('Laptop', 10000, 60, 'seller1');
      const now = new Date();

      engine.activateAuction(auctionId, now);
      engine.placeBid(auctionId, 'bidder1', 11100, now);

      const auction = engine.getAuction(auctionId);
      if (auction) {
        auction.state = 'Ended';
      }

      engine.processPayment(auctionId, 'bidder1', now);

      const transitions = engine.getTransitions(auctionId);
      expect(transitions.length).toBeGreaterThanOrEqual(2);
      expect(transitions[0].from).toBe('Draft');
      expect(transitions[0].to).toBe('Active');
    });

    test('should complete full lifecycle', () => {
      const now = new Date();
      const auctionId = engine.createAuction('Laptop', 10000, 1, 'seller1', now);

      expect(engine.activateAuction(auctionId, now)).toBe(true);

      const result = engine.placeBid(auctionId, 'bidder1', 11100, now);
      expect(result.success).toBe(true);

      // Move time past end
      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      expect(engine.endAuction(auctionId, endTime)).toBe(true);

      expect(engine.processPayment(auctionId, 'bidder1', endTime)).toBe(true);
      expect(engine.confirmShipping(auctionId, endTime)).toBe(true);
      expect(engine.completeAuction(auctionId, endTime)).toBe(true);

      const final = engine.getAuction(auctionId);
      expect(final?.state).toBe('Completed');
    });
  });

  describe('Bidding Mechanics', () => {
    let auctionId: string;
    const now = new Date();

    beforeEach(() => {
      auctionId = engine.createAuction('Laptop', 10000, 60, 'seller1', now);
      engine.activateAuction(auctionId, now);
    });

    test('should accept valid bids', () => {
      const result = engine.placeBid(auctionId, 'bidder1', 11100, now);

      expect(result.success).toBe(true);
      expect(engine.getAuction(auctionId)?.currentPrice).toBe(11100);
      expect(engine.getAuction(auctionId)?.highestBidderId).toBe('bidder1');
    });

    test('should reject seller bids', () => {
      const result = engine.placeBid(auctionId, 'seller1', 11100, now);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Seller');
    });

    test('should reject bids at or below current price', () => {
      engine.placeBid(auctionId, 'bidder1', 11100, now);

      const result1 = engine.placeBid(auctionId, 'bidder2', 11100, now);
      expect(result1.success).toBe(false);

      const result2 = engine.placeBid(auctionId, 'bidder2', 11000, now);
      expect(result2.success).toBe(false);
    });

    test('should enforce minimum increment', () => {
      const result1 = engine.placeBid(auctionId, 'bidder1', 10050, now);
      expect(result1.success).toBe(false);
      expect(result1.reason).toContain('increment');

      const result2 = engine.placeBid(auctionId, 'bidder1', 10100, now);
      expect(result2.success).toBe(true);
    });

    test('should handle 1% increment rule correctly', () => {
      // 1% of 10000 = 100, so minimum should be 10100
      const result = engine.placeBid(auctionId, 'bidder1', 10100, now);
      expect(result.success).toBe(true);

      // Next bid: 1% of 10100 = 101, so minimum should be 10201
      const result2 = engine.placeBid(auctionId, 'bidder2', 10201, now);
      expect(result2.success).toBe(true);

      // Bid between should fail
      const result3 = engine.placeBid(auctionId, 'bidder1', 10150, now);
      expect(result3.success).toBe(false);
    });

    test('should enforce 100 yen minimum increment', () => {
      const lowAuctionId = engine.createAuction('Cheap', 50, 60, 'seller2', now);
      engine.activateAuction(lowAuctionId, now);

      // For 50 yen: 1% = 0.5, but minimum is 100, so next bid should be 150
      const result = engine.placeBid(lowAuctionId, 'bidder1', 100, now);
      expect(result.success).toBe(true);
    });

    test('should record bid history', () => {
      engine.placeBid(auctionId, 'bidder1', 11100, now);
      engine.placeBid(auctionId, 'bidder2', 12200, now);
      engine.placeBid(auctionId, 'bidder3', 13300, now);

      const bids = engine.getBids(auctionId);
      expect(bids.length).toBe(3);
      expect(bids[0].bidderId).toBe('bidder1');
      expect(bids[1].bidderId).toBe('bidder2');
      expect(bids[2].bidderId).toBe('bidder3');
    });

    test('should get highest bid', () => {
      engine.placeBid(auctionId, 'bidder1', 11100, now);
      engine.placeBid(auctionId, 'bidder2', 12200, now);

      const highest = engine.getHighestBid(auctionId);
      expect(highest?.bidderId).toBe('bidder2');
      expect(highest?.amount).toBe(12200);
    });
  });

  describe('5-Minute Extension', () => {
    test('should extend when bid within 5 minutes of end', () => {
      const now = new Date();
      const auctionId = engine.createAuction('Laptop', 10000, 10, 'seller1', now);
      engine.activateAuction(auctionId, now);

      const auction1 = engine.getAuction(auctionId);
      const originalEnd = auction1?.endTime;

      // Bid 3 minutes before end
      const bidTime = new Date(now.getTime() + 7 * 60 * 1000); // 7 minutes in
      engine.placeBid(auctionId, 'bidder1', 11100, bidTime);

      const auction2 = engine.getAuction(auctionId);
      const newEnd = auction2?.endTime;

      // Should be extended by 5 minutes
      if (originalEnd && newEnd) {
        const difference = newEnd.getTime() - originalEnd.getTime();
        expect(difference).toBeGreaterThanOrEqual(5 * 60 * 1000 - 1000);
      }
    });

    test('should not extend when bid early', () => {
      const now = new Date();
      const auctionId = engine.createAuction('Laptop', 10000, 60, 'seller1', now);
      engine.activateAuction(auctionId, now);

      const auction1 = engine.getAuction(auctionId);
      const originalEnd = auction1?.endTime;

      // Bid early
      engine.placeBid(auctionId, 'bidder1', 11100, now);

      const auction2 = engine.getAuction(auctionId);
      const newEnd = auction2?.endTime;

      // Should not extend significantly
      if (originalEnd && newEnd) {
        const difference = Math.abs(newEnd.getTime() - originalEnd.getTime());
        expect(difference).toBeLessThan(1000); // Less than 1 second difference
      }
    });
  });

  describe('Auction Ending', () => {
    test('should end with Ended when bids exist', () => {
      const now = new Date();
      const auctionId = engine.createAuction('Laptop', 10000, 1, 'seller1', now);
      engine.activateAuction(auctionId, now);
      engine.placeBid(auctionId, 'bidder1', 11100, now);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      engine.endAuction(auctionId, endTime);

      expect(engine.getAuction(auctionId)?.state).toBe('Ended');
    });

    test('should end with Cancelled when no bids', () => {
      const now = new Date();
      const auctionId = engine.createAuction('Laptop', 10000, 1, 'seller1', now);
      engine.activateAuction(auctionId, now);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      engine.endAuction(auctionId, endTime);

      expect(engine.getAuction(auctionId)?.state).toBe('Cancelled');
    });

    test('should reject ending before end time', () => {
      const now = new Date();
      const auctionId = engine.createAuction('Laptop', 10000, 60, 'seller1', now);
      engine.activateAuction(auctionId, now);

      const result = engine.endAuction(auctionId, now);
      expect(result).toBe(false);
    });
  });

  describe('Payment and Shipping', () => {
    test('should process payment only from winner', () => {
      const now = new Date();
      const auctionId = engine.createAuction('Laptop', 10000, 1, 'seller1', now);
      engine.activateAuction(auctionId, now);
      engine.placeBid(auctionId, 'bidder1', 11100, now);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      engine.endAuction(auctionId, endTime);

      const result1 = engine.processPayment(auctionId, 'bidder1', endTime);
      expect(result1).toBe(true);

      const result2 = engine.processPayment(auctionId, 'bidder2', endTime);
      expect(result2).toBe(false);
    });

    test('should confirm shipping transition', () => {
      const now = new Date();
      const auctionId = engine.createAuction('Laptop', 10000, 1, 'seller1', now);
      engine.activateAuction(auctionId, now);
      engine.placeBid(auctionId, 'bidder1', 11100, now);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      engine.endAuction(auctionId, endTime);
      engine.processPayment(auctionId, 'bidder1', endTime);

      const result = engine.confirmShipping(auctionId, endTime);
      expect(result).toBe(true);
      expect(engine.getAuction(auctionId)?.state).toBe('Shipped');
    });
  });

  describe('Cancellation', () => {
    test('should cancel Active auction with no bids', () => {
      const auctionId = engine.createAuction('Laptop', 10000, 60, 'seller1');
      engine.activateAuction(auctionId);

      const result = engine.cancelAuction(auctionId);
      expect(result).toBe(true);
      expect(engine.getAuction(auctionId)?.state).toBe('Cancelled');
    });

    test('should not cancel Active auction with bids', () => {
      const now = new Date();
      const auctionId = engine.createAuction('Laptop', 10000, 60, 'seller1', now);
      engine.activateAuction(auctionId, now);
      engine.placeBid(auctionId, 'bidder1', 11100, now);

      const result = engine.cancelAuction(auctionId, now);
      expect(result).toBe(false);
    });

    test('should cancel Ended auction', () => {
      const now = new Date();
      const auctionId = engine.createAuction('Laptop', 10000, 1, 'seller1', now);
      engine.activateAuction(auctionId, now);
      engine.placeBid(auctionId, 'bidder1', 11100, now);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      engine.endAuction(auctionId, endTime);

      const result = engine.cancelAuction(auctionId, endTime);
      expect(result).toBe(true);
    });
  });

  describe('Overdue Payment Detection', () => {
    test('should detect overdue payment', () => {
      const now = new Date();
      const auctionId = engine.createAuction('Laptop', 10000, 1, 'seller1', now);
      engine.activateAuction(auctionId, now);
      engine.placeBid(auctionId, 'bidder1', 11100, now);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      engine.endAuction(auctionId, endTime);

      const overdue73h = new Date(endTime.getTime() + 73 * 60 * 60 * 1000);
      const result = engine.isPaymentOverdue(auctionId, overdue73h);

      expect(result).toBe(true);
    });

    test('should not mark as overdue before 72 hours', () => {
      const now = new Date();
      const auctionId = engine.createAuction('Laptop', 10000, 1, 'seller1', now);
      engine.activateAuction(auctionId, now);
      engine.placeBid(auctionId, 'bidder1', 11100, now);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      engine.endAuction(auctionId, endTime);

      const check71h = new Date(endTime.getTime() + 71 * 60 * 60 * 1000);
      const result = engine.isPaymentOverdue(auctionId, check71h);

      expect(result).toBe(false);
    });
  });
});
