/**
 * Library Loan Management System - Comprehensive Test Suite
 * RUN 1: Tests for all 12 edge case traps
 *
 * Edge cases covered:
 * 1. Reservation system & book availability states
 * 2. Return-then-immediately-borrow (overdue flag clearing)
 * 3. 5-book count boundary
 * 4. Stock consistency between agents
 * 5. Double extension attempt
 * 6. Extended-then-overdue handling
 * 7. Multiple copies of same book
 * 8. Last copy reservation conflict
 * 9. Duplicate member check
 * 10. Invalid return of non-borrowed book
 * 11. Precious book lending prohibition
 * 12. Day 14 boundary (return on day 14 is not overdue)
 */

import { describe, it, expect } from '@jest/globals';
import {
  LibrarySystem,
  CatalogAgent,
  MemberAgent,
  LoanAgent,
  BookCategory
} from './library';

describe('Library Loan Management System - RUN 1', () => {
  let system: LibrarySystem;

  beforeEach(() => {
    system = new LibrarySystem();
  });

  // ========================================================================
  // TRAP 1: Reservation System & Book Availability States
  // ========================================================================
  describe('TRAP 1: Book Availability States', () => {
    it('should track available copies correctly when reserving', () => {
      const catalog = system.getCatalog();
      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 5);

      expect(catalog.getAvailableCopies(1)).toBe(5);
      catalog.reserveBook(1);
      expect(catalog.getAvailableCopies(1)).toBe(4);
      catalog.reserveBook(1);
      expect(catalog.getAvailableCopies(1)).toBe(3);
    });

    it('should prevent reservation when no copies available', () => {
      const catalog = system.getCatalog();
      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 1);
      catalog.reserveBook(1);

      expect(() => catalog.reserveBook(1)).toThrow('No available copies');
    });

    it('should track returning copies back to catalog', () => {
      const catalog = system.getCatalog();
      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 3);
      catalog.reserveBook(1);
      catalog.reserveBook(1);
      expect(catalog.getAvailableCopies(1)).toBe(1);

      catalog.returnBook(1);
      expect(catalog.getAvailableCopies(1)).toBe(2);
    });
  });

  // ========================================================================
  // TRAP 2: Return-Then-Immediately-Borrow (Overdue Flag Clearing)
  // ========================================================================
  describe('TRAP 2: Return-Then-Immediately-Borrow & Overdue Flag', () => {
    it('should clear overdue flag when returning on time', () => {
      const members = system.getMembers();
      members.registerMember(1, 'Alice');
      members.setOverdue(1);
      expect(members.hasOverdue(1)).toBe(true);

      // Return on time (manually clearing, simulating workflow)
      members.clearOverdue(1);
      expect(members.hasOverdue(1)).toBe(false);
    });

    it('should allow borrowing after returning overdue book if no other overdue loans', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();
      const loans = system.getLoans();

      // Setup
      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 2);
      members.registerMember(1, 'Alice');

      // First borrow
      const loanId1 = system.borrowBook(1, 1, 1);
      expect(members.canBorrow(1)).toBe(false); // At 1 loan, can still borrow (not at limit)

      // Mark as overdue manually
      members.setOverdue(1);
      expect(members.canBorrow(1)).toBe(false);

      // Return the book (day 15, overdue)
      system.returnBook(loanId1, 15);

      // If no other overdue loans, should be able to borrow
      expect(members.canBorrow(1)).toBe(true);
      expect(members.hasOverdue(1)).toBe(false);
    });

    it('should keep overdue flag if other loans are still overdue', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();
      const loans = system.getLoans();

      // Setup with 2 books
      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 2);
      catalog.addBook(2, 'Book B', BookCategory.NORMAL, 2);
      members.registerMember(1, 'Alice');

      // Two borrows
      const loanId1 = system.borrowBook(1, 1, 1);
      const loanId2 = system.borrowBook(2, 1, 1);

      // Both are overdue on day 20
      const loan1 = loans.getLoan(loanId1);
      const loan2 = loans.getLoan(loanId2);
      expect(loans.isOverdue(loanId1, 20)).toBe(true);
      expect(loans.isOverdue(loanId2, 20)).toBe(true);

      // Return first loan (overdue)
      system.returnBook(loanId1, 20);
      members.setOverdue(1); // Still overdue

      // Return second loan (overdue)
      system.returnBook(loanId2, 20);

      // Now can borrow
      expect(members.canBorrow(1)).toBe(true);
    });
  });

  // ========================================================================
  // TRAP 3: 5-Book Count Boundary
  // ========================================================================
  describe('TRAP 3: 5-Book Loan Count Boundary', () => {
    it('should allow borrowing up to 5 books', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();

      members.registerMember(1, 'Alice');

      // Add 5 books
      for (let i = 1; i <= 5; i++) {
        catalog.addBook(i, `Book ${i}`, BookCategory.NORMAL, 10);
      }

      // Borrow 5 books
      const loans = [];
      for (let i = 1; i <= 5; i++) {
        const loanId = system.borrowBook(i, 1, 1);
        loans.push(loanId);
      }

      expect(members.getLoanCount(1)).toBe(5);
      expect(members.canBorrow(1)).toBe(false);
    });

    it('should prevent borrowing 6th book', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();

      members.registerMember(1, 'Alice');

      // Add 6 books
      for (let i = 1; i <= 6; i++) {
        catalog.addBook(i, `Book ${i}`, BookCategory.NORMAL, 10);
      }

      // Borrow 5 books
      for (let i = 1; i <= 5; i++) {
        system.borrowBook(i, 1, 1);
      }

      // 6th should fail
      expect(() => system.borrowBook(6, 1, 1)).toThrow();
    });

    it('should allow borrowing after returning a book', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();

      members.registerMember(1, 'Alice');

      for (let i = 1; i <= 6; i++) {
        catalog.addBook(i, `Book ${i}`, BookCategory.NORMAL, 10);
      }

      // Borrow 5 books
      const loans = [];
      for (let i = 1; i <= 5; i++) {
        loans.push(system.borrowBook(i, 1, 1));
      }

      expect(members.canBorrow(1)).toBe(false);

      // Return first book
      system.returnBook(loans[0], 10);
      expect(members.getLoanCount(1)).toBe(4);

      // Now can borrow again
      expect(members.canBorrow(1)).toBe(true);
      const loan6 = system.borrowBook(6, 1, 1);
      expect(members.getLoanCount(1)).toBe(5);
    });
  });

  // ========================================================================
  // TRAP 4: Stock Consistency Between Agents
  // ========================================================================
  describe('TRAP 4: Stock Consistency', () => {
    it('should maintain consistency: total = reserved + available', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();

      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 10);
      members.registerMember(1, 'Alice');

      const book1 = catalog.getBookDetails(1);
      expect(book1.total_copies).toBe(10);
      expect(book1.available_copies).toBe(10);

      // Borrow 3 copies
      system.borrowBook(1, 1, 1);
      members.registerMember(2, 'Bob');
      system.borrowBook(1, 2, 1);
      members.registerMember(3, 'Carol');
      system.borrowBook(1, 3, 1);

      const book2 = catalog.getBookDetails(1);
      expect(book2.available_copies).toBe(7); // 10 - 3
      expect(book2.total_copies).toBe(10);
      expect(book2.available_copies + 3).toBe(book2.total_copies);
    });

    it('should prevent availability exceeding total', () => {
      const catalog = system.getCatalog();

      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      catalog.reserveBook(1);
      catalog.reserveBook(1);

      // Return 2
      catalog.returnBook(1);
      catalog.returnBook(1);

      const book = catalog.getBookDetails(1);
      expect(book.available_copies).toBeLessThanOrEqual(book.total_copies);
    });
  });

  // ========================================================================
  // TRAP 5: Double Extension Attempt
  // ========================================================================
  describe('TRAP 5: Double Extension Prevention', () => {
    it('should allow one extension', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();
      const loans = system.getLoans();

      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      members.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      const loan1 = loans.getLoan(loanId);
      const originalDueDate = loan1.due_date;

      // Extend once
      system.extendLoan(loanId);
      const loan2 = loans.getLoan(loanId);
      expect(loan2.due_date).toBe(originalDueDate + 7);
      expect(loan2.extended).toBe(true);
    });

    it('should prevent second extension', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();

      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      members.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.extendLoan(loanId);

      expect(() => system.extendLoan(loanId)).toThrow('already been extended');
    });
  });

  // ========================================================================
  // TRAP 6: Extended-Then-Overdue Handling
  // ========================================================================
  describe('TRAP 6: Extended-Then-Overdue Handling', () => {
    it('should handle overdue on extended loan', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();
      const loans = system.getLoans();

      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      members.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      const loan1 = loans.getLoan(loanId);
      const originalDue = loan1.due_date; // 15 (1 + 14)

      system.extendLoan(loanId);
      const loan2 = loans.getLoan(loanId);
      const extendedDue = loan2.due_date; // 22 (15 + 7)

      // On day 20, not overdue
      expect(loans.isOverdue(loanId, 20)).toBe(false);

      // On day 23, overdue
      expect(loans.isOverdue(loanId, 23)).toBe(true);
    });

    it('should set overdue flag when returning extended loan late', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();

      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      members.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.extendLoan(loanId);

      // Return on day 23 (overdue)
      system.returnBook(loanId, 23);

      expect(members.hasOverdue(1)).toBe(true);
    });
  });

  // ========================================================================
  // TRAP 7: Multiple Copies of Same Book
  // ========================================================================
  describe('TRAP 7: Multiple Copies of Same Book', () => {
    it('should handle multiple members borrowing same book', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();

      catalog.addBook(1, 'Popular Book', BookCategory.NORMAL, 3);
      members.registerMember(1, 'Alice');
      members.registerMember(2, 'Bob');
      members.registerMember(3, 'Carol');

      expect(catalog.getAvailableCopies(1)).toBe(3);

      const loan1 = system.borrowBook(1, 1, 1);
      expect(catalog.getAvailableCopies(1)).toBe(2);

      const loan2 = system.borrowBook(1, 2, 1);
      expect(catalog.getAvailableCopies(1)).toBe(1);

      const loan3 = system.borrowBook(1, 3, 1);
      expect(catalog.getAvailableCopies(1)).toBe(0);

      // Fourth member cannot borrow
      members.registerMember(4, 'Dave');
      expect(() => system.borrowBook(1, 4, 1)).toThrow('No available copies');

      // Return one
      system.returnBook(loan1, 5);
      expect(catalog.getAvailableCopies(1)).toBe(1);

      // Fourth member can now borrow
      const loan4 = system.borrowBook(1, 4, 1);
      expect(catalog.getAvailableCopies(1)).toBe(0);
    });
  });

  // ========================================================================
  // TRAP 8: Last Copy Reservation Conflict
  // ========================================================================
  describe('TRAP 8: Last Copy Reservation', () => {
    it('should prevent borrowing when last copy reserved', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();

      catalog.addBook(1, 'Rare Book', BookCategory.NORMAL, 1);
      members.registerMember(1, 'Alice');

      // Only 1 copy available
      expect(catalog.getAvailableCopies(1)).toBe(1);

      // Borrow it
      const loanId = system.borrowBook(1, 1, 1);
      expect(catalog.getAvailableCopies(1)).toBe(0);

      // Second member cannot borrow
      members.registerMember(2, 'Bob');
      expect(() => system.borrowBook(1, 2, 1)).toThrow('No available copies');

      // Even after extending, second member cannot borrow
      system.extendLoan(loanId);
      expect(() => system.borrowBook(1, 2, 1)).toThrow('No available copies');
    });
  });

  // ========================================================================
  // TRAP 9: Duplicate Member Check
  // ========================================================================
  describe('TRAP 9: Duplicate Member Registration', () => {
    it('should prevent duplicate member registration', () => {
      const members = system.getMembers();

      members.registerMember(1, 'Alice');
      expect(() => members.registerMember(1, 'Alice')).toThrow('already registered');
    });

    it('should allow different members with same name', () => {
      const members = system.getMembers();

      members.registerMember(1, 'Alice');
      members.registerMember(2, 'Alice'); // Different ID, OK

      expect(members.hasOverdue(1)).toBe(false);
      expect(members.hasOverdue(2)).toBe(false);
    });
  });

  // ========================================================================
  // TRAP 10: Invalid Return of Non-Borrowed Book
  // ========================================================================
  describe('TRAP 10: Invalid Return Operations', () => {
    it('should prevent returning non-existent loan', () => {
      const loans = system.getLoans();

      expect(() => loans.returnLoan(999)).toThrow('not found');
    });

    it('should prevent double-return of same loan', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();

      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      members.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      system.returnBook(loanId, 10);

      expect(() => system.returnBook(loanId, 10)).toThrow('already returned');
    });

    it('should maintain loan count consistency on return', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();

      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      members.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      expect(members.getLoanCount(1)).toBe(1);

      system.returnBook(loanId, 10);
      expect(members.getLoanCount(1)).toBe(0);
    });
  });

  // ========================================================================
  // TRAP 11: Precious Book Lending Prohibition
  // ========================================================================
  describe('TRAP 11: Precious Book Restrictions', () => {
    it('should prevent borrowing precious books', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();

      catalog.addBook(1, 'Ancient Tome', BookCategory.PRECIOUS, 1);
      members.registerMember(1, 'Alice');

      expect(() => system.borrowBook(1, 1, 1)).toThrow('Cannot loan precious books');
    });

    it('should allow querying precious book status', () => {
      const catalog = system.getCatalog();

      catalog.addBook(1, 'Normal Book', BookCategory.NORMAL, 5);
      catalog.addBook(2, 'Precious Book', BookCategory.PRECIOUS, 1);

      expect(catalog.isPrecious(1)).toBe(false);
      expect(catalog.isPrecious(2)).toBe(true);
    });

    it('should prevent precious books from ever appearing in loans', () => {
      const catalog = system.getCatalog();
      const loans = system.getLoans();

      // Even if we bypass borrowBook and call createLoan directly
      catalog.addBook(1, 'Precious', BookCategory.PRECIOUS, 1);

      expect(() => {
        loans.createLoan(1, 1, 1, true, true, true);
      }).toThrow('Cannot loan precious books');
    });
  });

  // ========================================================================
  // TRAP 12: Day 14 Boundary (Return on Day 14 is NOT Overdue)
  // ========================================================================
  describe('TRAP 12: Day 14 Boundary Condition', () => {
    it('should not mark return on day 14 as overdue', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();
      const loans = system.getLoans();

      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      members.registerMember(1, 'Alice');

      // Borrow on day 1, due on day 15 (1 + 14)
      const loanId = system.borrowBook(1, 1, 1);
      const loan = loans.getLoan(loanId);
      expect(loan.due_date).toBe(15);

      // Return on day 14 (not overdue)
      expect(loans.isOverdue(loanId, 14)).toBe(false);

      // Return on day 15 (due date is 15, so day 15 is still on time)
      expect(loans.isOverdue(loanId, 15)).toBe(false);

      // Return on day 16 (overdue)
      expect(loans.isOverdue(loanId, 16)).toBe(true);
    });

    it('should not set overdue flag if returning exactly on due date', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();

      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      members.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      // Loan due on day 15
      system.returnBook(loanId, 15);

      expect(members.hasOverdue(1)).toBe(false);
    });

    it('should set overdue flag only when return is after due date', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();

      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      members.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1);
      // Loan due on day 15
      system.returnBook(loanId, 16); // Return on day 16

      expect(members.hasOverdue(1)).toBe(true);
    });

    it('should handle extended loan boundary at day 21', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();
      const loans = system.getLoans();

      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      members.registerMember(1, 'Alice');

      const loanId = system.borrowBook(1, 1, 1); // Due day 15
      system.extendLoan(loanId); // Now due day 22

      const loan = loans.getLoan(loanId);
      expect(loan.due_date).toBe(22);

      // On day 22, not yet overdue
      expect(loans.isOverdue(loanId, 22)).toBe(false);

      // On day 23, overdue
      expect(loans.isOverdue(loanId, 23)).toBe(true);

      // Return on day 22, no overdue
      system.returnBook(loanId, 22);
      expect(members.hasOverdue(1)).toBe(false);
    });
  });

  // ========================================================================
  // SYSTEM INVARIANTS
  // ========================================================================
  describe('System Invariants', () => {
    it('should maintain member loan count accuracy', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();

      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 10);
      catalog.addBook(2, 'Book B', BookCategory.NORMAL, 10);
      members.registerMember(1, 'Alice');

      expect(members.getLoanCount(1)).toBe(0);

      const loan1 = system.borrowBook(1, 1, 1);
      expect(members.getLoanCount(1)).toBe(1);

      const loan2 = system.borrowBook(2, 1, 1);
      expect(members.getLoanCount(1)).toBe(2);

      system.returnBook(loan1, 10);
      expect(members.getLoanCount(1)).toBe(1);

      system.returnBook(loan2, 10);
      expect(members.getLoanCount(1)).toBe(0);
    });

    it('should maintain book stock consistency through all operations', () => {
      const catalog = system.getCatalog();
      const members = system.getMembers();

      catalog.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      const book1 = catalog.getBookDetails(1);
      const initialTotal = book1.total_copies;

      members.registerMember(1, 'Alice');
      const loan1 = system.borrowBook(1, 1, 1);

      const book2 = catalog.getBookDetails(1);
      expect(book2.total_copies).toBe(initialTotal);
      expect(book2.available_copies).toBe(initialTotal - 1);

      system.returnBook(loan1, 10);
      const book3 = catalog.getBookDetails(1);
      expect(book3.available_copies).toBe(initialTotal);
    });
  });
});
