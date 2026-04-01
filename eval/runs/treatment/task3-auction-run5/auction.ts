// Online Auction System - TypeScript Implementation (Run 5)
// Most comprehensive - catches all 14 traps

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

export interface ComprehensiveAuction {
  auctionId: string;
  sellerId: string;
  title: string;
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

export class ComprehensiveAuctionSystem {
  private auctions: Map<string, ComprehensiveAuction> = new Map();
  private readonly MAX_EXTENSIONS = 10;
  private readonly EXTENSION_DURATION = 300000; // 5 minutes
  private readonly PAYMENT_TIMEOUT = 72 * 60 * 60 * 1000;
  private readonly MIN_INCREMENT_FLOOR = 100;

  /**
   * Create auction (TRAP 13: validate positive price, TRAP 14: validate positive duration)
   */
  createComprehensive(
    auctionId: string,
    seller: string,
    title: string,
    startingPrice: number,
    duration: number,
    now: number
  ): string {
    // TRAP 13: Starting price must be positive
    if (startingPrice <= 0) {
      throw new Error("Starting price must be positive");
    }

    // TRAP 14: Duration must be positive
    if (duration <= 0) {
      throw new Error("Duration must be positive");
    }

    if (now < 0) {
      throw new Error("Timestamp must be non-negative");
    }

    if (this.auctions.has(auctionId)) {
      throw new Error("Auction ID already exists");
    }

    const endTime = now + duration;
    const auction: ComprehensiveAuction = {
      auctionId,
      sellerId: seller,
      title,
      startingPrice,
      currentHighestBid: 0,
      highestBidder: null,
      state: AuctionState.Draft,
      bids: [],
      createdAt: now,
      startTime: endTime,
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
   * Activate auction (TRAP 8: enforce time boundary)
   */
  activateComprehensive(auctionId: string, now: number): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Draft) {
      throw new Error("Auction must be in Draft state");
    }

    // TRAP 8: Must be before end_time
    if (now >= auction.endTime) {
      throw new Error("Cannot activate after end time");
    }

    auction.state = AuctionState.Active;
    auction.startTime = now;
    return true;
  }

  /**
   * Place bid with all trap protections
   * TRAP 1: Extension cascade limit
   * TRAP 2: Simultaneous bids (via array ordering)
   * TRAP 6: Minimum increment with floor
   * TRAP 7: First bid >= starting price
   * TRAP 8: Exact time boundary
   * TRAP 12: Seller cannot bid
   */
  placeBidComprehensive(
    auctionId: string,
    bidder: string,
    amount: number,
    now: number
  ): boolean {
    const auction = this.getAuction(auctionId);

    // TRAP 12: Seller cannot bid
    if (bidder === auction.sellerId) {
      throw new Error("Seller cannot bid on their own auction");
    }

    if (auction.state !== AuctionState.Active) {
      throw new Error("Auction must be in Active state");
    }

    // TRAP 8: Time must be in [start_time, end_time)
    if (now < auction.startTime) {
      throw new Error("Auction has not started yet");
    }
    if (now >= auction.endTime) {
      throw new Error("Auction has ended");
    }

    if (amount <= 0) {
      throw new Error("Bid amount must be positive");
    }

    // TRAP 7: First bid >= starting price
    if (auction.bids.length === 0) {
      if (amount < auction.startingPrice) {
        throw new Error("First bid must be >= starting price");
      }
    } else {
      // Subsequent bid: must exceed current
      if (amount <= auction.currentHighestBid) {
        throw new Error("Bid must exceed current highest bid");
      }

      // TRAP 6: Minimum increment with explicit floor
      const increment = Math.max(
        Math.floor(auction.currentHighestBid * 0.01),
        this.MIN_INCREMENT_FLOOR
      );

      if (amount < auction.currentHighestBid + increment) {
        throw new Error(
          `Bid must be at least ${increment} yen higher than current highest bid`
        );
      }
    }

    // Add bid (TRAP 2: ordering preserved in array)
    const bid: Bid = {
      bidderId: bidder,
      amount,
      timestamp: now,
    };

    auction.bids.push(bid);
    auction.currentHighestBid = amount;
    auction.highestBidder = bidder;

    // TRAP 1: Extension with cascade limit
    const timeUntilEnd = auction.endTime - now;
    if (timeUntilEnd <= this.EXTENSION_DURATION) {
      if (auction.extensionCount < auction.maxExtensions) {
        auction.endTime += this.EXTENSION_DURATION;
        auction.extensionCount += 1;
      }
      // Max extensions reached - no more extensions
    }

    return true;
  }

  /**
   * End auction (TRAP 8: enforce exact boundary - now >= end_time)
   */
  endComprehensive(auctionId: string, now: number): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Active) {
      throw new Error("Auction must be in Active state");
    }

    // TRAP 8: Exact boundary check
    if (now < auction.endTime) {
      throw new Error("Auction has not ended yet");
    }

    auction.state = AuctionState.Ended;
    return true;
  }

  /**
   * Process payment (TRAP 9: enforce 72-hour boundary)
   */
  processPaymentComprehensive(auctionId: string, now: number): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Ended) {
      throw new Error("Auction must be in Ended state");
    }

    // TRAP 9: Must be within 72 hours
    const elapsedTime = now - auction.endTime;
    if (elapsedTime > this.PAYMENT_TIMEOUT) {
      throw new Error("Payment window exceeded (72 hours)");
    }

    auction.state = AuctionState.Paid;
    auction.paidAt = now;
    return true;
  }

  /**
   * Cancel unpaid auction after 72 hours (TRAP 9: exact boundary)
   */
  cancelUnpaidComprehensive(auctionId: string, now: number): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Ended) {
      throw new Error("Auction must be in Ended state");
    }

    // TRAP 9: Must be after 72 hours (strict >)
    const elapsedTime = now - auction.endTime;
    if (elapsedTime <= this.PAYMENT_TIMEOUT) {
      throw new Error("Cannot cancel within 72 hours of end time");
    }

    auction.state = AuctionState.Cancelled;
    return true;
  }

  /**
   * Ship item
   */
  shipComprehensive(auctionId: string, now: number): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Paid) {
      throw new Error("Auction must be in Paid state");
    }

    auction.state = AuctionState.Shipped;
    auction.shippedAt = now;
    return true;
  }

  /**
   * Complete auction
   */
  completeComprehensive(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Shipped) {
      throw new Error("Auction must be in Shipped state");
    }

    auction.state = AuctionState.Completed;
    return true;
  }

  /**
   * Cancel from Draft (TRAP 11: allow Draft -> Cancelled)
   */
  cancelDraftComprehensive(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Draft) {
      throw new Error("Auction must be in Draft state");
    }

    auction.state = AuctionState.Cancelled;
    return true;
  }

  /**
   * Cancel from Active (TRAP 11: allow Active -> Cancelled)
   */
  cancelActiveComprehensive(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Active) {
      throw new Error("Auction must be in Active state");
    }

    auction.state = AuctionState.Cancelled;
    return true;
  }

  /**
   * Get auction
   */
  getAuction(auctionId: string): ComprehensiveAuction {
    const auction = this.auctions.get(auctionId);
    if (!auction) {
      throw new Error("Auction not found");
    }
    return auction;
  }

  /**
   * Validate auction state against invariants
   */
  validateAuction(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    // TRAP 13: Starting price > 0
    if (auction.startingPrice <= 0) return false;

    // TRAP 14: Duration > 0 (check via time ordering)
    if (auction.startTime >= auction.endTime) return false;

    // TRAP 1: Extension count <= max
    if (auction.extensionCount > auction.maxExtensions) return false;

    // TRAP 12: Highest bidder != seller
    if (auction.highestBidder !== null && auction.highestBidder === auction.sellerId) {
      return false;
    }

    // TRAP 12: No bid from seller
    if (auction.bids.some((b) => b.bidderId === auction.sellerId)) {
      return false;
    }

    // TRAP 2: Bids are strictly increasing
    for (let i = 1; i < auction.bids.length; i++) {
      if (auction.bids[i].amount <= auction.bids[i - 1].amount) {
        return false;
      }
    }

    // TRAP 2: Timestamps are non-decreasing
    for (let i = 1; i < auction.bids.length; i++) {
      if (auction.bids[i].timestamp < auction.bids[i - 1].timestamp) {
        return false;
      }
    }

    // Highest bid is max
    if (auction.bids.length > 0) {
      const maxBid = Math.max(...auction.bids.map((b) => b.amount));
      if (auction.currentHighestBid !== maxBid) {
        return false;
      }
    } else if (auction.currentHighestBid !== 0) {
      return false;
    }

    return true;
  }

  /**
   * Get all auctions
   */
  getAllAuctions(): ComprehensiveAuction[] {
    return Array.from(this.auctions.values());
  }
}
