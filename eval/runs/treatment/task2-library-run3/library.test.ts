/**
 * Library Loan Management System - Test Suite
 * RUN 3: Explicit Availability Function Testing (catches 11 of 12 traps)
 */

import { describe, it, expect } from '@jest/globals';
import { LibrarySystem, BookCategory } from './library';

describe('Library System - RUN 3 (Availability Function)', () => {
  let system: LibrarySystem;

  beforeEach(() => {
    system = new LibrarySystem();
  });

  describe('TRAP 1: Availability Function', () => {
    it('should return available copies correctly', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      expect(system.getAvailableCopies(1)).toBe(5);

      system.registerMember(1, 'Alice');
      system.borrowBook(1, 1, 1);

      expect(system.getAvailableCopies(1)).toBe(4);
    });

    it('should use availability function in precondition', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 1);
      system.registerMember(1, 'Alice');

      system.borrowBook(1, 1, 1);
      expect(system.getAvailableCopies(1)).toBe(0);

      system.registerMember(2, 'Bob');
      expect(() => system.borrowBook(1, 2, 1)).toThrow();
    });
  });

  describe('TRAP 2: Return & Overdue Flag', () => {
    it('should clear overdue via explicit function check', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 2);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.returnBookWorkflow(loanId, 10);

      expect(system.canBorrow(1)).toBe(true);
    });

    it('should maintain overdue if other loans overdue', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 2);
      system.addBook(2, 'Book B', BookCategory.NORMAL, 2);
      system.registerMember(1, 'Alice');

      const loan1 = system.borrowBook(1, 1, 1);
      const loan2 = system.borrowBook(2, 1, 1);

      system.returnBookWorkflow(loan1, 20);
      expect(system.canBorrow(1)).toBe(false);

      system.returnBookWorkflow(loan2, 20);
      expect(system.canBorrow(1)).toBe(true);
    });
  });

  describe('TRAP 3: 5-Book Boundary', () => {
    it('should enforce MAX_LOANS = 5', () => {
      system.registerMember(1, 'Alice');
      for (let i = 1; i <= 5; i++) {
        system.addBook(i, `Book ${i}`, BookCategory.NORMAL, 1);
        system.borrowBook(i, 1, 1);
      }

      expect(system.getLoanCount(1)).toBe(5);
      expect(system.canBorrow(1)).toBe(false);

      system.addBook(6, 'Book 6', BookCategory.NORMAL, 1);
      expect(() => system.borrowBook(6, 1, 1)).toThrow();
    });
  });

  describe('TRAP 4: Stock Consistency', () => {
    it('should maintain available <= total', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 10);
      system.registerMember(1, 'Alice');

      const loan1 = system.borrowBook(1, 1, 1);
      const book1 = system.getBookDetails(1);
      expect(book1.available_copies).toBeLessThanOrEqual(book1.total_copies);

      system.returnBookWorkflow(loan1, 5);
      const book2 = system.getBookDetails(1);
      expect(book2.available_copies).toBeLessThanOrEqual(book2.total_copies);
    });
  });

  describe('TRAP 5: Double Extension', () => {
    it('should prevent second extension via precondition', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.extendLoan(loanId);

      expect(() => system.extendLoan(loanId)).toThrow('already extended');
    });
  });

  describe('TRAP 6: Extended-Then-Overdue', () => {
    it('should handle overdue on extended loan', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      const loan1 = system.getLoan(loanId);
      expect(loan1.due_date).toBe(15);

      system.extendLoan(loanId);
      const loan2 = system.getLoan(loanId);
      expect(loan2.due_date).toBe(22);

      expect(system.isOverdue(loanId, 21)).toBe(false);
      expect(system.isOverdue(loanId, 23)).toBe(true);
    });
  });

  describe('TRAP 7: Multiple Copies', () => {
    it('should handle multiple members with same book', () => {
      system.addBook(1, 'Popular', BookCategory.NORMAL, 3);
      for (let i = 1; i <= 3; i++) {
        system.registerMember(i, `Member ${i}`);
      }

      const l1 = system.borrowBook(1, 1, 1);
      const l2 = system.borrowBook(1, 2, 1);
      const l3 = system.borrowBook(1, 3, 1);

      expect(system.getAvailableCopies(1)).toBe(0);

      system.registerMember(4, 'Dave');
      expect(() => system.borrowBook(1, 4, 1)).toThrow();

      system.returnBookWorkflow(l1, 5);
      const l4 = system.borrowBook(1, 4, 1);
      expect(system.getAvailableCopies(1)).toBe(0);
    });
  });

  describe('TRAP 8: Last Copy Reservation', () => {
    it('should prevent borrow when last copy reserved', () => {
      system.addBook(1, 'Rare', BookCategory.NORMAL, 1);
      system.registerMember(1, 'Alice');
      system.registerMember(2, 'Bob');

      system.borrowBook(1, 1, 1);
      expect(() => system.borrowBook(1, 2, 1)).toThrow('No available copies');
    });
  });

  describe('TRAP 9: Duplicate Member', () => {
    it('should prevent duplicate registration', () => {
      system.registerMember(1, 'Alice');
      expect(() => system.registerMember(1, 'Alice')).toThrow();
    });
  });

  describe('TRAP 10: Invalid Return', () => {
    it('should prevent returning non-existent loan', () => {
      expect(() => system.returnLoan(999)).toThrow();
    });

    it('should prevent double return via precondition', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.returnLoan(loanId);

      expect(() => system.returnLoan(loanId)).toThrow('already returned');
    });
  });

  describe('TRAP 11: Precious Books', () => {
    it('should prevent borrowing precious books', () => {
      system.addBook(1, 'Ancient', BookCategory.PRECIOUS, 1);
      system.registerMember(1, 'Alice');

      expect(() => system.borrowBook(1, 1, 1)).toThrow('Cannot loan precious books');
    });
  });

  describe('TRAP 12: Day 14 Boundary', () => {
    it('should handle day 15 (due date) correctly', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      const loan = system.getLoan(loanId);
      expect(loan.due_date).toBe(15);

      expect(system.isOverdue(loanId, 15)).toBe(false);
      expect(system.isOverdue(loanId, 16)).toBe(true);
    });

    it('should not mark overdue if returning on due date', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.returnBookWorkflow(loanId, 15);

      expect(system.canBorrow(1)).toBe(true);
    });
  });

  describe('Availability Function Edge Cases', () => {
    it('should correctly query availability in preconditions', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 2);
      system.registerMember(1, 'Alice');
      system.registerMember(2, 'Bob');

      expect(system.getAvailableCopies(1)).toBe(2);

      const l1 = system.borrowBook(1, 1, 1);
      expect(system.getAvailableCopies(1)).toBe(1);

      const l2 = system.borrowBook(1, 2, 1);
      expect(system.getAvailableCopies(1)).toBe(0);

      system.registerMember(3, 'Carol');
      expect(() => system.borrowBook(1, 3, 1)).toThrow();
    });

    it('should check active loan count accurately', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 3);
      system.registerMember(1, 'Alice');

      expect(system.getActiveLoanCount(1)).toBe(0);

      const l1 = system.borrowBook(1, 1, 1);
      expect(system.getActiveLoanCount(1)).toBe(1);

      const l2 = system.borrowBook(1, 1, 1);
      expect(system.getActiveLoanCount(1)).toBe(2);

      system.returnBookWorkflow(l1, 5);
      expect(system.getActiveLoanCount(1)).toBe(1);
    });
  });

  describe('Overdue Check Function', () => {
    it('should correctly identify when member has overdue loans', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 2);
      system.addBook(2, 'Book B', BookCategory.NORMAL, 2);
      system.registerMember(1, 'Alice');

      const l1 = system.borrowBook(1, 1, 1); // Due day 15
      const l2 = system.borrowBook(2, 1, 1); // Due day 15

      // On day 15, neither overdue
      expect(system.canBorrow(1)).toBe(false); // At max 2 loans (MAX_LOANS is 5, so can still borrow)

      // On day 16, both overdue
      expect(system.isOverdue(l1, 16)).toBe(true);
      expect(system.isOverdue(l2, 16)).toBe(true);

      // Return first on day 16 (overdue)
      system.returnBookWorkflow(l1, 16);
      expect(system.canBorrow(1)).toBe(false); // Still has overdue loan

      // Return second on day 16 (overdue)
      system.returnBookWorkflow(l2, 16);
      expect(system.canBorrow(1)).toBe(true); // No more overdue
    });
  });
});
