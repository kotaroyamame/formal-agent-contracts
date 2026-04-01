// Online Auction System - TypeScript Implementation (Run 1)
// Based on comprehensive VDM-SL state machine

export enum AuctionState {
  Draft = "Draft",
  Active = "Active",
  Ended = "Ended",
  Paid = "Paid",
  Shipped = "Shipped",
  Completed = "Completed",
  Cancelled = "Cancelled",
}

export interface Bid {
  bidderId: string;
  amount: number;
  timestamp: number;
}

export interface Auction {
  auctionId: string;
  sellerId: string;
  title: string;
  description: string;
  startingPrice: number;
  currentHighestBid: number;
  highestBidder: string | null;
  state: AuctionState;
  bids: Bid[];
  createdAt: number;
  startTime: number;
  endTime: number;
  paidAt: number | null;
  shippedAt: number | null;
  extensionCount: number;
  maxExtensions: number;
}

export class AuctionSystem {
  private auctions: Map<string, Auction> = new Map();
  private readonly MAX_EXTENSIONS = 10;
  private readonly MAX_EXTENSION_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly PAYMENT_TIMEOUT = 72 * 60 * 60 * 1000; // 72 hours
  private readonly MIN_INCREMENT_BASE = 0.01; // 1%
  private readonly MIN_INCREMENT_FLOOR = 100; // 100 yen

  /**
   * Create a new auction in Draft state
   * Precondition: startingPrice > 0, duration > 0, auctionId not exists
   */
  createAuction(
    auctionId: string,
    sellerId: string,
    title: string,
    description: string,
    startingPrice: number,
    duration: number,
    now: number
  ): string {
    // Preconditions
    if (startingPrice <= 0) {
      throw new Error("Starting price must be positive");
    }
    if (duration <= 0) {
      throw new Error("Duration must be positive");
    }
    if (this.auctions.has(auctionId)) {
      throw new Error("Auction ID already exists");
    }

    const endTime = now + duration;
    const auction: Auction = {
      auctionId,
      sellerId,
      title,
      description,
      startingPrice,
      currentHighestBid: 0,
      highestBidder: null,
      state: AuctionState.Draft,
      bids: [],
      createdAt: now,
      startTime: endTime, // Will be set on activation
      endTime,
      paidAt: null,
      shippedAt: null,
      extensionCount: 0,
      maxExtensions: this.MAX_EXTENSIONS,
    };

    this.auctions.set(auctionId, auction);
    return auctionId;
  }

  /**
   * Activate auction: Draft -> Active
   */
  activateAuction(auctionId: string, now: number): boolean {
    const auction = this.getAuction(auctionId);

    // Preconditions
    if (auction.state !== AuctionState.Draft) {
      throw new Error("Auction must be in Draft state");
    }
    if (now >= auction.endTime) {
      throw new Error("Cannot activate after end time");
    }

    auction.state = AuctionState.Active;
    auction.startTime = now;
    return true;
  }

  /**
   * Place a bid on an active auction
   * Handles time extension if bid is within 5 minutes of end
   */
  placeBid(
    auctionId: string,
    bidderId: string,
    bidAmount: number,
    now: number
  ): boolean {
    const auction = this.getAuction(auctionId);

    // Preconditions
    if (auction.state !== AuctionState.Active) {
      throw new Error("Auction must be in Active state");
    }
    if (bidderId === auction.sellerId) {
      throw new Error("Seller cannot bid on their own auction");
    }
    if (now < auction.startTime) {
      throw new Error("Auction has not started yet");
    }
    if (now >= auction.endTime) {
      throw new Error("Auction has ended");
    }

    // Minimum bid must be > current highest or >= starting price for first bid
    if (auction.bids.length === 0) {
      if (bidAmount < auction.startingPrice) {
        throw new Error("First bid must be >= starting price");
      }
    } else {
      const minIncrement = Math.max(
        Math.floor(auction.currentHighestBid * this.MIN_INCREMENT_BASE),
        this.MIN_INCREMENT_FLOOR
      );
      if (bidAmount <= auction.currentHighestBid) {
        throw new Error("Bid must be higher than current highest bid");
      }
      if (bidAmount < auction.currentHighestBid + minIncrement) {
        throw new Error(
          `Bid must be at least ${minIncrement} yen higher than current highest bid`
        );
      }
    }

    // Add bid
    const bid: Bid = {
      bidderId,
      amount: bidAmount,
      timestamp: now,
    };
    auction.bids.push(bid);
    auction.currentHighestBid = bidAmount;
    auction.highestBidder = bidderId;

    // Check if extension needed (within 5 minutes of end)
    const timeUntilEnd = auction.endTime - now;
    if (timeUntilEnd <= this.MAX_EXTENSION_DURATION) {
      if (auction.extensionCount < auction.maxExtensions) {
        auction.endTime += this.MAX_EXTENSION_DURATION;
        auction.extensionCount += 1;
      }
    }

    return true;
  }

  /**
   * End auction: Active -> Ended
   */
  endAuction(auctionId: string, now: number): boolean {
    const auction = this.getAuction(auctionId);

    // Preconditions
    if (auction.state !== AuctionState.Active) {
      throw new Error("Auction must be in Active state");
    }
    if (now < auction.endTime) {
      throw new Error("Auction has not ended yet");
    }

    auction.state = AuctionState.Ended;
    return true;
  }

  /**
   * Process payment: Ended -> Paid
   * Must be within 72 hours of end time
   */
  processPayment(auctionId: string, now: number): boolean {
    const auction = this.getAuction(auctionId);

    // Preconditions
    if (auction.state !== AuctionState.Ended) {
      throw new Error("Auction must be in Ended state");
    }
    const elapsedTime = now - auction.endTime;
    if (elapsedTime > this.PAYMENT_TIMEOUT) {
      throw new Error("Payment window exceeded (72 hours)");
    }

    auction.state = AuctionState.Paid;
    auction.paidAt = now;
    return true;
  }

  /**
   * Cancel unpaid auction: Ended -> Cancelled
   * Only after 72 hours have passed
   */
  cancelUnpaid(auctionId: string, now: number): boolean {
    const auction = this.getAuction(auctionId);

    // Preconditions
    if (auction.state !== AuctionState.Ended) {
      throw new Error("Auction must be in Ended state");
    }
    const elapsedTime = now - auction.endTime;
    if (elapsedTime <= this.PAYMENT_TIMEOUT) {
      throw new Error("Cannot cancel within 72 hours of end time");
    }

    auction.state = AuctionState.Cancelled;
    return true;
  }

  /**
   * Ship item: Paid -> Shipped
   */
  shipItem(auctionId: string, now: number): boolean {
    const auction = this.getAuction(auctionId);

    // Preconditions
    if (auction.state !== AuctionState.Paid) {
      throw new Error("Auction must be in Paid state");
    }

    auction.state = AuctionState.Shipped;
    auction.shippedAt = now;
    return true;
  }

  /**
   * Complete auction: Shipped -> Completed
   */
  completeAuction(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    // Preconditions
    if (auction.state !== AuctionState.Shipped) {
      throw new Error("Auction must be in Shipped state");
    }

    auction.state = AuctionState.Completed;
    return true;
  }

  /**
   * Cancel from Draft state
   */
  cancelFromDraft(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    // Preconditions
    if (auction.state !== AuctionState.Draft) {
      throw new Error("Auction must be in Draft state");
    }

    auction.state = AuctionState.Cancelled;
    return true;
  }

  /**
   * Cancel from Active state
   */
  cancelFromActive(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    // Preconditions
    if (auction.state !== AuctionState.Active) {
      throw new Error("Auction must be in Active state");
    }

    auction.state = AuctionState.Cancelled;
    return true;
  }

  /**
   * Get auction by ID
   */
  getAuction(auctionId: string): Auction {
    const auction = this.auctions.get(auctionId);
    if (!auction) {
      throw new Error("Auction not found");
    }
    return auction;
  }

  /**
   * Get all auctions
   */
  getAllAuctions(): Auction[] {
    return Array.from(this.auctions.values());
  }

  /**
   * Check state validity
   */
  isValidState(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    // Starting price must be positive
    if (auction.startingPrice <= 0) return false;

    // Duration must be positive
    if (auction.startTime >= auction.endTime) return false;

    // No more than MAX_EXTENSIONS
    if (auction.extensionCount > auction.maxExtensions) return false;

    // If Active, must be in time window
    if (
      auction.state === AuctionState.Active &&
      (auction.startTime > auction.createdAt ||
        auction.createdAt >= auction.endTime)
    ) {
      return false;
    }

    // Highest bidder cannot be seller
    if (auction.highestBidder !== null && auction.highestBidder === auction.sellerId) {
      return false;
    }

    // All bidders cannot be seller
    if (auction.bids.some((bid) => bid.bidderId === auction.sellerId)) {
      return false;
    }

    // Bids must be strictly increasing
    for (let i = 1; i < auction.bids.length; i++) {
      if (auction.bids[i].amount <= auction.bids[i - 1].amount) {
        return false;
      }
    }

    return true;
  }
}
