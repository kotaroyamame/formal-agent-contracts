/**
 * Tests for Library Loan Management System - RUN 2
 * Tests focusing on inheritance-based design
 */

import { CatalogAgent, MemberAgent, LoanAgent } from "./library";

describe("Library Loan Management System - RUN 2", () => {
  let catalogAgent: CatalogAgent;
  let memberAgent: MemberAgent;
  let loanAgent: LoanAgent;

  beforeEach(() => {
    catalogAgent = new CatalogAgent();
    memberAgent = new MemberAgent();
    loanAgent = new LoanAgent(catalogAgent, memberAgent);
  });

  describe("CatalogAgent", () => {
    it("should add a book to catalog", () => {
      const bookId = catalogAgent.addBook(
        "ノルウェイの森",
        "村上春樹",
        "一般",
        3
      );
      expect(bookId).toBeDefined();
      const book = catalogAgent.findBook(bookId);
      expect(book?.title).toBe("ノルウェイの森");
      expect(book?.stock).toBe(3);
    });

    it("should find book by title", () => {
      catalogAgent.addBook("ノルウェイの森", "村上春樹", "一般", 3);
      catalogAgent.addBook("騎士団長殺し", "村上春樹", "一般", 2);

      const results = catalogAgent.findByTitle("ノルウェイ");
      expect(results.length).toBe(1);
      expect(results[0].title).toBe("ノルウェイの森");
    });

    it("should find books by category", () => {
      catalogAgent.addBook("日本大百科事典", "編集部", "参考", 1);
      catalogAgent.addBook("源氏物語", "紫式部", "貴重", 1);
      catalogAgent.addBook("ノルウェイの森", "村上春樹", "一般", 2);

      const refs = catalogAgent.findByCategory("参考");
      expect(refs.length).toBe(1);
    });

    it("should check availability", () => {
      const bookId = catalogAgent.addBook(
        "ノルウェイの森",
        "村上春樹",
        "一般",
        2
      );
      expect(catalogAgent.checkAvailability(bookId)).toBe(true);

      catalogAgent.borrowCopy(bookId);
      catalogAgent.borrowCopy(bookId);
      expect(catalogAgent.checkAvailability(bookId)).toBe(false);
    });

    it("should decrease stock on borrow", () => {
      const bookId = catalogAgent.addBook(
        "ノルウェイの森",
        "村上春樹",
        "一般",
        3
      );
      const success = catalogAgent.borrowCopy(bookId);
      expect(success).toBe(true);
      const book = catalogAgent.findBook(bookId);
      expect(book?.stock).toBe(2);
    });

    it("should not borrow when stock is zero", () => {
      const bookId = catalogAgent.addBook(
        "ノルウェイの森",
        "村上春樹",
        "一般",
        0
      );
      const success = catalogAgent.borrowCopy(bookId);
      expect(success).toBe(false);
    });

    it("should increase stock on return", () => {
      const bookId = catalogAgent.addBook(
        "ノルウェイの森",
        "村上春樹",
        "一般",
        2
      );
      catalogAgent.borrowCopy(bookId);
      const success = catalogAgent.returnCopy(bookId);
      expect(success).toBe(true);
      const book = catalogAgent.findBook(bookId);
      expect(book?.stock).toBe(2);
    });
  });

  describe("MemberAgent", () => {
    it("should register a new member", () => {
      const memberId = memberAgent.registerMember("田中太郎", "tanaka@example.com");
      expect(memberId).toBeDefined();
      const member = memberAgent.findMember(memberId);
      expect(member?.name).toBe("田中太郎");
      expect(member?.email).toBe("tanaka@example.com");
    });

    it("should track current loans", () => {
      const memberId = memberAgent.registerMember("田中太郎", "tanaka@example.com");
      expect(memberAgent.getCurrentLoanCount(memberId)).toBe(0);

      memberAgent.addLoan(memberId, "LOAN1");
      memberAgent.addLoan(memberId, "LOAN2");
      expect(memberAgent.getCurrentLoanCount(memberId)).toBe(2);

      memberAgent.removeLoan(memberId, "LOAN1");
      expect(memberAgent.getCurrentLoanCount(memberId)).toBe(1);
    });

    it("should enforce 5-book limit", () => {
      const memberId = memberAgent.registerMember("田中太郎", "tanaka@example.com");

      for (let i = 1; i <= 5; i++) {
        const success = memberAgent.addLoan(memberId, `LOAN${i}`);
        expect(success).toBe(true);
      }

      const sixthSuccess = memberAgent.addLoan(memberId, "LOAN6");
      expect(sixthSuccess).toBe(false);
    });

    it("should manage overdue status", () => {
      const memberId = memberAgent.registerMember("田中太郎", "tanaka@example.com");
      expect(memberAgent.getOverdueStatus(memberId)).toBe(false);

      memberAgent.setOverdue(memberId, true);
      expect(memberAgent.getOverdueStatus(memberId)).toBe(true);

      memberAgent.setOverdue(memberId, false);
      expect(memberAgent.getOverdueStatus(memberId)).toBe(false);
    });
  });

  describe("LoanAgent - Basic Operations", () => {
    it("should create a loan when borrowing", () => {
      const bookId = catalogAgent.addBook(
        "ノルウェイの森",
        "村上春樹",
        "一般",
        3
      );
      const memberId = memberAgent.registerMember("田中太郎", "tanaka@example.com");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeDefined();

      const loan = loanAgent.getLoan(loanId!);
      expect(loan?.bookId).toBe(bookId);
      expect(loan?.memberId).toBe(memberId);
      expect(loan?.returnedAt).toBeNull();
    });

    it("should prevent borrowing precious books", () => {
      const bookId = catalogAgent.addBook("古文書", "古人", "貴重", 1);
      const memberId = memberAgent.registerMember("田中太郎", "tanaka@example.com");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeNull();
    });

    it("should prevent borrowing when member is overdue", () => {
      const bookId = catalogAgent.addBook(
        "ノルウェイの森",
        "村上春樹",
        "一般",
        3
      );
      const memberId = memberAgent.registerMember("田中太郎", "tanaka@example.com");

      memberAgent.setOverdue(memberId, true);
      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeNull();
    });

    it("should prevent borrowing when no stock available", () => {
      const bookId = catalogAgent.addBook(
        "ノルウェイの森",
        "村上春樹",
        "一般",
        0
      );
      const memberId = memberAgent.registerMember("田中太郎", "tanaka@example.com");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeNull();
    });

    it("should prevent borrowing beyond 5-book limit", () => {
      const memberId = memberAgent.registerMember("田中太郎", "tanaka@example.com");

      for (let i = 0; i < 5; i++) {
        const bookId = catalogAgent.addBook(`Book ${i}`, `Author ${i}`, "一般", 1);
        const loanId = loanAgent.borrowBook(memberId, bookId);
        expect(loanId).toBeDefined();
      }

      const book6Id = catalogAgent.addBook("Book 6", "Author 6", "一般", 1);
      const loan6Id = loanAgent.borrowBook(memberId, book6Id);
      expect(loan6Id).toBeNull();
    });

    it("should return a book", () => {
      const bookId = catalogAgent.addBook(
        "ノルウェイの森",
        "村上春樹",
        "一般",
        2
      );
      const memberId = memberAgent.registerMember("田中太郎", "tanaka@example.com");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      expect(loanId).toBeDefined();

      const returnSuccess = loanAgent.returnBook(loanId!);
      expect(returnSuccess).toBe(true);

      const loan = loanAgent.getLoan(loanId!);
      expect(loan?.returnedAt).not.toBeNull();
      expect(memberAgent.getCurrentLoanCount(memberId)).toBe(0);
    });
  });

  describe("LoanAgent - Extension", () => {
    it("should extend a loan by 7 days", () => {
      const bookId = catalogAgent.addBook(
        "ノルウェイの森",
        "村上春樹",
        "一般",
        3
      );
      const memberId = memberAgent.registerMember("田中太郎", "tanaka@example.com");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      const originalLoan = loanAgent.getLoan(loanId!)!;
      const originalDue = originalLoan.dueDate.getTime();

      const extendSuccess = loanAgent.extendBook(loanId!);
      expect(extendSuccess).toBe(true);

      const extendedLoan = loanAgent.getLoan(loanId!)!;
      expect(extendedLoan.extended).toBe(true);
      expect(extendedLoan.dueDate.getTime()).toBeGreaterThan(originalDue);
    });

    it("should not allow extending twice", () => {
      const bookId = catalogAgent.addBook(
        "ノルウェイの森",
        "村上春樹",
        "一般",
        3
      );
      const memberId = memberAgent.registerMember("田中太郎", "tanaka@example.com");

      const loanId = loanAgent.borrowBook(memberId, bookId);
      loanAgent.extendBook(loanId!);

      const secondExtend = loanAgent.extendBook(loanId!);
      expect(secondExtend).toBe(false);
    });
  });

  describe("LoanAgent - Overdue Detection", () => {
    it("should detect overdue loans and mark member", () => {
      const bookId = catalogAgent.addBook(
        "ノルウェイの森",
        "村上春樹",
        "一般",
        3
      );
      const memberId = memberAgent.registerMember("田中太郎", "tanaka@example.com");

      const loanId = loanAgent.borrowBook(memberId, bookId);

      // Simulate overdue by directly modifying the loan
      const loan = loanAgent.getLoan(loanId!);
      if (loan) {
        loan.dueDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      }

      loanAgent.processOverdueLoans();
      expect(memberAgent.getOverdueStatus(memberId)).toBe(true);
    });
  });
});
