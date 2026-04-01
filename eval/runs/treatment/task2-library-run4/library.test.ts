/**
 * Library Loan Management System - Test Suite
 * RUN 4: Tests for simpler spec (catches 9-10 of 12 traps)
 */

import { describe, it, expect } from '@jest/globals';
import { LibrarySystem, BookCategory } from './library';

describe('Library System - RUN 4 (Simplified)', () => {
  let system: LibrarySystem;

  beforeEach(() => {
    system = new LibrarySystem();
  });

  describe('TRAP 1: Book Availability', () => {
    it('should track copies correctly', () => {
      system.addBook(1, 'Book A', BookCategory.NORMAL, 5);
      expect(system.getAvailableCopies(1)).toBe(5);

      system.registerMember(1, 'Alice');
      system.borrowBook(1, 1, 1);

      expect(system.getAvailableCopies(1)).toBe(4);
    });

    it('should prevent reservation when empty', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 1);
      system.registerMember(1, 'Alice');
      system.borrowBook(1, 1, 1);

      system.registerMember(2, 'Bob');
      expect(() => system.borrowBook(1, 2, 1)).toThrow('No available copies');
    });
  });

  describe('TRAP 2: Return-Then-Borrow', () => {
    it('should handle overdue flag correctly', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 2);
      system.registerMember(1, 'Alice');

      const loan = system.borrowBook(1, 1, 1);
      system.returnBookWorkflow(loan, 10);

      expect(system.canBorrow(1)).toBe(true);
    });
  });

  describe('TRAP 3: 5-Book Boundary', () => {
    it('should enforce 5-book limit', () => {
      system.registerMember(1, 'Alice');
      for (let i = 1; i <= 5; i++) {
        system.addBook(i, `Book ${i}`, BookCategory.NORMAL, 1);
        system.borrowBook(i, 1, 1);
      }

      expect(system.getLoanCount(1)).toBe(5);

      system.addBook(6, 'Book 6', BookCategory.NORMAL, 1);
      expect(() => system.borrowBook(6, 1, 1)).toThrow();
    });
  });

  describe('TRAP 4: Stock Consistency', () => {
    it('should maintain available <= total', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 10);
      system.registerMember(1, 'Alice');

      const loan = system.borrowBook(1, 1, 1);
      const book1 = system.getBookDetails(1);
      expect(book1.available_copies).toBeLessThanOrEqual(book1.total_copies);

      system.returnBookWorkflow(loan, 5);
      const book2 = system.getBookDetails(1);
      expect(book2.available_copies).toBeLessThanOrEqual(book2.total_copies);
    });
  });

  describe('TRAP 5: Double Extension', () => {
    it('should prevent second extension', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loan = system.borrowBook(1, 1, 1);
      system.extendLoan(loan);
      expect(() => system.extendLoan(loan)).toThrow();
    });
  });

  describe('TRAP 6: Extended-Then-Overdue', () => {
    it('should handle extended loan overdue', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loan = system.borrowBook(1, 1, 1);
      system.extendLoan(loan);

      expect(system.isOverdue(loan, 20)).toBe(false);
      expect(system.isOverdue(loan, 23)).toBe(true);
    });
  });

  describe('TRAP 7: Multiple Copies', () => {
    it('should handle multiple borrowers', () => {
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

  describe('TRAP 8: Last Copy', () => {
    it('should prevent borrow when last copy taken', () => {
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

    it('should prevent double return', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loan = system.borrowBook(1, 1, 1);
      system.returnLoan(loan);
      expect(() => system.returnLoan(loan)).toThrow('Already returned');
    });
  });

  describe('TRAP 11: Precious Books', () => {
    it('should prevent lending precious books', () => {
      system.addBook(1, 'Ancient', BookCategory.PRECIOUS, 1);
      system.registerMember(1, 'Alice');

      expect(() => system.borrowBook(1, 1, 1)).toThrow('Cannot loan precious books');
    });
  });

  describe('TRAP 12: Day 14 Boundary', () => {
    it('should handle day 15 correctly', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loan = system.borrowBook(1, 1, 1);
      // Due on day 15
      expect(system.isOverdue(loan, 15)).toBe(false);
      expect(system.isOverdue(loan, 16)).toBe(true);
    });

    it('should not mark overdue if returned on due date', () => {
      system.addBook(1, 'Book', BookCategory.NORMAL, 5);
      system.registerMember(1, 'Alice');

      const loan = system.borrowBook(1, 1, 1);
      system.returnBookWorkflow(loan, 15);

      expect(system.canBorrow(1)).toBe(true);
    });
  });

  describe('Edge Cases Not Fully Formalized', () => {
    it('should still catch precious book violation at runtime', () => {
      system.addBook(1, 'Precious', BookCategory.PRECIOUS, 5);
      system.registerMember(1, 'Alice');

      // Spec comment notes this isn't formalized as invariant,
      // but implementation catches it
      expect(() => system.borrowBook(1, 1, 1)).toThrow();
    });

    it('should handle overdue flag clearing correctly (note: spec limitation)', () => {
      // Spec note: clearOverdue has no precondition checking for other loans.
      // Implementation must be careful. This test verifies correct behavior.
      system.addBook(1, 'Book A', BookCategory.NORMAL, 2);
      system.addBook(2, 'Book B', BookCategory.NORMAL, 2);
      system.registerMember(1, 'Alice');

      const l1 = system.borrowBook(1, 1, 1);
      const l2 = system.borrowBook(2, 1, 1);

      // Both overdue on day 16
      system.returnBookWorkflow(l1, 16); // Sets overdue
      expect(system.canBorrow(1)).toBe(false); // Still has overdue

      system.returnBookWorkflow(l2, 16); // Clears overdue
      expect(system.canBorrow(1)).toBe(true);
    });
  });
});
