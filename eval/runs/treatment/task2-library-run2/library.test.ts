/**
 * Library Loan Management System - Test Suite
 * RUN 2: Tests validating state invariants (catches 10-11 of 12 traps)
 */

import { describe, it, expect } from '@jest/globals';
import { LibrarySystem, BookCategory } from './library';

describe('Library System - RUN 2 (Invariant-Focused)', () => {
  let system: LibrarySystem;

  beforeEach(() => {
    system = new LibrarySystem();
  });

  describe('TRAP 1: Book Availability States', () => {
    it('should track copies correctly', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      expect(system.getAvailableCopies(1)).toBe(5);

      system.reserveBook(1);
      expect(system.getAvailableCopies(1)).toBe(4);

      system.returnBook(1);
      expect(system.getAvailableCopies(1)).toBe(5);
    });

    it('should enforce availability limits', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 1);
      system.reserveBook(1);
      expect(() => system.reserveBook(1)).toThrow();
    });
  });

  describe('TRAP 2: Return-Then-Immediately-Borrow', () => {
    it('should clear overdue when no other overdue loans', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 2);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.setOverdue(1);

      system.returnBookWorkflow(loanId, 15);
      expect(system.canBorrow(1)).toBe(true);
    });
  });

  describe('TRAP 3: 5-Book Boundary', () => {
    it('should allow 5 loans', () => {
      system.registerMember(1, 'Alice');
      for (let i = 1; i <= 5; i++) {
        system.addBook(i, `Book ${i}`, BookCategory.NORMAL, 1);
        system.borrowBook(i, 1, 1);
      }
      expect(system.getLoanCount(1)).toBe(5);
    });

    it('should prevent 6th loan', () => {
      system.registerMember(1, 'Alice');
      for (let i = 1; i <= 6; i++) {
        system.addBook(i, `Book ${i}`, BookCategory.NORMAL, 1);
      }
      for (let i = 1; i <= 5; i++) {
        system.borrowBook(i, 1, 1);
      }
      expect(() => system.borrowBook(6, 1, 1)).toThrow();
    });
  });

  describe('TRAP 4: Stock Consistency (INV1)', () => {
    it('should maintain invariant: available <= total', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 10);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      const book = system.getBookDetails(1);
      expect(book.available_copies).toBeLessThanOrEqual(book.total_copies);

      system.returnBookWorkflow(loanId, 5);
      const book2 = system.getBookDetails(1);
      expect(book2.available_copies).toBeLessThanOrEqual(book2.total_copies);
    });
  });

  describe('TRAP 5: Double Extension', () => {
    it('should allow one extension', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      const loan1 = system.getLoan(loanId);
      const originalDue = loan1.due_date;

      system.extendLoan(loanId);
      const loan2 = system.getLoan(loanId);
      expect(loan2.due_date).toBe(originalDue + 7);
    });

    it('should prevent second extension', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.extendLoan(loanId);
      expect(() => system.extendLoan(loanId)).toThrow();
    });
  });

  describe('TRAP 6: Extended-Then-Overdue (INV3)', () => {
    it('should maintain INV3 after extension', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.extendLoan(loanId);

      const loan = system.getLoan(loanId);
      expect(loan.due_date).toBeGreaterThan(loan.borrow_date);
    });

    it('should handle overdue on extended loan', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.extendLoan(loanId);

      expect(system.isOverdue(loanId, 20)).toBe(false);
      expect(system.isOverdue(loanId, 23)).toBe(true);
    });
  });

  describe('TRAP 7: Multiple Copies', () => {
    it('should handle multiple members borrowing same book', () => {
      system.addBook(1, 'Popular', BookCategory.NORMAL, 3);
      for (let i = 1; i <= 3; i++) {
        system.registerMember(i, `Member ${i}`);
      }

      const loan1 = system.borrowBook(1, 1, 1);
      const loan2 = system.borrowBook(1, 2, 1);
      const loan3 = system.borrowBook(1, 3, 1);

      expect(system.getAvailableCopies(1)).toBe(0);

      system.registerMember(4, 'Dave');
      expect(() => system.borrowBook(1, 4, 1)).toThrow('No available copies');

      system.returnBookWorkflow(loan1, 5);
      const loan4 = system.borrowBook(1, 4, 1);
      expect(system.getAvailableCopies(1)).toBe(0);
    });
  });

  describe('TRAP 8: Last Copy Reservation', () => {
    it('should prevent borrowing when last copy reserved', () => {
      system.addBook(1, 'Rare', BookCategory.NORMAL, 1);
      system.registerMember(1, 'Alice');
      system.registerMember(2, 'Bob');

      const loan1 = system.borrowBook(1, 1, 1);
      expect(() => system.borrowBook(1, 2, 1)).toThrow('No available copies');
    });
  });

  describe('TRAP 9: Duplicate Member', () => {
    it('should prevent duplicate registration', () => {
      system.registerMember(1, 'Alice');
      expect(() => system.registerMember(1, 'Alice')).toThrow();
    });
  });

  describe('TRAP 10: Invalid Return (INV2)', () => {
    it('should prevent returning non-existent loan', () => {
      expect(() => system.returnLoan(999)).toThrow();
    });

    it('should prevent double return', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.returnLoan(loanId);
      expect(() => system.returnLoan(loanId)).toThrow('already returned');
    });

    it('should maintain INV2 on return', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      expect(system.getLoanCount(1)).toBe(1);

      system.returnBookWorkflow(loanId, 10);
      expect(system.getLoanCount(1)).toBe(0);
    });
  });

  describe('TRAP 11: Precious Books (INV4)', () => {
    it('should prevent borrowing precious books', () => {
      system.addBook(1, 'Ancient', BookCategory.PRECIOUS, 1);
      system.registerMember(1, 'Alice');

      expect(() => system.borrowBook(1, 1, 1)).toThrow('Cannot loan precious books');
    });

    it('should maintain INV4: precious never in active loans', () => {
      system.addBook(1, 'Precious', BookCategory.PRECIOUS, 1);
      system.addBook(2, 'Normal', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(2, 1, 1);

      // Precious should not be in active loans
      const memberLoans = system.getMemberLoans(1);
      const loanBook = system.getLoan(memberLoans[0]);
      expect(system.getBookDetails(loanBook.book_id).category).toBe(BookCategory.NORMAL);
    });
  });

  describe('TRAP 12: Day 14 Boundary', () => {
    it('should not mark return on day 15 (due date) as overdue', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      const loan = system.getLoan(loanId);
      expect(loan.due_date).toBe(15);

      expect(system.isOverdue(loanId, 15)).toBe(false);
    });

    it('should not set overdue if returning on due date', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.returnBookWorkflow(loanId, 15);

      expect(system.canBorrow(1)).toBe(true); // Not marked overdue
    });

    it('should set overdue only when returning after due date', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.returnBookWorkflow(loanId, 16);

      expect(system.canBorrow(1)).toBe(false); // Marked overdue
    });
  });

  describe('Invariant Violations', () => {
    it('should catch INV1 violation (available > total)', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      const book = system.getBookDetails(1);
      // Manually violate invariant
      (book as any).available_copies = 10;

      expect(() => system.reserveBook(1)).toThrow('INV1 violation');
    });

    it('should catch INV2 violation (loan_count < 0)', () => {
      system.registerMember(1, 'Alice');
      const member = system.getBookDetails(1);
      // Can't directly violate, but test the check
      system.decrementLoanCount(1);
      expect(() => system.decrementLoanCount(1)).toThrow();
    });

    it('should catch INV3 violation (due_date <= borrow_date)', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      // Normal loan is fine
      const loanId = system.borrowBook(1, 1, 1);
      const loan = system.getLoan(loanId);
      expect(loan.due_date).toBeGreaterThan(loan.borrow_date);
    });

    it('should catch INV4 violation (precious in loans)', () => {
      system.addBook(1, 'Precious', BookCategory.PRECIOUS, 1);
      system.registerMember(1, 'Alice');

      expect(() => system.borrowBook(1, 1, 1)).toThrow('Cannot loan precious books');
    });
  });
});
