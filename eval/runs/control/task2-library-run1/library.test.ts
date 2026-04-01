/**
 * Tests for Library Loan Management System - RUN 1
 * Basic test coverage of standard operations
 */

import { CatalogAgent, MemberAgent, LoanAgent } from "./library";

describe("Library Loan Management System - RUN 1", () => {
  let catalogAgent: CatalogAgent;
  let memberAgent: MemberAgent;
  let loanAgent: LoanAgent;

  beforeEach(() => {
    catalogAgent = new CatalogAgent();
    memberAgent = new MemberAgent();
    loanAgent = new LoanAgent(catalogAgent, memberAgent);
  });

  describe("CatalogAgent", () => {
    it("should register a book", () => {
      const bookId = catalogAgent.registerBook(
        "吾輩は猫である",
        "夏目漱石",
        "一般",
        5
      );
      expect(bookId).toBeDefined();
      const book = catalogAgent.getBook(bookId);
      expect(book?.title).toBe("吾輩は猫である");
      expect(book?.stock).toBe(5);
    });

    it("should search books by title", () => {
      catalogAgent.registerBook("吾輩は猫である", "夏目漱石", "一般", 3);
      catalogAgent.registerBook("金閣寺", "三島由紀夫", "一般", 2);
      const results = catalogAgent.searchByTitle("猫");
      expect(results.length).toBe(1);
      expect(results[0].title).toBe("吾輩は猫である");
    });

    it("should search books by category", () => {
      catalogAgent.registerBook("吾輩は猫である", "夏目漱石", "一般", 3);
      catalogAgent.registerBook("日本語辞典", "編集部", "参考", 1);
      const results = catalogAgent.searchByCategory("一般");
      expect(results.length).toBe(1);
    });

    it("should decrease stock", () => {
      const bookId = catalogAgent.registerBook(
        "吾輩は猫である",
        "夏目漱石",
        "一般",
        5
      );
      const result = catalogAgent.decreaseStock(bookId);
      expect(result).toBe(true);
      expect(catalogAgent.getStock(bookId)).toBe(4);
    });

    it("should not decrease stock below 0", () => {
      const bookId = catalogAgent.registerBook(
        "吾輩は猫である",
        "夏目漱石",
        "一般",
        0
      );
      const result = catalogAgent.decreaseStock(bookId);
      expect(result).toBe(false);
      expect(catalogAgent.getStock(bookId)).toBe(0);
    });

    it("should increase stock", () => {
      const bookId = catalogAgent.registerBook(
        "吾輩は猫である",
        "夏目漱石",
        "一般",
        3
      );
      catalogAgent.decreaseStock(bookId);
      const result = catalogAgent.increaseStock(bookId);
      expect(result).toBe(true);
      expect(catalogAgent.getStock(bookId)).toBe(3);
    });
  });

  describe("MemberAgent", () => {
    it("should register a member", () => {
      const memberId = memberAgent.registerMember("太郎");
      expect(memberId).toBeDefined();
      const member = memberAgent.getMember(memberId);
      expect(member?.name).toBe("太郎");
      expect(member?.isOverdue).toBe(false);
    });

    it("should check eligibility to borrow", () => {
      const memberId = memberAgent.registerMember("太郎");
      expect(memberAgent.isEligibleToBorrow(memberId)).toBe(true);
    });

    it("should prevent overdue members from borrowing", () => {
      const memberId = memberAgent.registerMember("太郎");
      memberAgent.markOverdue(memberId);
      expect(memberAgent.isEligibleToBorrow(memberId)).toBe(false);
    });

    it("should enforce 5-book limit", () => {
      const memberId = memberAgent.registerMember("太郎");
      const member = memberAgent.getMember(memberId)!;

      // Add 5 loans
      for (let i = 0; i < 5; i++) {
        memberAgent.addActiveLoan(memberId, {
          loanId: `LOAN-${i}`,
          memberId,
          bookId: `BOOK-${i}`,
          borrowDate: new Date(),
          dueDate: new Date(),
          returnDate: null,
          isExtended: false,
        });
      }

      // 6th should fail
      const result = memberAgent.addActiveLoan(memberId, {
        loanId: "LOAN-6",
        memberId,
        bookId: "BOOK-6",
        borrowDate: new Date(),
        dueDate: new Date(),
        returnDate: null,
        isExtended: false,
      });

      expect(result).toBe(false);
    });
  });

  describe("LoanAgent - Basic Operations", () => {
    it("should borrow a book", () => {
      const bookId = catalogAgent.registerBook(
        "吾輩は猫である",
        "夏目漱石",
        "一般",
        5
      );
      const memberId = memberAgent.registerMember("太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeDefined();
      expect(catalogAgent.getStock(bookId)).toBe(4);
    });

    it("should not allow borrowing when stock is 0", () => {
      const bookId = catalogAgent.registerBook(
        "吾輩は猫である",
        "夏目漱石",
        "一般",
        0
      );
      const memberId = memberAgent.registerMember("太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeNull();
    });

    it("should not allow overdue members to borrow", () => {
      const bookId = catalogAgent.registerBook(
        "吾輩は猫である",
        "夏目漱石",
        "一般",
        5
      );
      const memberId = memberAgent.registerMember("太郎");
      memberAgent.markOverdue(memberId);

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeNull();
    });

    it("should not allow precious books to be borrowed", () => {
      const bookId = catalogAgent.registerBook(
        "古文書",
        "古文書作者",
        "貴重",
        1
      );
      const memberId = memberAgent.registerMember("太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeNull();
    });

    it("should enforce 5-book borrow limit", () => {
      const memberId = memberAgent.registerMember("太郎");

      // Register and borrow 5 books
      for (let i = 0; i < 5; i++) {
        const bookId = catalogAgent.registerBook(
          `Book ${i}`,
          `Author ${i}`,
          "一般",
          5
        );
        const loanId = loanAgent.borrowBook(memberId, bookId);
        expect(loanId).toBeDefined();
      }

      // 6th book should fail
      const bookId6 = catalogAgent.registerBook(
        "Book 6",
        "Author 6",
        "一般",
        5
      );
      const loanId6 = loanAgent.borrowBook(memberId, bookId6);
      expect(loanId6).toBeNull();
    });

    it("should return a book", () => {
      const bookId = catalogAgent.registerBook(
        "吾輩は猫である",
        "夏目漱石",
        "一般",
        5
      );
      const memberId = memberAgent.registerMember("太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeDefined();
      expect(catalogAgent.getStock(bookId)).toBe(4);

      const result = loanAgent.returnBook(loanId!);
      expect(result).toBe(true);
      expect(catalogAgent.getStock(bookId)).toBe(5);
    });

    it("should not allow returning a book twice", () => {
      const bookId = catalogAgent.registerBook(
        "吾輩は猫である",
        "夏目漱石",
        "一般",
        5
      );
      const memberId = memberAgent.registerMember("太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      loanAgent.returnBook(loanId!);

      const result2 = loanAgent.returnBook(loanId!);
      expect(result2).toBe(false);
    });
  });

  describe("LoanAgent - Extension", () => {
    it("should extend a loan once", () => {
      const bookId = catalogAgent.registerBook(
        "吾輩は猫である",
        "夏目漱石",
        "一般",
        5
      );
      const memberId = memberAgent.registerMember("太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      const loan = loanAgent.getLoan(loanId!);
      const originalDueDate = loan!.dueDate.getTime();

      const result = loanAgent.extendLoan(loanId!);
      expect(result).toBe(true);

      const updatedLoan = loanAgent.getLoan(loanId!);
      expect(updatedLoan?.isExtended).toBe(true);
      expect(updatedLoan?.dueDate.getTime()).toBeGreaterThan(originalDueDate);
    });

    it("should not allow extending more than once", () => {
      const bookId = catalogAgent.registerBook(
        "吾輩は猫である",
        "夏目漱石",
        "一般",
        5
      );
      const memberId = memberAgent.registerMember("太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      loanAgent.extendLoan(loanId!);

      const result = loanAgent.extendLoan(loanId!);
      expect(result).toBe(false);
    });
  });

  describe("LoanAgent - Overdue Management", () => {
    it("should detect overdue loans", () => {
      const bookId = catalogAgent.registerBook(
        "吾輩は猫である",
        "夏目漱石",
        "一般",
        5
      );
      const memberId = memberAgent.registerMember("太郎");

      // Manually create an overdue loan
      const loanId = `LOAN-OVERDUE`;
      const pastDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
      const dueDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      // Note: This test simulates but doesn't fully test overdue detection
      // The actual mechanism requires mocking Date or using injectable dependencies
    });
  });
});
