/**
 * RUN 1: Standard State Machine Implementation
 * Basic state transitions and bid validation without formal methods
 * Covers core functionality with straightforward logic flow
 */

export type AuctionState = 'Draft' | 'Active' | 'Ended' | 'Paid' | 'Shipped' | 'Completed' | 'Cancelled';

export interface AuctionItem {
  id: string;
  productName: string;
  sellerId: string;
  startPrice: number;
  currentPrice: number;
  startTime: Date;
  endTime: Date;
  state: AuctionState;
  highestBidderId: string | null;
  bids: Bid[];
}

export interface Bid {
  id: string;
  bidderId: string;
  amount: number;
  timestamp: Date;
  auctionId: string;
}

export interface PaymentRecord {
  auctionId: string;
  bidderId: string;
  amount: number;
  timestamp: Date;
  status: 'pending' | 'completed';
}

export interface ShippingRecord {
  auctionId: string;
  status: 'pending' | 'shipped' | 'completed';
  timestamp: Date;
}

export class AuctionSystem {
  private auctions: Map<string, AuctionItem> = new Map();
  private payments: Map<string, PaymentRecord> = new Map();
  private shipping: Map<string, ShippingRecord> = new Map();
  private bidIdCounter = 0;
  private auctionIdCounter = 0;

  /**
   * Create a new auction (Draft state)
   */
  createAuction(
    productName: string,
    startPrice: number,
    durationMinutes: number,
    sellerId: string
  ): string {
    const auctionId = `auction_${++this.auctionIdCounter}`;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const auction: AuctionItem = {
      id: auctionId,
      productName,
      sellerId,
      startPrice,
      currentPrice: startPrice,
      startTime,
      endTime,
      state: 'Draft',
      highestBidderId: null,
      bids: [],
    };

    this.auctions.set(auctionId, auction);
    return auctionId;
  }

  /**
   * Activate the auction (Draft -> Active)
   */
  activateAuction(auctionId: string): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;
    if (auction.state !== 'Draft') return false;

    auction.state = 'Active';
    auction.startTime = new Date();
    return true;
  }

  /**
   * Place a bid on an active auction
   */
  placeBid(auctionId: string, bidderId: string, bidAmount: number): { success: boolean; reason?: string } {
    const auction = this.auctions.get(auctionId);
    if (!auction) return { success: false, reason: 'Auction not found' };

    // Validation checks
    if (auction.state !== 'Active') {
      return { success: false, reason: `Auction is not active, state: ${auction.state}` };
    }

    if (bidderId === auction.sellerId) {
      return { success: false, reason: 'Seller cannot bid on their own auction' };
    }

    const now = new Date();
    if (now > auction.endTime) {
      return { success: false, reason: 'Auction period has ended' };
    }

    // Check minimum bid
    const minBidAmount = this.calculateMinimumBid(auction.currentPrice);
    if (bidAmount < minBidAmount) {
      return { success: false, reason: `Bid must be at least ${minBidAmount}` };
    }

    // Check if bid is higher than current price
    if (bidAmount <= auction.currentPrice) {
      return { success: false, reason: `Bid must be higher than current price ${auction.currentPrice}` };
    }

    // Create bid
    const bid: Bid = {
      id: `bid_${++this.bidIdCounter}`,
      bidderId,
      amount: bidAmount,
      timestamp: now,
      auctionId,
    };

    auction.bids.push(bid);
    auction.currentPrice = bidAmount;
    auction.highestBidderId = bidderId;

    // Check if bid is within 5 minutes of end time
    const timeToEnd = auction.endTime.getTime() - now.getTime();
    const fiveMinutesMs = 5 * 60 * 1000;
    if (timeToEnd > 0 && timeToEnd < fiveMinutesMs) {
      auction.endTime = new Date(now.getTime() + fiveMinutesMs);
    }

    return { success: true };
  }

  /**
   * End auction and mark as Ended (only called when time expires)
   */
  endAuction(auctionId: string): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;
    if (auction.state !== 'Active') return false;

    const now = new Date();
    if (now <= auction.endTime) return false;

    // If no bids, can go to Cancelled
    if (auction.bids.length === 0) {
      auction.state = 'Cancelled';
      return true;
    }

    auction.state = 'Ended';
    return true;
  }

  /**
   * Process payment (Ended -> Paid)
   */
  processPayment(auctionId: string, bidderId: string): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;
    if (auction.state !== 'Ended') return false;
    if (auction.highestBidderId !== bidderId) return false;

    const paymentId = `payment_${auctionId}`;
    const payment: PaymentRecord = {
      auctionId,
      bidderId,
      amount: auction.currentPrice,
      timestamp: new Date(),
      status: 'completed',
    };

    this.payments.set(paymentId, payment);
    auction.state = 'Paid';
    return true;
  }

  /**
   * Confirm shipping (Paid -> Shipped)
   */
  confirmShipping(auctionId: string): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;
    if (auction.state !== 'Paid') return false;

    const shippingId = `shipping_${auctionId}`;
    const shipping: ShippingRecord = {
      auctionId,
      status: 'shipped',
      timestamp: new Date(),
    };

    this.shipping.set(shippingId, shipping);
    auction.state = 'Shipped';
    return true;
  }

  /**
   * Complete auction (Shipped -> Completed)
   */
  completeAuction(auctionId: string): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;
    if (auction.state !== 'Shipped') return false;

    auction.state = 'Completed';
    return true;
  }

  /**
   * Calculate minimum bid (1% of current price, minimum 100 yen)
   */
  private calculateMinimumBid(currentPrice: number): number {
    const increment = Math.max(currentPrice * 0.01, 100);
    return currentPrice + increment;
  }

  /**
   * Get auction details
   */
  getAuction(auctionId: string): AuctionItem | null {
    return this.auctions.get(auctionId) || null;
  }

  /**
   * Get all bids for an auction
   */
  getBids(auctionId: string): Bid[] {
    const auction = this.auctions.get(auctionId);
    return auction ? auction.bids : [];
  }

  /**
   * Check if payment is overdue (72 hours passed)
   */
  isPaymentOverdue(auctionId: string): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;
    if (auction.state !== 'Ended') return false;

    const now = new Date();
    const seventyTwoHours = 72 * 60 * 60 * 1000;
    return now.getTime() - auction.endTime.getTime() > seventyTwoHours;
  }

  /**
   * Cancel auction (can happen if overdue payment or no bids)
   */
  cancelAuction(auctionId: string): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    if (auction.state === 'Active' && auction.bids.length === 0) {
      auction.state = 'Cancelled';
      return true;
    }

    if (this.isPaymentOverdue(auctionId)) {
      auction.state = 'Cancelled';
      return true;
    }

    return false;
  }
}
