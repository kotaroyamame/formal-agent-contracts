// Online Auction System - TypeScript Implementation (Run 3)
// Explicit transition matrix with comprehensive validation

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
  bidder: string;
  amount: number;
  ts: number;
}

export interface Auction {
  id: string;
  seller: string;
  startingPrice: number;
  highestBid: number;
  highestBidder: string | null;
  state: AuctionState;
  bids: Bid[];
  endTime: number;
  extensions: number;
  created: number;
}

export class TransitionSystem {
  private auctions: Map<string, Auction> = new Map();
  private readonly MAX_EXTENSIONS = 10;
  private readonly EXTENSION_TIME = 300000; // 5 minutes
  private readonly PAYMENT_TIMEOUT = 72 * 60 * 60 * 1000; // 72 hours
  private readonly MIN_INCREMENT_FLOOR = 100;

  /**
   * Explicit transition matrix
   */
  private readonly VALID_TRANSITIONS: Map<AuctionState, Set<AuctionState>> = new Map([
    [AuctionState.Draft, new Set([AuctionState.Active, AuctionState.Cancelled])],
    [AuctionState.Active, new Set([AuctionState.Ended, AuctionState.Cancelled])],
    [AuctionState.Ended, new Set([AuctionState.Paid, AuctionState.Cancelled])],
    [AuctionState.Paid, new Set([AuctionState.Shipped])],
    [AuctionState.Shipped, new Set([AuctionState.Completed])],
    [AuctionState.Completed, new Set()],
    [AuctionState.Cancelled, new Set()],
  ]);

  /**
   * Create new auction
   */
  newAuction(
    id: string,
    seller: string,
    price: number,
    duration: number,
    now: number
  ): string {
    if (price <= 0) {
      throw new Error("Starting price must be positive");
    }
    if (duration <= 0) {
      throw new Error("Duration must be positive");
    }
    if (now < 0) {
      throw new Error("Timestamp must be non-negative");
    }
    if (this.auctions.has(id)) {
      throw new Error("Auction ID already exists");
    }

    const auction: Auction = {
      id,
      seller,
      startingPrice: price,
      highestBid: 0,
      highestBidder: null,
      state: AuctionState.Draft,
      bids: [],
      endTime: now + duration,
      extensions: 0,
      created: now,
    };

    this.auctions.set(id, auction);
    return id;
  }

  /**
   * Check if transition is valid (using explicit transition matrix)
   */
  isValidTransition(auctionId: string, targetState: AuctionState): boolean {
    const auction = this.getAuction(auctionId);
    const validNext = this.VALID_TRANSITIONS.get(auction.state);

    if (!validNext) {
      return false;
    }

    return validNext.has(targetState);
  }

  /**
   * Explicit transition: Draft -> Active
   * PO: must prove now < end_time
   */
  transitionDraftToActive(auctionId: string, now: number): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Draft) {
      throw new Error("Auction must be in Draft state");
    }

    // PO: Proof obligation - now < end_time
    if (now >= auction.endTime) {
      throw new Error("Cannot activate after end time");
    }

    if (!this.isValidTransition(auctionId, AuctionState.Active)) {
      throw new Error("Invalid transition: Draft -> Active");
    }

    auction.state = AuctionState.Active;
    return true;
  }

  /**
   * Explicit transition: Active -> Ended
   * PO: must prove now >= end_time
   */
  transitionActiveToEnded(auctionId: string, now: number): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Active) {
      throw new Error("Auction must be in Active state");
    }

    // PO: Proof obligation - now >= end_time
    if (now < auction.endTime) {
      throw new Error("Auction has not ended yet");
    }

    if (!this.isValidTransition(auctionId, AuctionState.Ended)) {
      throw new Error("Invalid transition: Active -> Ended");
    }

    auction.state = AuctionState.Ended;
    return true;
  }

  /**
   * Explicit transition: Ended -> Paid
   * PO: must prove (now - end_time) <= 72 hours
   */
  transitionEndedToPaid(auctionId: string, now: number): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Ended) {
      throw new Error("Auction must be in Ended state");
    }

    // PO: Proof obligation - elapsed time <= 72 hours
    const elapsed = now - auction.endTime;
    if (elapsed > this.PAYMENT_TIMEOUT) {
      throw new Error("Payment window exceeded (72 hours)");
    }

    if (!this.isValidTransition(auctionId, AuctionState.Paid)) {
      throw new Error("Invalid transition: Ended -> Paid");
    }

    auction.state = AuctionState.Paid;
    return true;
  }

  /**
   * Explicit transition: Ended -> Cancelled (timeout)
   * PO: must prove (now - end_time) > 72 hours
   */
  transitionEndedToCancelled(auctionId: string, now: number): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Ended) {
      throw new Error("Auction must be in Ended state");
    }

    // PO: Proof obligation - elapsed time > 72 hours
    const elapsed = now - auction.endTime;
    if (elapsed <= this.PAYMENT_TIMEOUT) {
      throw new Error("Cannot cancel within 72 hours of end time");
    }

    if (!this.isValidTransition(auctionId, AuctionState.Cancelled)) {
      throw new Error("Invalid transition: Ended -> Cancelled");
    }

    auction.state = AuctionState.Cancelled;
    return true;
  }

  /**
   * Explicit transition: Paid -> Shipped
   */
  transitionPaidToShipped(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Paid) {
      throw new Error("Auction must be in Paid state");
    }

    if (!this.isValidTransition(auctionId, AuctionState.Shipped)) {
      throw new Error("Invalid transition: Paid -> Shipped");
    }

    auction.state = AuctionState.Shipped;
    return true;
  }

  /**
   * Explicit transition: Shipped -> Completed
   */
  transitionShippedToCompleted(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Shipped) {
      throw new Error("Auction must be in Shipped state");
    }

    if (!this.isValidTransition(auctionId, AuctionState.Completed)) {
      throw new Error("Invalid transition: Shipped -> Completed");
    }

    auction.state = AuctionState.Completed;
    return true;
  }

  /**
   * Explicit transition: Draft -> Cancelled
   */
  transitionDraftToCancelled(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Draft) {
      throw new Error("Auction must be in Draft state");
    }

    if (!this.isValidTransition(auctionId, AuctionState.Cancelled)) {
      throw new Error("Invalid transition: Draft -> Cancelled");
    }

    auction.state = AuctionState.Cancelled;
    return true;
  }

  /**
   * Explicit transition: Active -> Cancelled
   */
  transitionActiveToCancelled(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Active) {
      throw new Error("Auction must be in Active state");
    }

    if (!this.isValidTransition(auctionId, AuctionState.Cancelled)) {
      throw new Error("Invalid transition: Active -> Cancelled");
    }

    auction.state = AuctionState.Cancelled;
    return true;
  }

  /**
   * Place bid with comprehensive validation
   * Handles extension logic inline
   */
  placeBidWithValidation(
    auctionId: string,
    bidder: string,
    amount: number,
    now: number
  ): boolean {
    const auction = this.getAuction(auctionId);

    // Preconditions
    if (auction.state !== AuctionState.Active) {
      throw new Error("Auction must be Active");
    }

    if (bidder === auction.seller) {
      throw new Error("Seller cannot bid");
    }

    if (now < auction.created || now >= auction.endTime) {
      throw new Error("Bid outside auction time window");
    }

    if (amount <= 0) {
      throw new Error("Bid amount must be positive");
    }

    // First bid validation
    if (auction.bids.length === 0) {
      if (amount < auction.startingPrice) {
        throw new Error("First bid must be >= starting price");
      }
    } else {
      // Subsequent bid validation
      if (amount <= auction.highestBid) {
        throw new Error("Bid must exceed current highest");
      }

      const increment = Math.max(
        Math.floor(auction.highestBid * 0.01),
        this.MIN_INCREMENT_FLOOR
      );

      if (amount < auction.highestBid + increment) {
        throw new Error(
          `Bid must be at least ${increment} more than current highest`
        );
      }
    }

    // Add bid
    const bid: Bid = {
      bidder,
      amount,
      ts: now,
    };

    auction.bids.push(bid);
    auction.highestBid = amount;
    auction.highestBidder = bidder;

    // Check for extension (within 5 minutes of end)
    const timeUntilEnd = auction.endTime - now;
    if (timeUntilEnd <= this.EXTENSION_TIME) {
      if (auction.extensions < this.MAX_EXTENSIONS) {
        auction.endTime += this.EXTENSION_TIME;
        auction.extensions += 1;
      }
    }

    return true;
  }

  /**
   * Get auction
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
   * Verify invariants
   */
  verifyInvariants(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    // Starting price > 0
    if (auction.startingPrice <= 0) return false;

    // Extensions <= 10
    if (auction.extensions > this.MAX_EXTENSIONS) return false;

    // If Active, created < end_time
    if (
      auction.state === AuctionState.Active &&
      auction.created >= auction.endTime
    ) {
      return false;
    }

    // Highest bidder != seller
    if (auction.highestBidder === auction.seller) return false;

    // No bid from seller
    if (auction.bids.some((b) => b.bidder === auction.seller)) return false;

    // Highest bid >= starting price (if bids exist)
    if (auction.bids.length > 0 && auction.highestBid < auction.startingPrice) {
      return false;
    }

    // Highest bid is max of all bids
    if (auction.bids.length > 0) {
      const maxBid = Math.max(...auction.bids.map((b) => b.amount));
      if (auction.highestBid !== maxBid) return false;
    }

    return true;
  }
}
