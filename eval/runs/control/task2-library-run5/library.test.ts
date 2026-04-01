/**
 * Tests for Library Loan Management System - RUN 5
 * Comprehensive test coverage with edge case focus
 */

import { CatalogAgent, MemberAgent, LoanAgent } from "./library";

describe("Library Loan Management System - RUN 5", () => {
  let catalogAgent: CatalogAgent;
  let memberAgent: MemberAgent;
  let loanAgent: LoanAgent;

  beforeEach(() => {
    catalogAgent = new CatalogAgent();
    memberAgent = new MemberAgent();
    loanAgent = new LoanAgent(catalogAgent, memberAgent);
  });

  describe("CatalogAgent - Book Registration and Search", () => {
    it("should register a book with valid parameters", () => {
      const bookId = catalogAgent.registerBook(
        "春のソナタ",
        "村上春樹",
        "一般",
        5
      );
      expect(bookId).toBeDefined();
      const book = catalogAgent.getBook(bookId);
      expect(book?.title).toBe("春のソナタ");
      expect(book?.author).toBe("村上春樹");
      expect(book?.category).toBe("一般");
      expect(book?.totalCopies).toBe(5);
    });

    it("should reject negative stock", () => {
      expect(() => {
        catalogAgent.registerBook("Book", "Author", "一般", -1);
      }).toThrow();
    });

    it("should search books by title", () => {
      catalogAgent.registerBook("春のソナタ", "村上春樹", "一般", 3);
      catalogAgent.registerBook("秋の手紙", "別著者", "一般", 2);
      const results = catalogAgent.searchByTitle("春");
      expect(results.length).toBe(1);
      expect(results[0].title).toBe("春のソナタ");
    });

    it("should search books by category", () => {
      catalogAgent.registerBook("一般書", "著者", "一般", 2);
      catalogAgent.registerBook("参考書", "著者", "参考", 1);
      catalogAgent.registerBook("古書", "著者", "貴重", 1);

      const general = catalogAgent.searchByCategory("一般");
      expect(general.length).toBe(1);

      const reference = catalogAgent.searchByCategory("参考");
      expect(reference.length).toBe(1);

      const precious = catalogAgent.searchByCategory("貴重");
      expect(precious.length).toBe(1);
    });

    it("should track available copies correctly", () => {
      const bookId = catalogAgent.registerBook(
        "春のソナタ",
        "村上春樹",
        "一般",
        3
      );
      expect(catalogAgent.getAvailableCount(bookId)).toBe(3);

      catalogAgent.reserveBook(bookId);
      expect(catalogAgent.getAvailableCount(bookId)).toBe(2);

      catalogAgent.releaseBook(bookId);
      expect(catalogAgent.getAvailableCount(bookId)).toBe(3);
    });

    it("should prevent reserving beyond total copies", () => {
      const bookId = catalogAgent.registerBook(
        "春のソナタ",
        "村上春樹",
        "一般",
        1
      );
      catalogAgent.reserveBook(bookId);
      const result = catalogAgent.reserveBook(bookId);
      expect(result).toBe(false);
    });
  });

  describe("MemberAgent - Member Registration and Management", () => {
    it("should register a member", () => {
      const memberId = memberAgent.registerMember("田中太郎");
      expect(memberId).toBeDefined();
      const member = memberAgent.getMember(memberId);
      expect(member?.name).toBe("田中太郎");
      expect(member?.status).toBe("active");
    });

    it("should reject empty member name", () => {
      expect(() => {
        memberAgent.registerMember("");
      }).toThrow();
    });

    it("should track active loans", () => {
      const memberId = memberAgent.registerMember("田中太郎");
      memberAgent.addLoan(memberId, "LOAN1");
      memberAgent.addLoan(memberId, "LOAN2");
      expect(memberAgent.getActiveLoanCount(memberId)).toBe(2);

      memberAgent.removeLoan(memberId, "LOAN1");
      expect(memberAgent.getActiveLoanCount(memberId)).toBe(1);
    });

    it("should enforce 5-book limit strictly", () => {
      const memberId = memberAgent.registerMember("田中太郎");
      for (let i = 1; i <= 5; i++) {
        const success = memberAgent.addLoan(memberId, `LOAN${i}`);
        expect(success).toBe(true);
      }
      const sixthLoan = memberAgent.addLoan(memberId, "LOAN6");
      expect(sixthLoan).toBe(false);
    });

    it("should mark member suspended when overdue", () => {
      const memberId = memberAgent.registerMember("田中太郎");
      expect(memberAgent.canBorrow(memberId)).toBe(true);

      memberAgent.markOverdue(memberId);
      const member = memberAgent.getMember(memberId);
      expect(member?.status).toBe("suspended");
      expect(memberAgent.canBorrow(memberId)).toBe(false);
    });

    it("should clear overdue status when no active loans", () => {
      const memberId = memberAgent.registerMember("田中太郎");
      memberAgent.markOverdue(memberId);
      memberAgent.clearOverdueStatus(memberId);

      const member = memberAgent.getMember(memberId);
      expect(member?.status).toBe("active");
      expect(member?.overdueCount).toBe(0);
    });
  });

  describe("LoanAgent - Core Borrowing Operations", () => {
    it("should successfully borrow a book", () => {
      const bookId = catalogAgent.registerBook(
        "春のソナタ",
        "村上春樹",
        "一般",
        3
      );
      const memberId = memberAgent.registerMember("田中太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeDefined();
      expect(catalogAgent.getAvailableCount(bookId)).toBe(2);
      expect(memberAgent.getActiveLoanCount(memberId)).toBe(1);
    });

    it("should prevent borrowing non-existent book", () => {
      const memberId = memberAgent.registerMember("田中太郎");
      const loanId = loanAgent.borrowBook(memberId, "NONEXISTENT");
      expect(loanId).toBeNull();
    });

    it("should prevent borrowing from non-existent member", () => {
      const bookId = catalogAgent.registerBook(
        "春のソナタ",
        "村上春樹",
        "一般",
        3
      );
      const loanId = loanAgent.borrowBook("NONEXISTENT", bookId);
      expect(loanId).toBeNull();
    });

    it("should prevent borrowing out-of-stock book", () => {
      const bookId = catalogAgent.registerBook(
        "春のソナタ",
        "村上春樹",
        "一般",
        0
      );
      const memberId = memberAgent.registerMember("田中太郎");
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
      const memberId = memberAgent.registerMember("田中太郎");
      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeNull();
    });

    it("should prevent overdue members from borrowing", () => {
      const bookId = catalogAgent.registerBook(
        "春のソナタ",
        "村上春樹",
        "一般",
        3
      );
      const memberId = memberAgent.registerMember("田中太郎");
      memberAgent.markOverdue(memberId);

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeNull();
    });

    it("should prevent borrowing beyond 5-book limit", () => {
      const memberId = memberAgent.registerMember("田中太郎");

      for (let i = 0; i < 5; i++) {
        const bookId = catalogAgent.registerBook(`Book ${i}`, `Author ${i}`, "一般", 1);
        const loanId = loanAgent.borrowBook(memberId, bookId);
        expect(loanId).toBeDefined();
      }

      const book6Id = catalogAgent.registerBook("Book 6", "Author 6", "一般", 1);
      const loan6Id = loanAgent.borrowBook(memberId, book6Id);
      expect(loan6Id).toBeNull();
    });

    it("should correctly count 5-book limit boundary", () => {
      const memberId = memberAgent.registerMember("田中太郎");
      const loanIds: string[] = [];

      for (let i = 0; i < 5; i++) {
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

      expect(memberAgent.getActiveLoanCount(memberId)).toBe(5);

      // Return one book
      loanAgent.returnBook(loanIds[0]);
      expect(memberAgent.getActiveLoanCount(memberId)).toBe(4);

      // Should now be able to borrow again
      const newBookId = catalogAgent.registerBook(
        "New Book",
        "New Author",
        "一般",
        1
      );
      const newLoanId = loanAgent.borrowBook(memberId, newBookId);
      expect(newLoanId).toBeDefined();
      expect(memberAgent.getActiveLoanCount(memberId)).toBe(5);
    });
  });

  describe("LoanAgent - Return Operations", () => {
    it("should successfully return a book", () => {
      const bookId = catalogAgent.registerBook(
        "春のソナタ",
        "村上春樹",
        "一般",
        2
      );
      const memberId = memberAgent.registerMember("田中太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(catalogAgent.getAvailableCount(bookId)).toBe(1);

      const returnSuccess = loanAgent.returnBook(loanId!);
      expect(returnSuccess).toBe(true);
      expect(catalogAgent.getAvailableCount(bookId)).toBe(2);
      expect(memberAgent.getActiveLoanCount(memberId)).toBe(0);
    });

    it("should not allow returning same book twice", () => {
      const bookId = catalogAgent.registerBook(
        "春のソナタ",
        "村上春樹",
        "一般",
        2
      );
      const memberId = memberAgent.registerMember("田中太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      loanAgent.returnBook(loanId!);

      const secondReturn = loanAgent.returnBook(loanId!);
      expect(secondReturn).toBe(false);
    });
  });

  describe("LoanAgent - Extension Operations", () => {
    it("should extend a loan by 7 days", () => {
      const bookId = catalogAgent.registerBook(
        "春のソナタ",
        "村上春樹",
        "一般",
        2
      );
      const memberId = memberAgent.registerMember("田中太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      const loan1 = loanAgent.getLoan(loanId!);
      const originalDue = loan1!.dueDate.getTime();

      const extendSuccess = loanAgent.extendLoan(loanId!);
      expect(extendSuccess).toBe(true);

      const loan2 = loanAgent.getLoan(loanId!);
      expect(loan2?.extensionCount).toBe(1);
      expect(loan2?.dueDate.getTime()).toBe(originalDue + 7 * 24 * 60 * 60 * 1000);
    });

    it("should only allow one extension", () => {
      const bookId = catalogAgent.registerBook(
        "春のソナタ",
        "村上春樹",
        "一般",
        2
      );
      const memberId = memberAgent.registerMember("田中太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      const firstExtend = loanAgent.extendLoan(loanId!);
      expect(firstExtend).toBe(true);

      const secondExtend = loanAgent.extendLoan(loanId!);
      expect(secondExtend).toBe(false);
    });

    it("should not extend a returned loan", () => {
      const bookId = catalogAgent.registerBook(
        "春のソナタ",
        "村上春樹",
        "一般",
        2
      );
      const memberId = memberAgent.registerMember("田中太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      loanAgent.returnBook(loanId!);

      const extendSuccess = loanAgent.extendLoan(loanId!);
      expect(extendSuccess).toBe(false);
    });
  });

  describe("LoanAgent - Overdue Detection", () => {
    it("should detect overdue loans", () => {
      const bookId = catalogAgent.registerBook(
        "春のソナタ",
        "村上春樹",
        "一般",
        2
      );
      const memberId = memberAgent.registerMember("田中太郎");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      const loan = loanAgent.getLoan(loanId!);

      // Set due date to past
      if (loan) {
        loan.dueDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      }

      loanAgent.detectAndMarkOverdueLoans();

      const member = memberAgent.getMember(memberId);
      expect(member?.status).toBe("suspended");
      expect(member?.overdueCount).toBe(1);
    });

    it("should track multiple overdue loans", () => {
      const memberId = memberAgent.registerMember("田中太郎");

      for (let i = 0; i < 3; i++) {
        const bookId = catalogAgent.registerBook(
          `Book ${i}`,
          `Author ${i}`,
          "一般",
          1
        );
        const loanId = loanAgent.borrowBook(memberId, bookId);
        const loan = loanAgent.getLoan(loanId!);
        if (loan) {
          loan.dueDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
        }
      }

      loanAgent.detectAndMarkOverdueLoans();

      const member = memberAgent.getMember(memberId);
      expect(member?.status).toBe("suspended");
    });
  });

  describe("Integration - Complete Lifecycle", () => {
    it("should handle borrow-return-borrow cycle", () => {
      const bookId = catalogAgent.registerBook(
        "春のソナタ",
        "村上春樹",
        "一般",
        2
      );
      const memberId = memberAgent.registerMember("田中太郎");

      // First borrow
      const loan1Id = loanAgent.borrowBook(memberId, bookId);
      expect(loan1Id).toBeDefined();
      expect(catalogAgent.getAvailableCount(bookId)).toBe(1);

      // Return
      loanAgent.returnBook(loan1Id!);
      expect(catalogAgent.getAvailableCount(bookId)).toBe(2);

      // Second borrow
      const loan2Id = loanAgent.borrowBook(memberId, bookId);
      expect(loan2Id).toBeDefined();
      expect(catalogAgent.getAvailableCount(bookId)).toBe(1);
    });

    it("should handle multiple simultaneous loans", () => {
      const memberId = memberAgent.registerMember("田中太郎");
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

      // Return middle loan
      loanAgent.returnBook(loanIds[1]);
      expect(memberAgent.getActiveLoanCount(memberId)).toBe(2);

      // Borrow new book
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
