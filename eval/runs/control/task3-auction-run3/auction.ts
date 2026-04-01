/**
 * RUN 3: More Thorough Implementation
 * Implements 5-minute extension correctly for single case with strong test coverage
 */

export type AuctionStateType = 'Draft' | 'Active' | 'Ended' | 'Paid' | 'Shipped' | 'Completed' | 'Cancelled';

export interface BidRecord {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  placedAt: Date;
}

export interface AuctionRecord {
  id: string;
  productName: string;
  sellerId: string;
  startPrice: number;
  currentPrice: number;
  startTime: Date;
  endTime: Date;
  originalDurationMs: number;
  state: AuctionStateType;
  highestBidderId: string | null;
  bidCount: number;
  createdAt: Date;
}

export interface TransitionLog {
  from: AuctionStateType;
  to: AuctionStateType;
  timestamp: Date;
  reason?: string;
}

const VALID_TRANSITIONS: Record<AuctionStateType, AuctionStateType[]> = {
  Draft: ['Active', 'Cancelled'],
  Active: ['Ended', 'Cancelled'],
  Ended: ['Paid', 'Cancelled'],
  Paid: ['Shipped'],
  Shipped: ['Completed'],
  Completed: [],
  Cancelled: [],
};

export class AuctionEngine {
  private auctions: Map<string, AuctionRecord> = new Map();
  private bids: Map<string, BidRecord[]> = new Map();
  private transitions: Map<string, TransitionLog[]> = new Map();
  private auctionCounter = 0;
  private bidCounter = 0;

  /**
   * Create new auction in Draft state
   */
  createAuction(
    productName: string,
    startPrice: number,
    durationMinutes: number,
    sellerId: string,
    now: Date = new Date()
  ): string {
    if (startPrice <= 0 || durationMinutes <= 0) {
      throw new Error('Invalid parameters: startPrice and durationMinutes must be positive');
    }

    const auctionId = `auction_${++this.auctionCounter}`;
    const startTime = now;
    const durationMs = durationMinutes * 60 * 1000;
    const endTime = new Date(startTime.getTime() + durationMs);

    const record: AuctionRecord = {
      id: auctionId,
      productName,
      sellerId,
      startPrice,
      currentPrice: startPrice,
      startTime,
      endTime,
      originalDurationMs: durationMs,
      state: 'Draft',
      highestBidderId: null,
      bidCount: 0,
      createdAt: now,
    };

    this.auctions.set(auctionId, record);
    this.bids.set(auctionId, []);
    this.transitions.set(auctionId, []);

    return auctionId;
  }

  /**
   * Activate auction: Draft -> Active
   */
  activateAuction(auctionId: string, now: Date = new Date()): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    if (!this.canTransition(auction.state, 'Active')) {
      return false;
    }

    auction.state = 'Active';
    auction.startTime = now;
    auction.endTime = new Date(now.getTime() + auction.originalDurationMs);

    this.logTransition(auctionId, 'Draft', 'Active', now);
    return true;
  }

  /**
   * Place bid with comprehensive validation
   */
  placeBid(
    auctionId: string,
    bidderId: string,
    bidAmount: number,
    now: Date = new Date()
  ): { success: boolean; reason?: string } {
    const auction = this.auctions.get(auctionId);
    if (!auction) {
      return { success: false, reason: 'Auction not found' };
    }

    // State check
    if (auction.state !== 'Active') {
      return { success: false, reason: `Auction is not active (${auction.state})` };
    }

    // Seller check
    if (bidderId === auction.sellerId) {
      return { success: false, reason: 'Seller cannot bid on own auction' };
    }

    // Time check
    if (now > auction.endTime) {
      return { success: false, reason: 'Auction has ended' };
    }

    // Amount check: must exceed current price
    if (bidAmount <= auction.currentPrice) {
      return { success: false, reason: `Bid (${bidAmount}) must exceed current price (${auction.currentPrice})` };
    }

    // Minimum increment check (1% or 100 yen, whichever is greater)
    const minIncrement = Math.max(Math.floor(auction.currentPrice * 0.01), 100);
    const minimumBid = auction.currentPrice + minIncrement;

    if (bidAmount < minimumBid) {
      return { success: false, reason: `Bid must be at least ${minimumBid} (current: ${auction.currentPrice}, increment: ${minIncrement})` };
    }

    // Create bid record
    const bid: BidRecord = {
      id: `bid_${++this.bidCounter}`,
      auctionId,
      bidderId,
      amount: bidAmount,
      placedAt: now,
    };

    // Update auction
    const auctionBids = this.bids.get(auctionId) || [];
    auctionBids.push(bid);
    auction.bidCount = auctionBids.length;
    auction.currentPrice = bidAmount;
    auction.highestBidderId = bidderId;

    // Check for extension: if within 5 minutes of end time
    const timeUntilEnd = auction.endTime.getTime() - now.getTime();
    const fiveMinutesMs = 5 * 60 * 1000;

    if (timeUntilEnd > 0 && timeUntilEnd < fiveMinutesMs) {
      const newEndTime = new Date(now.getTime() + fiveMinutesMs);
      auction.endTime = newEndTime;
    }

    return { success: true };
  }

  /**
   * End auction: Active -> Ended or Cancelled
   */
  endAuction(auctionId: string, now: Date = new Date()): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    if (auction.state !== 'Active') return false;

    // Only allow ending if past end time
    if (now <= auction.endTime) return false;

    // Determine next state based on bids
    if (auction.bidCount === 0) {
      auction.state = 'Cancelled';
      this.logTransition(auctionId, 'Active', 'Cancelled', now, 'No bids received');
    } else {
      auction.state = 'Ended';
      this.logTransition(auctionId, 'Active', 'Ended', now);
    }

    return true;
  }

  /**
   * Process payment: Ended -> Paid
   */
  processPayment(auctionId: string, bidderId: string, now: Date = new Date()): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    if (auction.state !== 'Ended') return false;
    if (auction.highestBidderId !== bidderId) return false;

    auction.state = 'Paid';
    this.logTransition(auctionId, 'Ended', 'Paid', now);
    return true;
  }

  /**
   * Confirm shipping: Paid -> Shipped
   */
  confirmShipping(auctionId: string, now: Date = new Date()): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    if (auction.state !== 'Paid') return false;

    auction.state = 'Shipped';
    this.logTransition(auctionId, 'Paid', 'Shipped', now);
    return true;
  }

  /**
   * Complete auction: Shipped -> Completed
   */
  completeAuction(auctionId: string, now: Date = new Date()): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    if (auction.state !== 'Shipped') return false;

    auction.state = 'Completed';
    this.logTransition(auctionId, 'Shipped', 'Completed', now);
    return true;
  }

  /**
   * Cancel auction from Active (no bids) or Ended
   */
  cancelAuction(auctionId: string, now: Date = new Date()): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    if (auction.state === 'Active' && auction.bidCount === 0) {
      auction.state = 'Cancelled';
      this.logTransition(auctionId, 'Active', 'Cancelled', now, 'Manual cancellation, no bids');
      return true;
    }

    if (auction.state === 'Ended') {
      auction.state = 'Cancelled';
      this.logTransition(auctionId, 'Ended', 'Cancelled', now, 'Manual cancellation');
      return true;
    }

    return false;
  }

  /**
   * Check if transition is valid
   */
  private canTransition(from: AuctionStateType, to: AuctionStateType): boolean {
    const allowed = VALID_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  /**
   * Log state transition
   */
  private logTransition(auctionId: string, from: AuctionStateType, to: AuctionStateType, now: Date, reason?: string): void {
    const logs = this.transitions.get(auctionId) || [];
    logs.push({ from, to, timestamp: now, reason });
    this.transitions.set(auctionId, logs);
  }

  /**
   * Get auction by ID
   */
  getAuction(auctionId: string): AuctionRecord | null {
    const auction = this.auctions.get(auctionId);
    return auction ? { ...auction } : null;
  }

  /**
   * Get bids for auction
   */
  getBids(auctionId: string): BidRecord[] {
    const bids = this.bids.get(auctionId);
    return bids ? [...bids] : [];
  }

  /**
   * Get transition history
   */
  getTransitions(auctionId: string): TransitionLog[] {
    const logs = this.transitions.get(auctionId);
    return logs ? [...logs] : [];
  }

  /**
   * Check if payment is overdue
   */
  isPaymentOverdue(auctionId: string, now: Date = new Date()): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    if (auction.state !== 'Ended') return false;

    const seventyTwoHoursMs = 72 * 60 * 60 * 1000;
    return now.getTime() - auction.endTime.getTime() > seventyTwoHoursMs;
  }

  /**
   * Get highest bid
   */
  getHighestBid(auctionId: string): BidRecord | null {
    const bids = this.getBids(auctionId);
    if (bids.length === 0) return null;
    return bids[bids.length - 1];
  }
}
