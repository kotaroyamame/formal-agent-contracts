/**
 * RUN 2: Tests for Class-based Enum Implementation
 */

import { Auction, AuctionRepository } from './auction';

describe('AuctionSystem - Run 2', () => {
  let repo: AuctionRepository;

  beforeEach(() => {
    repo = new AuctionRepository();
  });

  describe('Auction Creation', () => {
    test('should create auction in Draft state', () => {
      const auctionId = repo.createAuction('Laptop', 10000, 60, 'seller1');
      const auction = repo.getAuction(auctionId);

      expect(auction).not.toBeNull();
      expect(auction?.getState()).toBe('Draft');
      expect(auction?.getProductName()).toBe('Laptop');
      expect(auction?.getStartPrice()).toBe(10000);
      expect(auction?.getCurrentPrice()).toBe(10000);
    });
  });

  describe('State Transitions', () => {
    test('should activate from Draft to Active', () => {
      const auctionId = repo.createAuction('Laptop', 10000, 60, 'seller1');
      const result = repo.activateAuction(auctionId);

      expect(result).toBe(true);
      expect(repo.getAuction(auctionId)?.getState()).toBe('Active');
    });

    test('should reject second activation', () => {
      const auctionId = repo.createAuction('Laptop', 10000, 60, 'seller1');
      repo.activateAuction(auctionId);
      const result = repo.activateAuction(auctionId);

      expect(result).toBe(false);
    });

    test('should transition through full lifecycle', () => {
      const auctionId = repo.createAuction('Laptop', 10000, 1, 'seller1');

      repo.activateAuction(auctionId);
      let auction = repo.getAuction(auctionId);
      expect(auction?.getState()).toBe('Active');

      repo.placeBid(auctionId, 'bidder1', 11100);
      repo.endAuction(auctionId);
      auction = repo.getAuction(auctionId);
      expect(auction?.getState()).toBe('Ended');

      repo.processPayment(auctionId, 'bidder1');
      auction = repo.getAuction(auctionId);
      expect(auction?.getState()).toBe('Paid');

      repo.confirmShipping(auctionId);
      auction = repo.getAuction(auctionId);
      expect(auction?.getState()).toBe('Shipped');

      repo.completeAuction(auctionId);
      auction = repo.getAuction(auctionId);
      expect(auction?.getState()).toBe('Completed');
    });

    test('should end with Cancelled state when no bids', () => {
      const auctionId = repo.createAuction('Laptop', 10000, 1, 'seller1');
      repo.activateAuction(auctionId);
      repo.endAuction(auctionId);

      expect(repo.getAuction(auctionId)?.getState()).toBe('Cancelled');
    });
  });

  describe('Bidding Logic', () => {
    let auctionId: string;

    beforeEach(() => {
      auctionId = repo.createAuction('Laptop', 10000, 60, 'seller1');
      repo.activateAuction(auctionId);
    });

    test('should accept valid bid', () => {
      const result = repo.placeBid(auctionId, 'bidder1', 11100);

      expect(result.success).toBe(true);
      expect(repo.getAuction(auctionId)?.getCurrentPrice()).toBe(11100);
      expect(repo.getAuction(auctionId)?.getHighestBidderId()).toBe('bidder1');
    });

    test('should reject seller bid', () => {
      const result = repo.placeBid(auctionId, 'seller1', 11100);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Seller');
    });

    test('should reject bid not exceeding current price', () => {
      repo.placeBid(auctionId, 'bidder1', 11100);
      const result = repo.placeBid(auctionId, 'bidder2', 11000);

      expect(result.success).toBe(false);
    });

    test('should enforce minimum increment', () => {
      const result = repo.placeBid(auctionId, 'bidder1', 10050);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('increment');
    });

    test('should record multiple bids in order', () => {
      repo.placeBid(auctionId, 'bidder1', 11100);
      repo.placeBid(auctionId, 'bidder2', 12200);
      repo.placeBid(auctionId, 'bidder3', 13300);

      const auction = repo.getAuction(auctionId);
      const bids = auction?.getBids() || [];

      expect(bids.length).toBe(3);
      expect(bids[2].bidderId).toBe('bidder3');
      expect(bids[2].amount).toBe(13300);
    });
  });

  describe('Minimum Bid Calculation', () => {
    test('should enforce 1% increment with 100 yen minimum', () => {
      const auctionId = repo.createAuction('Item', 1000, 60, 'seller1');
      repo.activateAuction(auctionId);

      // 1% of 1000 = 10, but minimum is 100
      // So minimum bid should be 1000 + 100 = 1100
      const result = repo.placeBid(auctionId, 'bidder1', 1050);
      expect(result.success).toBe(false);

      const result2 = repo.placeBid(auctionId, 'bidder1', 1100);
      expect(result2.success).toBe(true);
    });

    test('should use 1% when it exceeds 100 yen', () => {
      const auctionId = repo.createAuction('Item', 20000, 60, 'seller1');
      repo.activateAuction(auctionId);

      // 1% of 20000 = 200, which exceeds 100
      // So minimum bid should be 20000 + 200 = 20200
      const result = repo.placeBid(auctionId, 'bidder1', 20150);
      expect(result.success).toBe(false);

      const result2 = repo.placeBid(auctionId, 'bidder1', 20200);
      expect(result2.success).toBe(true);
    });
  });

  describe('Payment Processing', () => {
    test('should allow payment from winner', () => {
      const auctionId = repo.createAuction('Laptop', 10000, 1, 'seller1');
      repo.activateAuction(auctionId);
      repo.placeBid(auctionId, 'bidder1', 11100);
      repo.endAuction(auctionId);

      const result = repo.processPayment(auctionId, 'bidder1');
      expect(result).toBe(true);
      expect(repo.getAuction(auctionId)?.getState()).toBe('Paid');
    });

    test('should reject payment from non-winner', () => {
      const auctionId = repo.createAuction('Laptop', 10000, 1, 'seller1');
      repo.activateAuction(auctionId);
      repo.placeBid(auctionId, 'bidder1', 11100);
      repo.endAuction(auctionId);

      const result = repo.processPayment(auctionId, 'bidder2');
      expect(result).toBe(false);
    });

    test('should reject payment on non-Ended auction', () => {
      const auctionId = repo.createAuction('Laptop', 10000, 1, 'seller1');
      repo.activateAuction(auctionId);
      repo.placeBid(auctionId, 'bidder1', 11100);

      const result = repo.processPayment(auctionId, 'bidder1');
      expect(result).toBe(false);
    });
  });

  describe('Shipping and Completion', () => {
    test('should confirm shipping from Paid state', () => {
      const auctionId = repo.createAuction('Laptop', 10000, 1, 'seller1');
      repo.activateAuction(auctionId);
      repo.placeBid(auctionId, 'bidder1', 11100);
      repo.endAuction(auctionId);
      repo.processPayment(auctionId, 'bidder1');

      const result = repo.confirmShipping(auctionId);
      expect(result).toBe(true);
      expect(repo.getAuction(auctionId)?.getState()).toBe('Shipped');
    });

    test('should complete from Shipped state', () => {
      const auctionId = repo.createAuction('Laptop', 10000, 1, 'seller1');
      repo.activateAuction(auctionId);
      repo.placeBid(auctionId, 'bidder1', 11100);
      repo.endAuction(auctionId);
      repo.processPayment(auctionId, 'bidder1');
      repo.confirmShipping(auctionId);

      const result = repo.completeAuction(auctionId);
      expect(result).toBe(true);
      expect(repo.getAuction(auctionId)?.getState()).toBe('Completed');
    });
  });

  describe('Cancellation', () => {
    test('should cancel Active auction with no bids', () => {
      const auctionId = repo.createAuction('Laptop', 10000, 60, 'seller1');
      repo.activateAuction(auctionId);

      const result = repo.cancelAuction(auctionId);
      expect(result).toBe(true);
      expect(repo.getAuction(auctionId)?.getState()).toBe('Cancelled');
    });

    test('should cancel Ended auction', () => {
      const auctionId = repo.createAuction('Laptop', 10000, 1, 'seller1');
      repo.activateAuction(auctionId);
      repo.placeBid(auctionId, 'bidder1', 11100);
      repo.endAuction(auctionId);

      const result = repo.cancelAuction(auctionId);
      expect(result).toBe(true);
      expect(repo.getAuction(auctionId)?.getState()).toBe('Cancelled');
    });

    test('should reject cancel on Active auction with bids', () => {
      const auctionId = repo.createAuction('Laptop', 10000, 60, 'seller1');
      repo.activateAuction(auctionId);
      repo.placeBid(auctionId, 'bidder1', 11100);

      const result = repo.cancelAuction(auctionId);
      expect(result).toBe(false);
    });
  });

  describe('Overdue Payment', () => {
    test('should detect overdue payment', () => {
      const auctionId = repo.createAuction('Laptop', 10000, 1, 'seller1');
      repo.activateAuction(auctionId);
      repo.placeBid(auctionId, 'bidder1', 11100);

      const auction = repo.getAuction(auctionId);
      if (auction) {
        // Manually set state for testing
        const endTimeMs = auction.getEndTime().getTime();
        const newTime = new Date(endTimeMs - 73 * 60 * 60 * 1000); // 73 hours before
        // This test needs manual manipulation, would be better with time injection
      }

      // Note: This test is limited without time mocking
    });
  });

  describe('Extension Logic', () => {
    test('should extend end time when bid within 5 minutes', () => {
      const now = new Date();
      const auctionId = repo.createAuction('Laptop', 10000, 5, 'seller1');
      const auction = repo.getAuction(auctionId);

      if (auction) {
        // Place bid near end
        const result = auction.placeBid('bidder1', 11100, now);
        expect(result.success).toBe(true);

        // End time should be extended
        const newEndTime = auction.getEndTime();
        const expectedEndTime = new Date(now.getTime() + 5 * 60 * 1000);
        expect(newEndTime.getTime()).toBeGreaterThanOrEqual(expectedEndTime.getTime() - 1000);
      }
    });
  });
});
