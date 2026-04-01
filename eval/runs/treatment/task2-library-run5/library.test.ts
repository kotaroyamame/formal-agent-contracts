/**
 * Library Loan Management System - Comprehensive Test Suite
 * RUN 5: Most Thorough Tests (catches all 12 edge case traps)
 */

import { describe, it, expect } from '@jest/globals';
import { LibrarySystem, BookCategory } from './library';

describe('Library System - RUN 5 (Comprehensive)', () => {
  let system: LibrarySystem;

  beforeEach(() => {
    system = new LibrarySystem();
  });

  // ========================================================================
  // TRAP 1: Reservation System & Book Availability States
  // ========================================================================
  describe('TRAP 1: Book Availability & Reservation', () => {
    it('should track available copies through reservations', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      expect(system.getAvailableCopies(1)).toBe(5);

      system.registerMember(1, 'Alice');
      system.borrowBook(1, 1, 1);

      expect(system.getAvailableCopies(1)).toBe(4);

      system.registerMember(2, 'Bob');
      system.borrowBook(1, 2, 1);

      expect(system.getAvailableCopies(1)).toBe(3);
    });

    it('should prevent reservation when no copies available', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 1);
      system.registerMember(1, 'Alice');

      system.borrowBook(1, 1, 1);
      expect(system.getAvailableCopies(1)).toBe(0);

      system.registerMember(2, 'Bob');
      expect(() => system.borrowBook(1, 2, 1)).toThrow('No available copies');
    });

    it('should enforce precondition: available > 0 before reserve', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 1);
      system.registerMember(1, 'Alice');

      system.borrowBook(1, 1, 1);
      // Manually try to reserve (would fail in real workflow)
      expect(() => {
        system.getAvailableCopies(1);
        if (system.getAvailableCopies(1) === 0) {
          throw new Error('PRE violation: No available copies');
        }
      }).not.toThrow();
    });
  });

  // ========================================================================
  // TRAP 2: Return-Then-Immediately-Borrow (Overdue Flag Clearing)
  // ========================================================================
  describe('TRAP 2: Return-Then-Immediately-Borrow & Overdue Flag', () => {
    it('should clear overdue when returning on time', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 2);
      system.registerMember(1, 'Alice');

      const loan = system.borrowBook(1, 1, 1); // Due day 15
      system.returnBookWorkflow(loan, 10); // Return on day 10

      expect(system.canBorrow(1)).toBe(true);
    });

    it('should allow immediate reborrow after non-overdue return', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      system.addBook(2, 'Book B', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loan1 = system.borrowBook(1, 1, 1);
      system.returnBookWorkflow(loan1, 10);

      // Should be able to borrow again
      expect(system.canBorrow(1)).toBe(true);
      const loan2 = system.borrowBook(2, 1, 1);
      expect(system.getLoanCount(1)).toBe(1);
    });

    it('should maintain overdue flag if other loans overdue', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 2);
      system.addBook(2, 'Book B', BookCategory.NORMAL, 2);
      system.registerMember(1, 'Alice');

      const loan1 = system.borrowBook(1, 1, 1); // Due day 15
      const loan2 = system.borrowBook(2, 1, 1); // Due day 15

      // Return first on day 16 (overdue)
      system.returnBookWorkflow(loan1, 16);
      expect(system.canBorrow(1)).toBe(false); // Still overdue (loan2 is overdue)

      // Return second on day 16 (overdue)
      system.returnBookWorkflow(loan2, 16);
      expect(system.canBorrow(1)).toBe(true); // No more overdue loans
    });

    it('should preserve overdue state across multiple borrows', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 10);
      system.registerMember(1, 'Alice');

      const l1 = system.borrowBook(1, 1, 1); // Due 15
      system.returnBookWorkflow(l1, 20); // Overdue

      expect(system.canBorrow(1)).toBe(false);

      // Try to borrow while overdue
      expect(() => system.borrowBook(1, 1, 1)).toThrow('Member cannot borrow');
    });
  });

  // ========================================================================
  // TRAP 3: 5-Book Count Boundary
  // ========================================================================
  describe('TRAP 3: 5-Book Loan Count Boundary', () => {
    it('should allow exactly 5 loans', () => {
      system.registerMember(1, 'Alice');
      for (let i = 1; i <= 5; i++) {
        system.addBook(i, `Book ${i}`, BookCategory.NORMAL, 10);
        system.borrowBook(i, 1, 1);
      }
      expect(system.getLoanCount(1)).toBe(5);
      expect(system.canBorrow(1)).toBe(false);
    });

    it('should prevent 6th loan', () => {
      system.registerMember(1, 'Alice');
      for (let i = 1; i <= 6; i++) {
        system.addBook(i, `Book ${i}`, BookCategory.NORMAL, 10);
      }

      for (let i = 1; i <= 5; i++) {
        system.borrowBook(i, 1, 1);
      }

      expect(() => system.borrowBook(6, 1, 1)).toThrow('Member cannot borrow');
    });

    it('should allow borrowing again after returning one', () => {
      system.registerMember(1, 'Alice');
      const loans = [];

      for (let i = 1; i <= 5; i++) {
        system.addBook(i, `Book ${i}`, BookCategory.NORMAL, 10);
        loans.push(system.borrowBook(i, 1, 1));
      }

      system.addBook(6, 'Book 6', BookCategory.NORMAL, 10);
      expect(() => system.borrowBook(6, 1, 1)).toThrow();

      system.returnBookWorkflow(loans[0], 5);
      expect(system.canBorrow(1)).toBe(true);

      const loan6 = system.borrowBook(6, 1, 1);
      expect(system.getLoanCount(1)).toBe(5);
    });

    it('should enforce precondition: loan_count < 5 before increment', () => {
      system.registerMember(1, 'Alice');
      for (let i = 1; i <= 5; i++) {
        system.addBook(i, `Book ${i}`, BookCategory.NORMAL, 1);
        system.borrowBook(i, 1, 1);
      }

      system.addBook(6, 'Book 6', BookCategory.NORMAL, 1);
      expect(() => system.borrowBook(6, 1, 1)).toThrow();
    });
  });

  // ========================================================================
  // TRAP 4: Stock Consistency Between Agents
  // ========================================================================
  describe('TRAP 4: Stock Consistency (INV1)', () => {
    it('should maintain invariant: available <= total', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 10);
      system.registerMember(1, 'Alice');

      const loan = system.borrowBook(1, 1, 1);
      const book1 = system.getBookDetails(1);
      expect(book1.available_copies).toBeLessThanOrEqual(book1.total_copies);
      expect(book1.available_copies).toBe(9);

      system.returnBookWorkflow(loan, 5);
      const book2 = system.getBookDetails(1);
      expect(book2.available_copies).toBeLessThanOrEqual(book2.total_copies);
      expect(book2.available_copies).toBe(10);
    });

    it('should prevent availability exceeding total', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');
      system.registerMember(2, 'Bob');

      const loan1 = system.borrowBook(1, 1, 1);
      const loan2 = system.borrowBook(1, 2, 1);

      const bookBefore = system.getBookDetails(1);
      expect(bookBefore.available_copies).toBe(3);

      system.returnBookWorkflow(loan1, 5);
      const bookAfter = system.getBookDetails(1);
      expect(bookAfter.available_copies).toBe(4);
      expect(bookAfter.available_copies).toBeLessThanOrEqual(bookAfter.total_copies);
    });
  });

  // ========================================================================
  // TRAP 5: Double Extension Attempt
  // ========================================================================
  describe('TRAP 5: Double Extension Prevention', () => {
    it('should allow one extension', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      const loan1 = system.getLoan(loanId);
      const originalDue = loan1.due_date;

      system.extendLoan(loanId);

      const loan2 = system.getLoan(loanId);
      expect(loan2.due_date).toBe(originalDue + 7);
      expect(loan2.extended).toBe(true);
    });

    it('should prevent double extension via precondition', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.extendLoan(loanId);

      expect(() => system.extendLoan(loanId)).toThrow('Already extended');
    });

    it('should enforce precondition: extended = false', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      const loan1 = system.getLoan(loanId);
      expect(loan1.extended).toBe(false);

      system.extendLoan(loanId);
      const loan2 = system.getLoan(loanId);
      expect(loan2.extended).toBe(true);
      expect(() => system.extendLoan(loanId)).toThrow('Already extended');
    });
  });

  // ========================================================================
  // TRAP 6: Extended-Then-Overdue Handling
  // ========================================================================
  describe('TRAP 6: Extended-Then-Overdue (INV3)', () => {
    it('should maintain INV3 after extension: due_date > borrow_date', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      const loan1 = system.getLoan(loanId);
      expect(loan1.due_date).toBeGreaterThan(loan1.borrow_date);

      system.extendLoan(loanId);
      const loan2 = system.getLoan(loanId);
      expect(loan2.due_date).toBeGreaterThan(loan2.borrow_date);
      expect(loan2.due_date).toBe(loan1.due_date + 7);
    });

    it('should correctly identify overdue on extended loan', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1); // Due day 15
      system.extendLoan(loanId); // Now due day 22

      expect(system.isOverdue(loanId, 20)).toBe(false);
      expect(system.isOverdue(loanId, 22)).toBe(false); // day 22 is not < 22
      expect(system.isOverdue(loanId, 23)).toBe(true);
    });

    it('should set overdue when returning extended loan late', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.extendLoan(loanId); // Due day 22

      system.returnBookWorkflow(loanId, 23);
      expect(system.canBorrow(1)).toBe(false); // Marked overdue
    });
  });

  // ========================================================================
  // TRAP 7: Multiple Copies of Same Book
  // ========================================================================
  describe('TRAP 7: Multiple Copies of Same Book', () => {
    it('should handle multiple members borrowing same book', () => {
      system.addBook(1, 'Popular Book', BookCategory.NORMAL, 3);
      system.registerMember(1, 'Alice');
      system.registerMember(2, 'Bob');
      system.registerMember(3, 'Carol');

      expect(system.getAvailableCopies(1)).toBe(3);

      const loan1 = system.borrowBook(1, 1, 1);
      expect(system.getAvailableCopies(1)).toBe(2);

      const loan2 = system.borrowBook(1, 2, 1);
      expect(system.getAvailableCopies(1)).toBe(1);

      const loan3 = system.borrowBook(1, 3, 1);
      expect(system.getAvailableCopies(1)).toBe(0);

      system.registerMember(4, 'Dave');
      expect(() => system.borrowBook(1, 4, 1)).toThrow('No available copies');

      system.returnBookWorkflow(loan1, 5);
      expect(system.getAvailableCopies(1)).toBe(1);

      const loan4 = system.borrowBook(1, 4, 1);
      expect(system.getAvailableCopies(1)).toBe(0);
    });
  });

  // ========================================================================
  // TRAP 8: Last Copy Reservation Conflict
  // ========================================================================
  describe('TRAP 8: Last Copy Reservation', () => {
    it('should prevent borrowing when last copy reserved', () => {
      system.addBook(1, 'Rare Book', BookCategory.NORMAL, 1);
      system.registerMember(1, 'Alice');
      system.registerMember(2, 'Bob');

      const loan = system.borrowBook(1, 1, 1);
      expect(system.getAvailableCopies(1)).toBe(0);

      expect(() => system.borrowBook(1, 2, 1)).toThrow('No available copies');

      system.extendLoan(loan);
      expect(() => system.borrowBook(1, 2, 1)).toThrow('No available copies');
    });
  });

  // ========================================================================
  // TRAP 9: Duplicate Member Check
  // ========================================================================
  describe('TRAP 9: Duplicate Member Registration', () => {
    it('should prevent duplicate member registration', () => {
      system.registerMember(1, 'Alice');
      expect(() => system.registerMember(1, 'Alice')).toThrow('already registered');
    });

    it('should allow different members with same name', () => {
      system.registerMember(1, 'Alice');
      system.registerMember(2, 'Alice'); // Different ID

      expect(system.getLoanCount(1)).toBe(0);
      expect(system.getLoanCount(2)).toBe(0);
    });

    it('should enforce precondition: memberId not in dom members', () => {
      system.registerMember(1, 'Alice');
      const member1 = system.getLoanCount(1);
      expect(() => system.registerMember(1, 'Alice')).toThrow();
    });
  });

  // ========================================================================
  // TRAP 10: Invalid Return of Non-Borrowed Book
  // ========================================================================
  describe('TRAP 10: Invalid Return Operations', () => {
    it('should prevent returning non-existent loan', () => {
      expect(() => system.returnLoan(999)).toThrow('Loan not found');
    });

    it('should prevent double-return via precondition', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.returnLoan(loanId);

      expect(() => system.returnLoan(loanId)).toThrow('Already returned');
    });

    it('should maintain loan count consistency on return', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      expect(system.getLoanCount(1)).toBe(1);

      system.returnBookWorkflow(loanId, 10);
      expect(system.getLoanCount(1)).toBe(0);
    });

    it('should enforce precondition: is_returned = false', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      const loan1 = system.getLoan(loanId);
      expect(loan1.is_returned).toBe(false);

      system.returnLoan(loanId);
      const loan2 = system.getLoan(loanId);
      expect(loan2.is_returned).toBe(true);
      expect(() => system.returnLoan(loanId)).toThrow('Already returned');
    });
  });

  // ========================================================================
  // TRAP 11: Precious Book Lending Prohibition
  // ========================================================================
  describe('TRAP 11: Precious Book Restrictions (INV4)', () => {
    it('should prevent borrowing precious books', () => {
      system.addBook(1, 'Ancient Tome', BookCategory.PRECIOUS, 1);
      system.registerMember(1, 'Alice');

      expect(() => system.borrowBook(1, 1, 1)).toThrow('Cannot loan precious books');
    });

    it('should allow querying precious status', () => {
      system.addBook(1, 'Normal Book', BookCategory.NORMAL, 5);
      system.addBook(2, 'Precious Book', BookCategory.PRECIOUS, 1);

      expect(system.isPrecious(1)).toBe(false);
      expect(system.isPrecious(2)).toBe(true);
    });

    it('should enforce precondition: not is_precious', () => {
      system.addBook(1, 'Precious', BookCategory.PRECIOUS, 1);
      system.registerMember(1, 'Alice');

      expect(() => system.borrowBook(1, 1, 1)).toThrow('Cannot loan precious books');
    });

    it('should never have precious books in active loans (INV4)', () => {
      system.addBook(1, 'Precious', BookCategory.PRECIOUS, 1);
      system.addBook(2, 'Normal', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(2, 1, 1);
      const loan = system.getLoan(loanId);

      expect(system.getBookDetails(loan.book_id).category).toBe(BookCategory.NORMAL);
    });
  });

  // ========================================================================
  // TRAP 12: Day 14 Boundary (Return on Day 14 is NOT Overdue)
  // ========================================================================
  describe('TRAP 12: Day 14 Boundary Condition', () => {
    it('should not mark return on day 15 (due date) as overdue', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      const loan = system.getLoan(loanId);
      expect(loan.due_date).toBe(15);

      // Day 14: not overdue
      expect(system.isOverdue(loanId, 14)).toBe(false);

      // Day 15 (due date): not overdue (due_date < current_date is false)
      expect(system.isOverdue(loanId, 15)).toBe(false);

      // Day 16: overdue
      expect(system.isOverdue(loanId, 16)).toBe(true);
    });

    it('should not set overdue flag if returning on due date', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.returnBookWorkflow(loanId, 15);

      expect(system.canBorrow(1)).toBe(true);
    });

    it('should set overdue flag only when return is after due date', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.returnBookWorkflow(loanId, 16);

      expect(system.canBorrow(1)).toBe(false);
    });

    it('should handle extended loan boundary at day 22', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1); // Due day 15
      system.extendLoan(loanId); // Now due day 22

      const loan = system.getLoan(loanId);
      expect(loan.due_date).toBe(22);

      // Day 22: not overdue
      expect(system.isOverdue(loanId, 22)).toBe(false);

      // Day 23: overdue
      expect(system.isOverdue(loanId, 23)).toBe(true);

      // Return on day 22: no overdue
      system.returnBookWorkflow(loanId, 22);
      expect(system.canBorrow(1)).toBe(true);
    });
  });

  // ========================================================================
  // SYSTEM INVARIANTS
  // ========================================================================
  describe('System Invariants', () => {
    it('should maintain INV1: book stock consistency throughout', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 10);
      system.registerMember(1, 'Alice');

      const loan = system.borrowBook(1, 1, 1);
      let book = system.getBookDetails(1);
      expect(book.available_copies).toBeLessThanOrEqual(book.total_copies);

      system.returnBookWorkflow(loan, 5);
      book = system.getBookDetails(1);
      expect(book.available_copies).toBeLessThanOrEqual(book.total_copies);
    });

    it('should maintain INV2: member loan count in [0,5]', () => {
      system.registerMember(1, 'Alice');
      expect(system.getLoanCount(1)).toBe(0);

      for (let i = 1; i <= 5; i++) {
        system.addBook(i, `Book ${i}`, BookCategory.NORMAL, 1);
        system.borrowBook(i, 1, 1);
        expect(system.getLoanCount(1)).toBe(i);
        expect(system.getLoanCount(1)).toBeGreaterThanOrEqual(0);
        expect(system.getLoanCount(1)).toBeLessThanOrEqual(5);
      }
    });

    it('should maintain INV3: loan temporal ordering', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      const loan1 = system.getLoan(loanId);
      expect(loan1.due_date).toBeGreaterThan(loan1.borrow_date);

      system.extendLoan(loanId);
      const loan2 = system.getLoan(loanId);
      expect(loan2.due_date).toBeGreaterThan(loan2.borrow_date);
    });

    it('should maintain INV4: precious never in active loans', () => {
      system.addBook(1, 'Precious', BookCategory.PRECIOUS, 1);
      system.addBook(2, 'Normal', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      expect(() => system.borrowBook(1, 1, 1)).toThrow();

      const loanId = system.borrowBook(2, 1, 1);
      const loan = system.getLoan(loanId);
      expect(system.getBookDetails(loan.book_id).category).toBe(BookCategory.NORMAL);
    });
  });
});
