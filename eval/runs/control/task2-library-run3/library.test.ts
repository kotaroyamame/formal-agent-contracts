/**
 * Tests for Library Loan Management System - RUN 3
 * Comprehensive test coverage for modular agent design
 */

import { CatalogAgent, MemberAgent, LoanAgent } from "./library";

describe("Library Loan Management System - RUN 3", () => {
  let catalogAgent: CatalogAgent;
  let memberAgent: MemberAgent;
  let loanAgent: LoanAgent;

  beforeEach(() => {
    catalogAgent = new CatalogAgent();
    memberAgent = new MemberAgent();
    loanAgent = new LoanAgent(catalogAgent, memberAgent);
  });

  describe("CatalogAgent - Book Management", () => {
    it("should register and retrieve a book", () => {
      const bookId = catalogAgent.registerBook(
        "レディプレイヤー1",
        "アーネスト・クライン",
        "一般",
        4
      );
      const book = catalogAgent.getBook(bookId);
      expect(book).not.toBeNull();
      expect(book?.title).toBe("レディプレイヤー1");
      expect(book?.availableCopies).toBe(4);
    });

    it("should search books by title", () => {
      catalogAgent.registerBook(
        "レディプレイヤー1",
        "アーネスト・クライン",
        "一般",
        2
      );
      catalogAgent.registerBook("レディプレイヤー2", "アーネスト・クライン", "一般", 1);
      catalogAgent.registerBook(
        "火星の人",
        "アンディ・ウィアー",
        "一般",
        3
      );

      const results = catalogAgent.searchBooks({ title: "レディ" });
      expect(results.length).toBe(2);
    });

    it("should search books by category", () => {
      catalogAgent.registerBook(
        "日本語辞典",
        "出版社",
        "参考",
        1
      );
      catalogAgent.registerBook("コーラン", "著者", "一般", 1);

      const refs = catalogAgent.searchBooks({ category: "参考" });
      expect(refs.length).toBe(1);
    });

    it("should prevent borrowing precious books", () => {
      const bookId = catalogAgent.registerBook(
        "古事記",
        "古人",
        "貴重",
        1
      );
      const canBorrow = catalogAgent.canBorrow(bookId);
      expect(canBorrow).toBe(false);
    });

    it("should track available copies", () => {
      const bookId = catalogAgent.registerBook(
        "レディプレイヤー1",
        "アーネスト・クライン",
        "一般",
        3
      );
      expect(catalogAgent.getAvailability(bookId)).toBe(3);

      catalogAgent.borrowBook(bookId);
      expect(catalogAgent.getAvailability(bookId)).toBe(2);

      catalogAgent.returnBook(bookId);
      expect(catalogAgent.getAvailability(bookId)).toBe(3);
    });
  });

  describe("MemberAgent - Member Management", () => {
    it("should register and retrieve a member", () => {
      const memberId = memberAgent.registerMember("太郎");
      const member = memberAgent.getMember(memberId);
      expect(member).not.toBeNull();
      expect(member?.name).toBe("太郎");
      expect(member?.status).toBe("active");
    });

    it("should track active loans", () => {
      const memberId = memberAgent.registerMember("太郎");
      memberAgent.addLoan(memberId, "LOAN1");
      memberAgent.addLoan(memberId, "LOAN2");
      expect(memberAgent.getActiveLoanCount(memberId)).toBe(2);

      memberAgent.removeLoan(memberId, "LOAN1");
      expect(memberAgent.getActiveLoanCount(memberId)).toBe(1);
    });

    it("should enforce 5-book limit", () => {
      const memberId = memberAgent.registerMember("太郎");
      for (let i = 1; i <= 5; i++) {
        const success = memberAgent.addLoan(memberId, `LOAN${i}`);
        expect(success).toBe(true);
      }
      const sixthLoan = memberAgent.addLoan(memberId, "LOAN6");
      expect(sixthLoan).toBe(false);
    });

    it("should prevent borrowing when overdue", () => {
      const memberId = memberAgent.registerMember("太郎");
      memberAgent.markOverdue(memberId);
      expect(memberAgent.canBorrow(memberId)).toBe(false);
    });

    it("should mark member as suspended when overdue", () => {
      const memberId = memberAgent.registerMember("太郎");
      memberAgent.markOverdue(memberId);
      const member = memberAgent.getMember(memberId);
      expect(member?.status).toBe("suspended");
    });

    it("should clear overdue status", () => {
      const memberId = memberAgent.registerMember("太郎");
      memberAgent.markOverdue(memberId);
      memberAgent.clearOverdue(memberId);
      const member = memberAgent.getMember(memberId);
      expect(member?.status).toBe("active");
      expect(memberAgent.canBorrow(memberId)).toBe(true);
    });
  });

  describe("LoanAgent - Loan Operations", () => {
    it("should successfully borrow a book", () => {
      const bookId = catalogAgent.registerBook(
        "レディプレイヤー1",
        "アーネスト・クライン",
        "一般",
        2
      );
      const memberId = memberAgent.registerMember("太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeDefined();

      const loan = loanAgent.getLoan(loanId!);
      expect(loan?.memberId).toBe(memberId);
      expect(loan?.bookId).toBe(bookId);
      expect(loan?.status).toBe("active");
    });

    it("should prevent borrowing non-existent book", () => {
      const memberId = memberAgent.registerMember("太郎");
      const loanId = loanAgent.borrowBook(memberId, "NONEXISTENT");
      expect(loanId).toBeNull();
    });

    it("should prevent borrowing when out of stock", () => {
      const bookId = catalogAgent.registerBook(
        "レディプレイヤー1",
        "アーネスト・クライン",
        "一般",
        0
      );
      const memberId = memberAgent.registerMember("太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeNull();
    });

    it("should prevent borrowing precious books", () => {
      const bookId = catalogAgent.registerBook(
        "古事記",
        "古人",
        "貴重",
        1
      );
      const memberId = memberAgent.registerMember("太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeNull();
    });

    it("should prevent overdue members from borrowing", () => {
      const bookId = catalogAgent.registerBook(
        "レディプレイヤー1",
        "アーネスト・クライン",
        "一般",
        2
      );
      const memberId = memberAgent.registerMember("太郎");
      memberAgent.markOverdue(memberId);

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeNull();
    });

    it("should prevent borrowing beyond 5-book limit", () => {
      const memberId = memberAgent.registerMember("太郎");

      for (let i = 0; i < 5; i++) {
        const bookId = catalogAgent.registerBook(`Book ${i}`, `Author ${i}`, "一般", 1);
        const loanId = loanAgent.borrowBook(memberId, bookId);
        expect(loanId).toBeDefined();
      }

      const book6Id = catalogAgent.registerBook("Book 6", "Author 6", "一般", 1);
      const loan6Id = loanAgent.borrowBook(memberId, book6Id);
      expect(loan6Id).toBeNull();
    });

    it("should successfully return a book", () => {
      const bookId = catalogAgent.registerBook(
        "レディプレイヤー1",
        "アーネスト・クライン",
        "一般",
        2
      );
      const memberId = memberAgent.registerMember("太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(catalogAgent.getAvailability(bookId)).toBe(1);

      const returnSuccess = loanAgent.returnBook(loanId!);
      expect(returnSuccess).toBe(true);

      const loan = loanAgent.getLoan(loanId!);
      expect(loan?.status).toBe("returned");
      expect(loan?.returnDate).not.toBeNull();
      expect(catalogAgent.getAvailability(bookId)).toBe(2);
    });
  });

  describe("LoanAgent - Extension", () => {
    it("should extend a loan by 7 days", () => {
      const bookId = catalogAgent.registerBook(
        "レディプレイヤー1",
        "アーネスト・クライン",
        "一般",
        2
      );
      const memberId = memberAgent.registerMember("太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      const loan1 = loanAgent.getLoan(loanId!);
      const originalDue = loan1!.dueDate.getTime();

      const extendSuccess = loanAgent.extendBook(loanId!);
      expect(extendSuccess).toBe(true);

      const loan2 = loanAgent.getLoan(loanId!);
      expect(loan2?.extensionCount).toBe(1);
      expect(loan2?.dueDate.getTime()).toBeGreaterThan(originalDue);
    });

    it("should only allow extending once", () => {
      const bookId = catalogAgent.registerBook(
        "レディプレイヤー1",
        "アーネスト・クライン",
        "一般",
        2
      );
      const memberId = memberAgent.registerMember("太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      loanAgent.extendBook(loanId!);

      const secondExtend = loanAgent.extendBook(loanId!);
      expect(secondExtend).toBe(false);
    });
  });

  describe("LoanAgent - Overdue Detection", () => {
    it("should detect and mark overdue loans", () => {
      const bookId = catalogAgent.registerBook(
        "レディプレイヤー1",
        "アーネスト・クライン",
        "一般",
        2
      );
      const memberId = memberAgent.registerMember("太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      const loan = loanAgent.getLoan(loanId!);

      // Move due date to past
      if (loan) {
        loan.dueDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      }

      loanAgent.detectOverdueLoans();

      const updatedLoan = loanAgent.getLoan(loanId!);
      expect(updatedLoan?.status).toBe("overdue");

      const member = memberAgent.getMember(memberId);
      expect(member?.status).toBe("suspended");
    });

    it("should mark member as overdue with count", () => {
      const bookId1 = catalogAgent.registerBook(
        "Book 1",
        "Author 1",
        "一般",
        1
      );
      const bookId2 = catalogAgent.registerBook(
        "Book 2",
        "Author 2",
        "一般",
        1
      );
      const memberId = memberAgent.registerMember("太郎");

      const loanId1 = loanAgent.borrowBook(memberId, bookId1);
      const loanId2 = loanAgent.borrowBook(memberId, bookId2);

      // Make both overdue
      [loanId1, loanId2].forEach((lid) => {
        const loan = loanAgent.getLoan(lid!);
        if (loan) {
          loan.dueDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
        }
      });

      loanAgent.detectOverdueLoans();

      const member = memberAgent.getMember(memberId);
      expect(member?.overdueCount).toBe(1); // Marked once per detectOverdueLoans call
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete borrow-return cycle", () => {
      const bookId = catalogAgent.registerBook(
        "レディプレイヤー1",
        "アーネスト・クライン",
        "一般",
        3
      );
      const memberId = memberAgent.registerMember("太郎");

      // Borrow
      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeDefined();
      expect(catalogAgent.getAvailability(bookId)).toBe(2);
      expect(memberAgent.getActiveLoanCount(memberId)).toBe(1);

      // Return
      const returnSuccess = loanAgent.returnBook(loanId!);
      expect(returnSuccess).toBe(true);
      expect(catalogAgent.getAvailability(bookId)).toBe(3);
      expect(memberAgent.getActiveLoanCount(memberId)).toBe(0);
    });

    it("should handle multiple borrows and returns", () => {
      const memberId = memberAgent.registerMember("太郎");
      const loanIds: string[] = [];

      for (let i = 0; i < 3; i++) {
        const bookId = catalogAgent.registerBook(
          `Book ${i}`,
          `Author ${i}`,
          "一般",
          1
        );
        const loanId = loanAgent.borrowBook(memberId, bookId);
        expect(loanId).toBeDefined();
        loanIds.push(loanId!);
      }

      expect(memberAgent.getActiveLoanCount(memberId)).toBe(3);

      // Return first loan
      loanAgent.returnBook(loanIds[0]);
      expect(memberAgent.getActiveLoanCount(memberId)).toBe(2);

      // Borrow another book
      const newBookId = catalogAgent.registerBook(
        "New Book",
        "New Author",
        "一般",
        1
      );
      const newLoanId = loanAgent.borrowBook(memberId, newBookId);
      expect(newLoanId).toBeDefined();
      expect(memberAgent.getActiveLoanCount(memberId)).toBe(3);
    });
  });
});
