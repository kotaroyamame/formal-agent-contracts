/**
 * RUN 4: Minimal Approach
 * Basic state machine, fewest tests, covers core happy path
 */

export type State = 'Draft' | 'Active' | 'Ended' | 'Paid' | 'Shipped' | 'Completed' | 'Cancelled';

export interface Auction {
  id: string;
  productName: string;
  sellerId: string;
  startPrice: number;
  currentPrice: number;
  endTime: Date;
  state: State;
  highestBidderId: string | null;
  bidCount: number;
}

export interface Bid {
  id: string;
  bidderId: string;
  amount: number;
}

export class SimpleAuctionSystem {
  private auctions = new Map<string, Auction>();
  private bidLists = new Map<string, Bid[]>();
  private counter = 0;

  createAuction(name: string, price: number, minutesDuration: number, sellerId: string): string {
    const id = `a${++this.counter}`;
    this.auctions.set(id, {
      id,
      productName: name,
      sellerId,
      startPrice: price,
      currentPrice: price,
      endTime: new Date(Date.now() + minutesDuration * 60000),
      state: 'Draft',
      highestBidderId: null,
      bidCount: 0,
    });
    this.bidLists.set(id, []);
    return id;
  }

  activate(auctionId: string): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction || auction.state !== 'Draft') return false;
    auction.state = 'Active';
    return true;
  }

  bid(auctionId: string, bidderId: string, amount: number): { ok: boolean } {
    const auction = this.auctions.get(auctionId);
    if (!auction || auction.state !== 'Active') return { ok: false };
    if (bidderId === auction.sellerId) return { ok: false };
    if (new Date() > auction.endTime) return { ok: false };
    if (amount <= auction.currentPrice) return { ok: false };

    const minInc = Math.max(Math.floor(auction.currentPrice * 0.01), 100);
    if (amount < auction.currentPrice + minInc) return { ok: false };

    const bids = this.bidLists.get(auctionId)!;
    bids.push({ id: `b${this.counter}`, bidderId, amount });

    auction.currentPrice = amount;
    auction.highestBidderId = bidderId;
    auction.bidCount = bids.length;

    // 5min extension
    if (auction.endTime.getTime() - new Date().getTime() < 5 * 60000) {
      auction.endTime = new Date(new Date().getTime() + 5 * 60000);
    }

    return { ok: true };
  }

  end(auctionId: string): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction || auction.state !== 'Active') return false;
    if (new Date() <= auction.endTime) return false;

    auction.state = auction.bidCount > 0 ? 'Ended' : 'Cancelled';
    return true;
  }

  pay(auctionId: string, bidderId: string): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction || auction.state !== 'Ended') return false;
    if (auction.highestBidderId !== bidderId) return false;
    auction.state = 'Paid';
    return true;
  }

  ship(auctionId: string): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction || auction.state !== 'Paid') return false;
    auction.state = 'Shipped';
    return true;
  }

  complete(auctionId: string): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction || auction.state !== 'Shipped') return false;
    auction.state = 'Completed';
    return true;
  }

  getAuction(auctionId: string): Auction | null {
    return this.auctions.get(auctionId) || null;
  }
}
