/**
 * RUN 5: Best Effort Implementation
 * Implements min increment calculation with 1% rule, good test coverage
 */

export type AuctionStatus = 'Draft' | 'Active' | 'Ended' | 'Paid' | 'Shipped' | 'Completed' | 'Cancelled';

export interface AuctionData {
  id: string;
  productName: string;
  sellerId: string;
  startPrice: number;
  currentPrice: number;
  startTime: Date;
  endTime: Date;
  status: AuctionStatus;
  winnerBidderId: string | null;
  totalBids: number;
}

export interface BidInfo {
  bidId: string;
  auctionId: string;
  bidderId: string;
  bidAmount: number;
  bidTime: Date;
}

export class AuctionManager {
  private auctionRegistry: Map<string, AuctionData> = new Map();
  private bidRegistry: Map<string, BidInfo[]> = new Map();
  private auctionIdSeq = 0;
  private bidIdSeq = 0;

  /**
   * Create a new auction
   */
  createAuction(
    productName: string,
    startPrice: number,
    durationMinutes: number,
    sellerId: string,
    now: Date = new Date()
  ): string {
    const auctionId = `auction_${++this.auctionIdSeq}`;
    const startTime = new Date(now);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const data: AuctionData = {
      id: auctionId,
      productName,
      sellerId,
      startPrice,
      currentPrice: startPrice,
      startTime,
      endTime,
      status: 'Draft',
      winnerBidderId: null,
      totalBids: 0,
    };

    this.auctionRegistry.set(auctionId, data);
    this.bidRegistry.set(auctionId, []);

    return auctionId;
  }

  /**
   * Activate auction from Draft to Active
   */
  activateAuction(auctionId: string, now: Date = new Date()): boolean {
    const auction = this.auctionRegistry.get(auctionId);
    if (!auction) return false;
    if (auction.status !== 'Draft') return false;

    auction.status = 'Active';
    auction.startTime = new Date(now);
    return true;
  }

  /**
   * Place a bid with validation
   */
  placeBid(
    auctionId: string,
    bidderId: string,
    bidAmount: number,
    now: Date = new Date()
  ): { success: boolean; message?: string } {
    const auction = this.auctionRegistry.get(auctionId);
    if (!auction) {
      return { success: false, message: 'Auction not found' };
    }

    // Check status
    if (auction.status !== 'Active') {
      return { success: false, message: `Auction status is ${auction.status}, not Active` };
    }

    // Seller cannot bid
    if (bidderId === auction.sellerId) {
      return { success: false, message: 'Seller cannot place bids on own auction' };
    }

    // Check auction period
    if (now.getTime() > auction.endTime.getTime()) {
      return { success: false, message: 'Auction period has ended' };
    }

    // Bid must exceed current price
    if (bidAmount <= auction.currentPrice) {
      return { success: false, message: `Bid amount (${bidAmount}) must exceed current price (${auction.currentPrice})` };
    }

    // Check minimum increment
    const minimumIncrementYen = this.calculateMinimumIncrement(auction.currentPrice);
    const minimumBidAmount = auction.currentPrice + minimumIncrementYen;

    if (bidAmount < minimumBidAmount) {
      return {
        success: false,
        message: `Bid must be at least ${minimumBidAmount} (current: ${auction.currentPrice}, min increment: ${minimumIncrementYen})`,
      };
    }

    // Create bid
    const bidId = `bid_${++this.bidIdSeq}`;
    const bid: BidInfo = {
      bidId,
      auctionId,
      bidderId,
      bidAmount,
      bidTime: new Date(now),
    };

    const bids = this.bidRegistry.get(auctionId)!;
    bids.push(bid);

    // Update auction
    auction.currentPrice = bidAmount;
    auction.winnerBidderId = bidderId;
    auction.totalBids = bids.length;

    // Check for 5-minute extension
    const timeRemainingMs = auction.endTime.getTime() - now.getTime();
    const fiveMinutesMs = 5 * 60 * 1000;

    if (timeRemainingMs > 0 && timeRemainingMs < fiveMinutesMs) {
      auction.endTime = new Date(now.getTime() + fiveMinutesMs);
    }

    return { success: true };
  }

  /**
   * End auction - transition Active to Ended or Cancelled
   */
  endAuction(auctionId: string, now: Date = new Date()): boolean {
    const auction = this.auctionRegistry.get(auctionId);
    if (!auction) return false;
    if (auction.status !== 'Active') return false;

    // Can only end if past end time
    if (now.getTime() <= auction.endTime.getTime()) return false;

    // If no bids received, cancel instead of ending
    const bids = this.bidRegistry.get(auctionId) || [];
    if (bids.length === 0) {
      auction.status = 'Cancelled';
      return true;
    }

    // Otherwise move to Ended
    auction.status = 'Ended';
    return true;
  }

  /**
   * Process payment - transition Ended to Paid
   */
  processPayment(auctionId: string, payerId: string, now: Date = new Date()): boolean {
    const auction = this.auctionRegistry.get(auctionId);
    if (!auction) return false;
    if (auction.status !== 'Ended') return false;
    if (auction.winnerBidderId !== payerId) return false;

    auction.status = 'Paid';
    return true;
  }

  /**
   * Confirm shipping - transition Paid to Shipped
   */
  confirmShipping(auctionId: string, now: Date = new Date()): boolean {
    const auction = this.auctionRegistry.get(auctionId);
    if (!auction) return false;
    if (auction.status !== 'Paid') return false;

    auction.status = 'Shipped';
    return true;
  }

  /**
   * Complete auction - transition Shipped to Completed
   */
  completeAuction(auctionId: string, now: Date = new Date()): boolean {
    const auction = this.auctionRegistry.get(auctionId);
    if (!auction) return false;
    if (auction.status !== 'Shipped') return false;

    auction.status = 'Completed';
    return true;
  }

  /**
   * Cancel auction
   */
  cancelAuction(auctionId: string, now: Date = new Date()): boolean {
    const auction = this.auctionRegistry.get(auctionId);
    if (!auction) return false;

    // Can cancel if Active with no bids
    if (auction.status === 'Active') {
      const bids = this.bidRegistry.get(auctionId) || [];
      if (bids.length === 0) {
        auction.status = 'Cancelled';
        return true;
      }
    }

    // Can cancel if Ended
    if (auction.status === 'Ended') {
      auction.status = 'Cancelled';
      return true;
    }

    return false;
  }

  /**
   * Calculate minimum increment (1% of current price, minimum 100 yen)
   */
  private calculateMinimumIncrement(currentPrice: number): number {
    const onePercent = Math.floor(currentPrice * 0.01);
    return Math.max(onePercent, 100);
  }

  /**
   * Check if payment is overdue (72 hours past end time)
   */
  isPaymentOverdue(auctionId: string, now: Date = new Date()): boolean {
    const auction = this.auctionRegistry.get(auctionId);
    if (!auction) return false;
    if (auction.status !== 'Ended') return false;

    const seventyTwoHoursMs = 72 * 60 * 60 * 1000;
    const timeSinceEnd = now.getTime() - auction.endTime.getTime();
    return timeSinceEnd > seventyTwoHoursMs;
  }

  /**
   * Get auction data
   */
  getAuction(auctionId: string): AuctionData | null {
    const auction = this.auctionRegistry.get(auctionId);
    return auction ? { ...auction } : null;
  }

  /**
   * Get bids for auction
   */
  getBids(auctionId: string): BidInfo[] {
    const bids = this.bidRegistry.get(auctionId);
    return bids ? [...bids] : [];
  }

  /**
   * Get highest bid
   */
  getHighestBid(auctionId: string): BidInfo | null {
    const bids = this.getBids(auctionId);
    if (bids.length === 0) return null;
    return bids[bids.length - 1];
  }
}
