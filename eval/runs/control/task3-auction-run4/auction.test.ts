/**
 * RUN 4: Minimal Tests
 * Fewest tests, covers basic functionality
 */

import { SimpleAuctionSystem } from './auction';

describe('AuctionSystem - Run 4', () => {
  let sys: SimpleAuctionSystem;

  beforeEach(() => {
    sys = new SimpleAuctionSystem();
  });

  test('should create and activate', () => {
    const id = sys.createAuction('Item', 100, 10, 'seller1');
    expect(sys.activate(id)).toBe(true);
    expect(sys.getAuction(id)?.state).toBe('Active');
  });

  test('should accept valid bid', () => {
    const id = sys.createAuction('Item', 100, 10, 'seller1');
    sys.activate(id);
    const result = sys.bid(id, 'buyer1', 110);
    expect(result.ok).toBe(true);
    expect(sys.getAuction(id)?.currentPrice).toBe(110);
  });

  test('should reject seller bid', () => {
    const id = sys.createAuction('Item', 100, 10, 'seller1');
    sys.activate(id);
    const result = sys.bid(id, 'seller1', 110);
    expect(result.ok).toBe(false);
  });

  test('should enforce minimum increment', () => {
    const id = sys.createAuction('Item', 100, 10, 'seller1');
    sys.activate(id);
    const result = sys.bid(id, 'buyer1', 101);
    expect(result.ok).toBe(false);
  });

  test('should transition to Ended', () => {
    const id = sys.createAuction('Item', 100, 1, 'seller1');
    sys.activate(id);
    sys.bid(id, 'buyer1', 110);

    // Wait for end time
    const auction = sys.getAuction(id);
    if (auction) {
      auction.endTime = new Date(Date.now() - 1000);
    }

    expect(sys.end(id)).toBe(true);
    expect(sys.getAuction(id)?.state).toBe('Ended');
  });

  test('should process full lifecycle', () => {
    const id = sys.createAuction('Item', 100, 1, 'seller1');
    sys.activate(id);
    sys.bid(id, 'buyer1', 150);

    const auction = sys.getAuction(id);
    if (auction) {
      auction.endTime = new Date(Date.now() - 1000);
    }

    sys.end(id);
    sys.pay(id, 'buyer1');
    sys.ship(id);
    sys.complete(id);

    expect(sys.getAuction(id)?.state).toBe('Completed');
  });
});
