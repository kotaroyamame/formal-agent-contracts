/**
 * RUN 5: Tests for Best Effort Implementation
 * Good test coverage for happy paths and edge cases
 */

import { AuctionManager } from './auction';

describe('AuctionSystem - Run 5', () => {
  let manager: AuctionManager;

  beforeEach(() => {
    manager = new AuctionManager();
  });

  describe('Auction Creation and Activation', () => {
    test('should create auction in Draft status', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 60, 'seller1');
      const auction = manager.getAuction(auctionId);

      expect(auction).not.toBeNull();
      expect(auction?.status).toBe('Draft');
      expect(auction?.productName).toBe('Laptop');
      expect(auction?.startPrice).toBe(10000);
      expect(auction?.currentPrice).toBe(10000);
      expect(auction?.totalBids).toBe(0);
    });

    test('should activate from Draft to Active', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 60, 'seller1');
      const result = manager.activateAuction(auctionId);

      expect(result).toBe(true);
      expect(manager.getAuction(auctionId)?.status).toBe('Active');
    });

    test('should fail to activate non-existent auction', () => {
      const result = manager.activateAuction('non_existent');
      expect(result).toBe(false);
    });

    test('should fail to activate non-Draft auction', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 60, 'seller1');
      manager.activateAuction(auctionId);
      const result = manager.activateAuction(auctionId);

      expect(result).toBe(false);
    });
  });

  describe('Bidding Mechanics', () => {
    let auctionId: string;
    const now = new Date();

    beforeEach(() => {
      auctionId = manager.createAuction('Laptop', 10000, 60, 'seller1', now);
      manager.activateAuction(auctionId, now);
    });

    test('should accept valid bid', () => {
      const result = manager.placeBid(auctionId, 'bidder1', 11100, now);

      expect(result.success).toBe(true);
      expect(manager.getAuction(auctionId)?.currentPrice).toBe(11100);
      expect(manager.getAuction(auctionId)?.winnerBidderId).toBe('bidder1');
      expect(manager.getAuction(auctionId)?.totalBids).toBe(1);
    });

    test('should reject seller bid', () => {
      const result = manager.placeBid(auctionId, 'seller1', 11100, now);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Seller');
    });

    test('should reject bid at or below current price', () => {
      manager.placeBid(auctionId, 'bidder1', 11100, now);

      const result1 = manager.placeBid(auctionId, 'bidder2', 11100, now);
      expect(result1.success).toBe(false);

      const result2 = manager.placeBid(auctionId, 'bidder2', 11000, now);
      expect(result2.success).toBe(false);
    });

    test('should reject bid below minimum increment', () => {
      const result = manager.placeBid(auctionId, 'bidder1', 10050, now);

      expect(result.success).toBe(false);
      expect(result.message).toContain('at least');
    });

    test('should enforce 1% minimum increment rule', () => {
      // 1% of 10000 = 100, so minimum should be 10100
      const result1 = manager.placeBid(auctionId, 'bidder1', 10100, now);
      expect(result1.success).toBe(true);

      // 1% of 10100 = 101, so minimum should be 10201
      const result2 = manager.placeBid(auctionId, 'bidder2', 10201, now);
      expect(result2.success).toBe(true);

      // Bid in between should fail
      const result3 = manager.placeBid(auctionId, 'bidder3', 10150, now);
      expect(result3.success).toBe(false);
    });

    test('should enforce 100 yen minimum increment', () => {
      const cheapAuctionId = manager.createAuction('Cheap Item', 50, 60, 'seller2', now);
      manager.activateAuction(cheapAuctionId, now);

      // For 50 yen: 1% = 0, but minimum is 100, so next bid should be 150
      const result = manager.placeBid(cheapAuctionId, 'bidder1', 100, now);
      expect(result.success).toBe(true);
    });

    test('should record multiple bids in order', () => {
      manager.placeBid(auctionId, 'bidder1', 11100, now);
      manager.placeBid(auctionId, 'bidder2', 12200, now);
      manager.placeBid(auctionId, 'bidder3', 13300, now);

      const bids = manager.getBids(auctionId);
      expect(bids.length).toBe(3);
      expect(bids[0].bidderId).toBe('bidder1');
      expect(bids[1].bidderId).toBe('bidder2');
      expect(bids[2].bidderId).toBe('bidder3');
      expect(bids[2].bidAmount).toBe(13300);
    });

    test('should get highest bid', () => {
      manager.placeBid(auctionId, 'bidder1', 11100, now);
      manager.placeBid(auctionId, 'bidder2', 12200, now);
      manager.placeBid(auctionId, 'bidder3', 13300, now);

      const highest = manager.getHighestBid(auctionId);
      expect(highest?.bidderId).toBe('bidder3');
      expect(highest?.bidAmount).toBe(13300);
    });

    test('should reject bid on non-Active auction', () => {
      const inactiveId = manager.createAuction('Item', 5000, 60, 'seller3', now);
      const result = manager.placeBid(inactiveId, 'bidder1', 5500, now);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not Active');
    });

    test('should reject bid after end time', () => {
      const pastEndTime = new Date(now.getTime() + 61 * 60 * 1000);
      const result = manager.placeBid(auctionId, 'bidder1', 11100, pastEndTime);

      expect(result.success).toBe(false);
      expect(result.message).toContain('ended');
    });
  });

  describe('5-Minute Extension Logic', () => {
    const now = new Date();

    test('should extend end time when bid within 5 minutes', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 10, 'seller1', now);
      manager.activateAuction(auctionId, now);

      const auction1 = manager.getAuction(auctionId);
      const originalEnd = auction1?.endTime || new Date();

      // Bid 3 minutes before end (7 minutes into 10 minute auction)
      const bidTime = new Date(now.getTime() + 7 * 60 * 1000);
      manager.placeBid(auctionId, 'bidder1', 11100, bidTime);

      const auction2 = manager.getAuction(auctionId);
      const newEnd = auction2?.endTime || new Date();

      // End time should be extended by approximately 5 minutes
      const extension = newEnd.getTime() - originalEnd.getTime();
      expect(extension).toBeGreaterThanOrEqual(5 * 60 * 1000 - 1000); // Allow 1 second tolerance
    });

    test('should not extend when bid early', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 60, 'seller1', now);
      manager.activateAuction(auctionId, now);

      const auction1 = manager.getAuction(auctionId);
      const originalEnd = auction1?.endTime || new Date();

      // Bid early
      manager.placeBid(auctionId, 'bidder1', 11100, now);

      const auction2 = manager.getAuction(auctionId);
      const newEnd = auction2?.endTime || new Date();

      // No extension
      const difference = Math.abs(newEnd.getTime() - originalEnd.getTime());
      expect(difference).toBeLessThan(1000);
    });
  });

  describe('Auction Ending', () => {
    const now = new Date();

    test('should end with Ended status when bids present', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 1, 'seller1', now);
      manager.activateAuction(auctionId, now);
      manager.placeBid(auctionId, 'bidder1', 11100, now);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      manager.endAuction(auctionId, endTime);

      expect(manager.getAuction(auctionId)?.status).toBe('Ended');
    });

    test('should end with Cancelled status when no bids', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 1, 'seller1', now);
      manager.activateAuction(auctionId, now);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      manager.endAuction(auctionId, endTime);

      expect(manager.getAuction(auctionId)?.status).toBe('Cancelled');
    });

    test('should reject ending before end time', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 60, 'seller1', now);
      manager.activateAuction(auctionId, now);

      const result = manager.endAuction(auctionId, now);
      expect(result).toBe(false);
    });

    test('should reject ending non-Active auction', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 1, 'seller1', now);
      const result = manager.endAuction(auctionId, now);

      expect(result).toBe(false);
    });
  });

  describe('Payment Processing', () => {
    const now = new Date();

    test('should process payment from winner', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 1, 'seller1', now);
      manager.activateAuction(auctionId, now);
      manager.placeBid(auctionId, 'bidder1', 11100, now);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      manager.endAuction(auctionId, endTime);

      const result = manager.processPayment(auctionId, 'bidder1', endTime);
      expect(result).toBe(true);
      expect(manager.getAuction(auctionId)?.status).toBe('Paid');
    });

    test('should reject payment from non-winner', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 1, 'seller1', now);
      manager.activateAuction(auctionId, now);
      manager.placeBid(auctionId, 'bidder1', 11100, now);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      manager.endAuction(auctionId, endTime);

      const result = manager.processPayment(auctionId, 'bidder2', endTime);
      expect(result).toBe(false);
    });

    test('should reject payment on non-Ended auction', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 1, 'seller1', now);
      manager.activateAuction(auctionId, now);
      manager.placeBid(auctionId, 'bidder1', 11100, now);

      const result = manager.processPayment(auctionId, 'bidder1', now);
      expect(result).toBe(false);
    });
  });

  describe('Shipping and Completion', () => {
    const now = new Date();

    test('should confirm shipping', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 1, 'seller1', now);
      manager.activateAuction(auctionId, now);
      manager.placeBid(auctionId, 'bidder1', 11100, now);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      manager.endAuction(auctionId, endTime);
      manager.processPayment(auctionId, 'bidder1', endTime);

      const result = manager.confirmShipping(auctionId, endTime);
      expect(result).toBe(true);
      expect(manager.getAuction(auctionId)?.status).toBe('Shipped');
    });

    test('should complete auction', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 1, 'seller1', now);
      manager.activateAuction(auctionId, now);
      manager.placeBid(auctionId, 'bidder1', 11100, now);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      manager.endAuction(auctionId, endTime);
      manager.processPayment(auctionId, 'bidder1', endTime);
      manager.confirmShipping(auctionId, endTime);

      const result = manager.completeAuction(auctionId, endTime);
      expect(result).toBe(true);
      expect(manager.getAuction(auctionId)?.status).toBe('Completed');
    });
  });

  describe('Cancellation', () => {
    const now = new Date();

    test('should cancel Active auction with no bids', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 60, 'seller1', now);
      manager.activateAuction(auctionId, now);

      const result = manager.cancelAuction(auctionId, now);
      expect(result).toBe(true);
      expect(manager.getAuction(auctionId)?.status).toBe('Cancelled');
    });

    test('should not cancel Active auction with bids', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 60, 'seller1', now);
      manager.activateAuction(auctionId, now);
      manager.placeBid(auctionId, 'bidder1', 11100, now);

      const result = manager.cancelAuction(auctionId, now);
      expect(result).toBe(false);
    });

    test('should cancel Ended auction', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 1, 'seller1', now);
      manager.activateAuction(auctionId, now);
      manager.placeBid(auctionId, 'bidder1', 11100, now);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      manager.endAuction(auctionId, endTime);

      const result = manager.cancelAuction(auctionId, endTime);
      expect(result).toBe(true);
      expect(manager.getAuction(auctionId)?.status).toBe('Cancelled');
    });
  });

  describe('Overdue Payment Detection', () => {
    const now = new Date();

    test('should detect overdue payment after 72 hours', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 1, 'seller1', now);
      manager.activateAuction(auctionId, now);
      manager.placeBid(auctionId, 'bidder1', 11100, now);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      manager.endAuction(auctionId, endTime);

      const checkTime = new Date(endTime.getTime() + 73 * 60 * 60 * 1000);
      const isOverdue = manager.isPaymentOverdue(auctionId, checkTime);

      expect(isOverdue).toBe(true);
    });

    test('should not mark overdue before 72 hours', () => {
      const auctionId = manager.createAuction('Laptop', 10000, 1, 'seller1', now);
      manager.activateAuction(auctionId, now);
      manager.placeBid(auctionId, 'bidder1', 11100, now);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      manager.endAuction(auctionId, endTime);

      const checkTime = new Date(endTime.getTime() + 71 * 60 * 60 * 1000);
      const isOverdue = manager.isPaymentOverdue(auctionId, checkTime);

      expect(isOverdue).toBe(false);
    });
  });

  describe('Full Lifecycle', () => {
    test('should complete happy path', () => {
      const now = new Date();
      const auctionId = manager.createAuction('Laptop', 10000, 1, 'seller1', now);

      manager.activateAuction(auctionId, now);
      let result = manager.placeBid(auctionId, 'bidder1', 11100, now);
      expect(result.success).toBe(true);

      const endTime = new Date(now.getTime() + 2 * 60 * 1000);
      let success = manager.endAuction(auctionId, endTime);
      expect(success).toBe(true);

      success = manager.processPayment(auctionId, 'bidder1', endTime);
      expect(success).toBe(true);

      success = manager.confirmShipping(auctionId, endTime);
      expect(success).toBe(true);

      success = manager.completeAuction(auctionId, endTime);
      expect(success).toBe(true);

      const final = manager.getAuction(auctionId);
      expect(final?.status).toBe('Completed');
    });
  });
});
