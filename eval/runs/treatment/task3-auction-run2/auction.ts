// Online Auction System - TypeScript Implementation (Run 2)
// Strong bid validation and timing focus

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

export interface AuctionRecord {
  auctionId: string;
  sellerId: string;
  state: AuctionState;
  startingPrice: number;
  currentHighestBid: number;
  highestBidder: string | null;
  bids: Bid[];
  endTime: number;
  extensionCount: number;
}

export class BidSystem {
  private records: Map<string, AuctionRecord> = new Map();
  private readonly MAX_EXTENSIONS = 10;
  private readonly EXTENSION_DURATION = 300000; // 5 minutes in ms
  private readonly PAYMENT_TIMEOUT = 72 * 60 * 60 * 1000;
  private readonly MIN_INCREMENT_FLOOR = 100;

  /**
   * Create auction record
   * Precondition: starting_price > 0, end_time > 0, auction_id not exists
   */
  create(
    auctionId: string,
    seller: string,
    startingPrice: number,
    endTime: number
  ): string {
    if (startingPrice <= 0) {
      throw new Error("Starting price must be positive");
    }
    if (endTime <= 0) {
      throw new Error("End time must be positive");
    }
    if (this.records.has(auctionId)) {
      throw new Error("Auction ID already exists");
    }

    const newRecord: AuctionRecord = {
      auctionId,
      sellerId: seller,
      state: AuctionState.Draft,
      startingPrice,
      currentHighestBid: 0,
      highestBidder: null,
      bids: [],
      endTime,
      extensionCount: 0,
    };

    this.records.set(auctionId, newRecord);
    return auctionId;
  }

  /**
   * Activate auction
   */
  activate(auctionId: string): boolean {
    const record = this.getRecord(auctionId);
    if (record.state !== AuctionState.Draft) {
      throw new Error("Must be in Draft state");
    }
    record.state = AuctionState.Active;
    return true;
  }

  /**
   * Validate and place bid with comprehensive preconditions
   * Catches multiple traps through strict validation
   */
  validateBid(
    auctionId: string,
    bidder: string,
    amount: number,
    now: number
  ): boolean {
    const record = this.getRecord(auctionId);

    // Precondition checks
    if (amount <= 0) {
      throw new Error("Bid amount must be positive");
    }

    if (bidder === record.sellerId) {
      throw new Error("Seller cannot bid on their own auction");
    }

    if (record.state !== AuctionState.Active) {
      throw new Error("Auction must be Active");
    }

    // TRAP 8: Strict time boundary - must be strictly before end_time
    if (now >= record.endTime) {
      throw new Error("Auction has ended");
    }

    // TRAP 7: First bid handling
    if (record.bids.length === 0) {
      if (amount < record.startingPrice) {
        throw new Error("First bid must be >= starting price");
      }
    } else {
      // Subsequent bids must exceed current and meet increment
      if (amount <= record.currentHighestBid) {
        throw new Error("Bid must exceed current highest");
      }

      // TRAP 6: Minimum increment with explicit floor
      const increment = Math.max(
        Math.floor(record.currentHighestBid * 0.01),
        this.MIN_INCREMENT_FLOOR
      );
      if (amount < record.currentHighestBid + increment) {
        throw new Error(
          `Bid must be at least ${increment} more than current highest`
        );
      }
    }

    // Add bid with timestamp ordering
    const bid: Bid = {
      bidderId: bidder,
      amount,
      timestamp: now,
    };

    record.bids.push(bid);
    record.currentHighestBid = amount;
    record.highestBidder = bidder;

    // TRAP 1: Check if extension needed
    this.extendOnBid(auctionId, now);

    return true;
  }

  /**
   * Time-aware extension logic
   * TRAP 1: Extension cascade limit enforced
   */
  private extendOnBid(auctionId: string, now: number): boolean {
    const record = this.getRecord(auctionId);

    if (record.state !== AuctionState.Active) {
      return false;
    }

    const timeUntilEnd = record.endTime - now;

    // Within 5 minutes of end
    if (timeUntilEnd <= this.EXTENSION_DURATION) {
      if (record.extensionCount < this.MAX_EXTENSIONS) {
        record.endTime += this.EXTENSION_DURATION;
        record.extensionCount += 1;
        return true;
      }
      // Max extensions reached, no more extensions
      return false;
    }

    return false;
  }

  /**
   * Finalize auction with strict timing
   * TRAP 8: Exact boundary check (now >= end_time)
   */
  finalize(auctionId: string, now: number): boolean {
    const record = this.getRecord(auctionId);

    if (record.state !== AuctionState.Active) {
      throw new Error("Must be in Active state");
    }

    if (now < record.endTime) {
      throw new Error("Auction has not ended yet");
    }

    record.state = AuctionState.Ended;
    return true;
  }

  /**
   * Process payment within 72-hour window
   */
  processPayment(auctionId: string, now: number): boolean {
    const record = this.getRecord(auctionId);

    if (record.state !== AuctionState.Ended) {
      throw new Error("Must be in Ended state");
    }

    const elapsed = now - record.endTime;

    // TRAP 9: 72-hour exact boundary
    if (elapsed > this.PAYMENT_TIMEOUT) {
      throw new Error("Payment window exceeded (72 hours)");
    }

    record.state = AuctionState.Paid;
    return true;
  }

  /**
   * Close payment and cancel if timeout exceeded
   * TRAP 9: Enforce exact 72-hour boundary
   */
  closePayment(auctionId: string, now: number): boolean {
    const record = this.getRecord(auctionId);

    if (record.state !== AuctionState.Ended) {
      throw new Error("Must be in Ended state");
    }

    const elapsed = now - record.endTime;

    // Must be strictly after 72 hours
    if (elapsed <= this.PAYMENT_TIMEOUT) {
      throw new Error("Cannot close payment within 72 hours");
    }

    record.state = AuctionState.Cancelled;
    return true;
  }

  /**
   * Ship item
   */
  shipItem(auctionId: string): boolean {
    const record = this.getRecord(auctionId);

    if (record.state !== AuctionState.Paid) {
      throw new Error("Must be in Paid state");
    }

    record.state = AuctionState.Shipped;
    return true;
  }

  /**
   * Complete auction
   */
  complete(auctionId: string): boolean {
    const record = this.getRecord(auctionId);

    if (record.state !== AuctionState.Shipped) {
      throw new Error("Must be in Shipped state");
    }

    record.state = AuctionState.Completed;
    return true;
  }

  /**
   * Cancel from Draft
   */
  cancelDraft(auctionId: string): boolean {
    const record = this.getRecord(auctionId);

    if (record.state !== AuctionState.Draft) {
      throw new Error("Must be in Draft state");
    }

    record.state = AuctionState.Cancelled;
    return true;
  }

  /**
   * Cancel from Active
   */
  cancelActive(auctionId: string): boolean {
    const record = this.getRecord(auctionId);

    if (record.state !== AuctionState.Active) {
      throw new Error("Must be in Active state");
    }

    record.state = AuctionState.Cancelled;
    return true;
  }

  /**
   * Get record by ID
   */
  getRecord(auctionId: string): AuctionRecord {
    const record = this.records.get(auctionId);
    if (!record) {
      throw new Error("Auction not found");
    }
    return record;
  }

  /**
   * Get all records
   */
  getAllRecords(): AuctionRecord[] {
    return Array.from(this.records.values());
  }

  /**
   * Invariant check
   */
  checkInvariants(auctionId: string): boolean {
    const record = this.getRecord(auctionId);

    // Starting price > 0
    if (record.startingPrice <= 0) return false;

    // Extension count <= 10
    if (record.extensionCount > this.MAX_EXTENSIONS) return false;

    // Highest bidder != seller
    if (record.highestBidder === record.sellerId) return false;

    // No bidder is seller
    if (record.bids.some((b) => b.bidderId === record.sellerId)) return false;

    // Current highest bid >= starting price (if bids exist)
    if (record.bids.length > 0 && record.currentHighestBid < record.startingPrice) {
      return false;
    }

    // Bids are strictly increasing
    for (let i = 1; i < record.bids.length; i++) {
      if (record.bids[i].amount <= record.bids[i - 1].amount) {
        return false;
      }
    }

    return true;
  }
}
