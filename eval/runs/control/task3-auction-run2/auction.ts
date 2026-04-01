/**
 * RUN 2: Class-based with Enum States
 * Better state transition validation using enums
 */

enum AuctionStateEnum {
  Draft = 'Draft',
  Active = 'Active',
  Ended = 'Ended',
  Paid = 'Paid',
  Shipped = 'Shipped',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface BidData {
  id: string;
  bidderId: string;
  amount: number;
  timestamp: Date;
}

export class Auction {
  private id: string;
  private productName: string;
  private sellerId: string;
  private startPrice: number;
  private currentPrice: number;
  private startTime: Date;
  private endTime: Date;
  private state: AuctionStateEnum;
  private highestBidderId: string | null;
  private bids: BidData[];
  private bidIdCounter: number;

  constructor(
    id: string,
    productName: string,
    sellerId: string,
    startPrice: number,
    durationMinutes: number,
    startTime: Date = new Date()
  ) {
    this.id = id;
    this.productName = productName;
    this.sellerId = sellerId;
    this.startPrice = startPrice;
    this.currentPrice = startPrice;
    this.startTime = startTime;
    this.endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    this.state = AuctionStateEnum.Draft;
    this.highestBidderId = null;
    this.bids = [];
    this.bidIdCounter = 0;
  }

  getId(): string {
    return this.id;
  }

  getProductName(): string {
    return this.productName;
  }

  getSellerId(): string {
    return this.sellerId;
  }

  getStartPrice(): number {
    return this.startPrice;
  }

  getCurrentPrice(): number {
    return this.currentPrice;
  }

  getStartTime(): Date {
    return this.startTime;
  }

  getEndTime(): Date {
    return this.endTime;
  }

  getState(): AuctionStateEnum {
    return this.state;
  }

  getHighestBidderId(): string | null {
    return this.highestBidderId;
  }

  getBids(): BidData[] {
    return [...this.bids];
  }

  /**
   * Activate auction: Draft -> Active
   */
  activate(): boolean {
    if (this.state !== AuctionStateEnum.Draft) {
      return false;
    }
    this.state = AuctionStateEnum.Active;
    this.startTime = new Date();
    this.endTime = new Date(this.startTime.getTime() + (this.endTime.getTime() - this.startTime.getTime()));
    return true;
  }

  /**
   * Place bid with validation
   */
  placeBid(bidderId: string, bidAmount: number, currentTime: Date = new Date()): { success: boolean; reason?: string } {
    // State validation
    if (this.state !== AuctionStateEnum.Active) {
      return { success: false, reason: `Auction is ${this.state}, not active` };
    }

    // Seller cannot bid
    if (bidderId === this.sellerId) {
      return { success: false, reason: 'Seller cannot bid on own auction' };
    }

    // Time validation
    if (currentTime > this.endTime) {
      return { success: false, reason: 'Auction period has ended' };
    }

    // Amount validation
    if (bidAmount <= this.currentPrice) {
      return { success: false, reason: `Bid must exceed current price (${this.currentPrice})` };
    }

    const minIncrement = Math.max(this.currentPrice * 0.01, 100);
    if (bidAmount < this.currentPrice + minIncrement) {
      return { success: false, reason: `Minimum increment is ${minIncrement}` };
    }

    // Create bid
    const bid: BidData = {
      id: `bid_${++this.bidIdCounter}`,
      bidderId,
      amount: bidAmount,
      timestamp: currentTime,
    };

    this.bids.push(bid);
    this.currentPrice = bidAmount;
    this.highestBidderId = bidderId;

    // Extension logic: if bid within 5 minutes of end
    const timeToEnd = this.endTime.getTime() - currentTime.getTime();
    if (timeToEnd > 0 && timeToEnd < 5 * 60 * 1000) {
      this.endTime = new Date(currentTime.getTime() + 5 * 60 * 1000);
    }

    return { success: true };
  }

  /**
   * End auction: Active -> Ended or Cancelled
   */
  end(currentTime: Date = new Date()): boolean {
    if (this.state !== AuctionStateEnum.Active) {
      return false;
    }

    if (currentTime <= this.endTime) {
      return false;
    }

    // No bids -> Cancelled
    if (this.bids.length === 0) {
      this.state = AuctionStateEnum.Cancelled;
      return true;
    }

    this.state = AuctionStateEnum.Ended;
    return true;
  }

  /**
   * Process payment: Ended -> Paid
   */
  processPayment(bidderId: string): boolean {
    if (this.state !== AuctionStateEnum.Ended) {
      return false;
    }

    if (this.highestBidderId !== bidderId) {
      return false;
    }

    this.state = AuctionStateEnum.Paid;
    return true;
  }

  /**
   * Confirm shipping: Paid -> Shipped
   */
  confirmShipping(): boolean {
    if (this.state !== AuctionStateEnum.Paid) {
      return false;
    }

    this.state = AuctionStateEnum.Shipped;
    return true;
  }

  /**
   * Complete auction: Shipped -> Completed
   */
  complete(): boolean {
    if (this.state !== AuctionStateEnum.Shipped) {
      return false;
    }

    this.state = AuctionStateEnum.Completed;
    return true;
  }

  /**
   * Cancel auction (from Active or Ended)
   */
  cancel(): boolean {
    if (this.state === AuctionStateEnum.Active && this.bids.length === 0) {
      this.state = AuctionStateEnum.Cancelled;
      return true;
    }

    if (this.state === AuctionStateEnum.Ended) {
      this.state = AuctionStateEnum.Cancelled;
      return true;
    }

    return false;
  }

  /**
   * Check if payment is overdue (72 hours past end time)
   */
  isPaymentOverdue(currentTime: Date = new Date()): boolean {
    if (this.state !== AuctionStateEnum.Ended) {
      return false;
    }

    const seventyTwoHours = 72 * 60 * 60 * 1000;
    return currentTime.getTime() - this.endTime.getTime() > seventyTwoHours;
  }
}

export class AuctionRepository {
  private auctions: Map<string, Auction> = new Map();
  private auctionCounter: number = 0;

  createAuction(
    productName: string,
    startPrice: number,
    durationMinutes: number,
    sellerId: string
  ): string {
    const auctionId = `auction_${++this.auctionCounter}`;
    const auction = new Auction(auctionId, productName, sellerId, startPrice, durationMinutes);
    this.auctions.set(auctionId, auction);
    return auctionId;
  }

  getAuction(auctionId: string): Auction | null {
    return this.auctions.get(auctionId) || null;
  }

  getAllAuctions(): Map<string, Auction> {
    return new Map(this.auctions);
  }

  activateAuction(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);
    return auction ? auction.activate() : false;
  }

  placeBid(auctionId: string, bidderId: string, bidAmount: number): { success: boolean; reason?: string } {
    const auction = this.getAuction(auctionId);
    if (!auction) return { success: false, reason: 'Auction not found' };
    return auction.placeBid(bidderId, bidAmount);
  }

  endAuction(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);
    return auction ? auction.end() : false;
  }

  processPayment(auctionId: string, bidderId: string): boolean {
    const auction = this.getAuction(auctionId);
    return auction ? auction.processPayment(bidderId) : false;
  }

  confirmShipping(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);
    return auction ? auction.confirmShipping() : false;
  }

  completeAuction(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);
    return auction ? auction.complete() : false;
  }

  cancelAuction(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);
    return auction ? auction.cancel() : false;
  }

  isPaymentOverdue(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);
    return auction ? auction.isPaymentOverdue() : false;
  }
}
