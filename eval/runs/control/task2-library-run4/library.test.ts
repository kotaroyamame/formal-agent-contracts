/**
 * Tests for Library Loan Management System - RUN 4
 * Minimal test coverage focusing on basic operations
 */

import { CatalogAgent, MemberAgent, LoanAgent } from "./library";

describe("Library Loan Management System - RUN 4", () => {
  let catalog: CatalogAgent;
  let members: MemberAgent;
  let loans: LoanAgent;

  beforeEach(() => {
    catalog = new CatalogAgent();
    members = new MemberAgent();
    loans = new LoanAgent(catalog, members);
  });

  it("should add book", () => {
    const id = catalog.addBook("Title", "Author", "一般", 5);
    const book = catalog.getBook(id);
    expect(book?.title).toBe("Title");
  });

  it("should register member", () => {
    const id = members.register("Name");
    const m = members.getMember(id);
    expect(m?.name).toBe("Name");
  });

  it("should borrow book", () => {
    const bid = catalog.addBook("Book", "Auth", "一般", 3);
    const mid = members.register("User");
    const lid = loans.borrow(mid, bid);
    expect(lid).toBeDefined();
  });

  it("should return book", () => {
    const bid = catalog.addBook("Book", "Auth", "一般", 3);
    const mid = members.register("User");
    const lid = loans.borrow(mid, bid);
    const ok = loans.return(lid!);
    expect(ok).toBe(true);
  });

  it("should not borrow out-of-stock book", () => {
    const bid = catalog.addBook("Book", "Auth", "一般", 0);
    const mid = members.register("User");
    const lid = loans.borrow(mid, bid);
    expect(lid).toBeNull();
  });

  it("should not borrow precious book", () => {
    const bid = catalog.addBook("古文", "古人", "貴重", 1);
    const mid = members.register("User");
    const lid = loans.borrow(mid, bid);
    expect(lid).toBeNull();
  });

  it("should extend loan", () => {
    const bid = catalog.addBook("Book", "Auth", "一般", 2);
    const mid = members.register("User");
    const lid = loans.borrow(mid, bid);
    const ok = loans.extend(lid!);
    expect(ok).toBe(true);
  });
});
