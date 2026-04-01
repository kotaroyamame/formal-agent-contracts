// Online Auction System - TypeScript Implementation (Run 4)
// Simpler implementation with key invariant checks

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
}

export interface SimpleAuction {
  auctionId: string;
  sellerId: string;
  startingPrice: number;
  highestBid: number;
  highestBidder: string | null;
  state: AuctionState;
  bids: Bid[];
  endTime: number;
}

export class SimpleAuctionSystem {
  private auctions: Map<string, SimpleAuction> = new Map();

  /**
   * Create auction
   */
  new(
    auctionId: string,
    seller: string,
    price: number,
    endTime: number
  ): string {
    if (price <= 0) {
      throw new Error("Starting price must be positive");
    }
    if (this.auctions.has(auctionId)) {
      throw new Error("Auction ID exists");
    }

    const auction: SimpleAuction = {
      auctionId,
      sellerId: seller,
      startingPrice: price,
      highestBid: 0,
      highestBidder: null,
      state: AuctionState.Draft,
      bids: [],
      endTime,
    };

    this.auctions.set(auctionId, auction);
    return auctionId;
  }

  /**
   * Activate auction
   */
  activate(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Draft) {
      throw new Error("Must be in Draft state");
    }

    auction.state = AuctionState.Active;
    return true;
  }

  /**
   * Place bid with basic validation
   */
  bid(auctionId: string, bidder: string, amount: number): boolean {
    const auction = this.getAuction(auctionId);

    // Preconditions
    if (auction.state !== AuctionState.Active) {
      throw new Error("Must be Active");
    }

    if (bidder === auction.sellerId) {
      throw new Error("Seller cannot bid");
    }

    if (amount <= auction.startingPrice) {
      throw new Error("Bid must be > starting price");
    }

    // Add bid
    const newBid: Bid = {
      bidderId: bidder,
      amount,
    };

    auction.bids.push(newBid);
    auction.highestBid = amount;
    auction.highestBidder = bidder;

    return true;
  }

  /**
   * End auction
   */
  end(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Active) {
      throw new Error("Must be Active");
    }

    auction.state = AuctionState.Ended;
    return true;
  }

  /**
   * Process payment
   */
  pay(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Ended) {
      throw new Error("Must be Ended");
    }

    auction.state = AuctionState.Paid;
    return true;
  }

  /**
   * Ship item
   */
  ship(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Paid) {
      throw new Error("Must be Paid");
    }

    auction.state = AuctionState.Shipped;
    return true;
  }

  /**
   * Complete auction
   */
  complete(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Shipped) {
      throw new Error("Must be Shipped");
    }

    auction.state = AuctionState.Completed;
    return true;
  }

  /**
   * Cancel from Draft
   */
  cancelDraft(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Draft) {
      throw new Error("Must be Draft");
    }

    auction.state = AuctionState.Cancelled;
    return true;
  }

  /**
   * Cancel from Active
   */
  cancelActive(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.state !== AuctionState.Active) {
      throw new Error("Must be Active");
    }

    auction.state = AuctionState.Cancelled;
    return true;
  }

  /**
   * Get auction
   */
  getAuction(auctionId: string): SimpleAuction {
    const auction = this.auctions.get(auctionId);
    if (!auction) {
      throw new Error("Not found");
    }
    return auction;
  }

  /**
   * Verify invariants
   */
  verifyInvariants(auctionId: string): boolean {
    const auction = this.getAuction(auctionId);

    if (auction.startingPrice <= 0) return false;

    if (auction.highestBidder === auction.sellerId) return false;

    if (auction.bids.some((b) => b.bidderId === auction.sellerId)) return false;

    return true;
  }
}
