/**
 * RUN 1: Tests for Standard State Machine Implementation
 */

import { AuctionSystem } from './auction';

describe('AuctionSystem - Run 1', () => {
  let system: AuctionSystem;

  beforeEach(() => {
    system = new AuctionSystem();
  });

  describe('Auction Creation and Activation', () => {
    test('should create auction in Draft state', () => {
      const auctionId = system.createAuction('Laptop', 10000, 60, 'seller1');
      const auction = system.getAuction(auctionId);

      expect(auction).not.toBeNull();
      expect(auction?.state).toBe('Draft');
      expect(auction?.productName).toBe('Laptop');
      expect(auction?.startPrice).toBe(10000);
      expect(auction?.currentPrice).toBe(10000);
    });

    test('should activate auction from Draft to Active', () => {
      const auctionId = system.createAuction('Laptop', 10000, 60, 'seller1');
      const result = system.activateAuction(auctionId);

      expect(result).toBe(true);
      expect(system.getAuction(auctionId)?.state).toBe('Active');
    });

    test('should fail to activate non-existent auction', () => {
      const result = system.activateAuction('non_existent');
      expect(result).toBe(false);
    });

    test('should fail to activate already active auction', () => {
      const auctionId = system.createAuction('Laptop', 10000, 60, 'seller1');
      system.activateAuction(auctionId);
      const result = system.activateAuction(auctionId);

      expect(result).toBe(false);
    });
  });

  describe('Bidding Validation', () => {
    let auctionId: string;

    beforeEach(() => {
      auctionId = system.createAuction('Laptop', 10000, 60, 'seller1');
      system.activateAuction(auctionId);
    });

    test('should allow valid bid', () => {
      const result = system.placeBid(auctionId, 'bidder1', 11100); // 1% of 10000 = 100, so min is 10100, bidding 11100

      expect(result.success).toBe(true);
      expect(system.getAuction(auctionId)?.currentPrice).toBe(11100);
      expect(system.getAuction(auctionId)?.highestBidderId).toBe('bidder1');
    });

    test('should reject seller bidding on own auction', () => {
      const result = system.placeBid(auctionId, 'seller1', 11100);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Seller cannot bid');
    });

    test('should reject bid lower than current price', () => {
      system.placeBid(auctionId, 'bidder1', 11100);
      const result = system.placeBid(auctionId, 'bidder2', 11000);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('must be higher');
    });

    test('should reject bid below minimum increment (1%)', () => {
      const result = system.placeBid(auctionId, 'bidder1', 10050); // Less than 1% increment

      expect(result.success).toBe(false);
      expect(result.reason).toContain('must be at least');
    });

    test('should enforce minimum bid of 100 yen', () => {
      const lowStartAuctionId = system.createAuction('Cheap Item', 50, 60, 'seller2');
      system.activateAuction(lowStartAuctionId);

      const result = system.placeBid(lowStartAuctionId, 'bidder1', 100); // Min increment at 1% would be 0.5, but floor is 100

      expect(result.success).toBe(true);
    });

    test('should reject bid on inactive auction', () => {
      const result = system.placeBid(auctionId, 'bidder1', 11100);
      expect(result.success).toBe(true);

      // Move to Ended state
      const auction = system.getAuction(auctionId);
      if (auction) {
        auction.state = 'Ended';
      }

      const result2 = system.placeBid(auctionId, 'bidder2', 12100);
      expect(result2.success).toBe(false);
      expect(result2.reason).toContain('not active');
    });

    test('should record multiple bids', () => {
      system.placeBid(auctionId, 'bidder1', 11100);
      system.placeBid(auctionId, 'bidder2', 12200);
      system.placeBid(auctionId, 'bidder1', 13300);

      const bids = system.getBids(auctionId);
      expect(bids.length).toBe(3);
      expect(bids[2].bidderId).toBe('bidder1');
      expect(bids[2].amount).toBe(13300);
    });
  });

  describe('5-Minute Extension Rule', () => {
    test('should extend auction end time when bid within 5 minutes', () => {
      const auctionId = system.createAuction('Laptop', 10000, 1, 'seller1'); // 1 minute duration
      system.activateAuction(auctionId);

      const auctionBefore = system.getAuction(auctionId);
      const endTimeBefore = auctionBefore?.endTime || new Date();

      // Simulate bid within 5 minutes of end
      system.placeBid(auctionId, 'bidder1', 11100);

      const auctionAfter = system.getAuction(auctionId);
      const endTimeAfter = auctionAfter?.endTime || new Date();

      // End time should be extended by 5 minutes
      const fiveMinutes = 5 * 60 * 1000;
      const difference = endTimeAfter.getTime() - endTimeBefore.getTime();
      expect(difference).toBeGreaterThanOrEqual(fiveMinutes - 1000); // Allow 1 second tolerance
    });
  });

  describe('State Transitions', () => {
    test('should transition Draft -> Active -> Ended -> Paid -> Shipped -> Completed', () => {
      const auctionId = system.createAuction('Laptop', 10000, 1, 'seller1');
      let auction = system.getAuction(auctionId);
      expect(auction?.state).toBe('Draft');

      system.activateAuction(auctionId);
      auction = system.getAuction(auctionId);
      expect(auction?.state).toBe('Active');

      system.placeBid(auctionId, 'bidder1', 11100);
      system.endAuction(auctionId);
      auction = system.getAuction(auctionId);
      expect(auction?.state).toBe('Ended');

      system.processPayment(auctionId, 'bidder1');
      auction = system.getAuction(auctionId);
      expect(auction?.state).toBe('Paid');

      system.confirmShipping(auctionId);
      auction = system.getAuction(auctionId);
      expect(auction?.state).toBe('Shipped');

      system.completeAuction(auctionId);
      auction = system.getAuction(auctionId);
      expect(auction?.state).toBe('Completed');
    });

    test('should cancel auction with no bids', () => {
      const auctionId = system.createAuction('Laptop', 10000, 1, 'seller1');
      system.activateAuction(auctionId);

      // Don't place any bids, end auction
      system.endAuction(auctionId);
      const auction = system.getAuction(auctionId);

      expect(auction?.state).toBe('Cancelled');
    });
  });

  describe('Payment Processing', () => {
    test('should process payment from Ended to Paid', () => {
      const auctionId = system.createAuction('Laptop', 10000, 1, 'seller1');
      system.activateAuction(auctionId);
      system.placeBid(auctionId, 'bidder1', 11100);
      system.endAuction(auctionId);

      const result = system.processPayment(auctionId, 'bidder1');
      expect(result).toBe(true);
      expect(system.getAuction(auctionId)?.state).toBe('Paid');
    });

    test('should reject payment from non-winner', () => {
      const auctionId = system.createAuction('Laptop', 10000, 1, 'seller1');
      system.activateAuction(auctionId);
      system.placeBid(auctionId, 'bidder1', 11100);
      system.endAuction(auctionId);

      const result = system.processPayment(auctionId, 'bidder2');
      expect(result).toBe(false);
    });

    test('should reject payment on non-Ended auction', () => {
      const auctionId = system.createAuction('Laptop', 10000, 1, 'seller1');
      system.activateAuction(auctionId);
      system.placeBid(auctionId, 'bidder1', 11100);

      const result = system.processPayment(auctionId, 'bidder1');
      expect(result).toBe(false);
    });
  });

  describe('Shipping and Completion', () => {
    test('should confirm shipping from Paid to Shipped', () => {
      const auctionId = system.createAuction('Laptop', 10000, 1, 'seller1');
      system.activateAuction(auctionId);
      system.placeBid(auctionId, 'bidder1', 11100);
      system.endAuction(auctionId);
      system.processPayment(auctionId, 'bidder1');

      const result = system.confirmShipping(auctionId);
      expect(result).toBe(true);
      expect(system.getAuction(auctionId)?.state).toBe('Shipped');
    });

    test('should complete auction from Shipped', () => {
      const auctionId = system.createAuction('Laptop', 10000, 1, 'seller1');
      system.activateAuction(auctionId);
      system.placeBid(auctionId, 'bidder1', 11100);
      system.endAuction(auctionId);
      system.processPayment(auctionId, 'bidder1');
      system.confirmShipping(auctionId);

      const result = system.completeAuction(auctionId);
      expect(result).toBe(true);
      expect(system.getAuction(auctionId)?.state).toBe('Completed');
    });
  });

  describe('Overdue Payment Detection', () => {
    test('should detect overdue payment after 72 hours', () => {
      const auctionId = system.createAuction('Laptop', 10000, 1, 'seller1');
      system.activateAuction(auctionId);
      system.placeBid(auctionId, 'bidder1', 11100);

      const auction = system.getAuction(auctionId);
      if (auction) {
        auction.state = 'Ended';
        auction.endTime = new Date(Date.now() - 73 * 60 * 60 * 1000); // 73 hours ago
      }

      const isOverdue = system.isPaymentOverdue(auctionId);
      expect(isOverdue).toBe(true);
    });
  });
});
