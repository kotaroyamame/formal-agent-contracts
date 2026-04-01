/**
 * Library Loan Management System - TypeScript Implementation
 * RUN 4: Simpler VDM-SL Formalization (catches 9-10 traps)
 */

export enum BookCategory {
  NORMAL = 'NORMAL',
  PRECIOUS = 'PRECIOUS'
}

export interface Book {
  id: number;
  title: string;
  category: BookCategory;
  total_copies: number;
  available_copies: number;
}

export interface Member {
  id: number;
  name: string;
  has_overdue: boolean;
  loan_count: number;
}

export interface Loan {
  id: number;
  book_id: number;
  member_id: number;
  borrow_date: number;
  due_date: number;
  extended: boolean;
  is_returned: boolean;
}

const MAX_LOANS = 5;
const LOAN_PERIOD = 14;
const EXTENSION_PERIOD = 7;

// ============================================================================
// SIMPLIFIED LIBRARY SYSTEM
// ============================================================================

export class LibrarySystem {
  private catalog: Map<number, Book> = new Map();
  private members: Map<number, Member> = new Map();
  private active_loans: Map<number, Loan> = new Map();
  private loan_counter: number = 0;

  // ========================================================================
  // CATALOG OPERATIONS
  // ========================================================================

  addBook(bookId: number, title: string, category: BookCategory, copies: number): void {
    if (this.catalog.has(bookId)) {
      throw new Error(`Book ${bookId} already exists`);
    }

    this.catalog.set(bookId, {
      id: bookId,
      title,
      category,
      total_copies: copies,
      available_copies: copies
    });
  }

  reserveBook(bookId: number): void {
    if (!this.catalog.has(bookId)) {
      throw new Error(`Book ${bookId} not found`);
    }
    const book = this.catalog.get(bookId)!;
    if (book.available_copies <= 0) {
      throw new Error(`No available copies of ${bookId}`);
    }

    book.available_copies--;
  }

  returnBook(bookId: number): void {
    if (!this.catalog.has(bookId)) {
      throw new Error(`Book ${bookId} not found`);
    }
    const book = this.catalog.get(bookId)!;
    if (book.available_copies >= book.total_copies) {
      throw new Error(`Cannot return more than total`);
    }

    book.available_copies++;
  }

  getAvailableCopies(bookId: number): number {
    if (!this.catalog.has(bookId)) {
      throw new Error(`Book ${bookId} not found`);
    }
    return this.catalog.get(bookId)!.available_copies;
  }

  isPrecious(bookId: number): boolean {
    if (!this.catalog.has(bookId)) {
      throw new Error(`Book ${bookId} not found`);
    }
    return this.catalog.get(bookId)!.category === BookCategory.PRECIOUS;
  }

  getBookDetails(bookId: number): Book {
    if (!this.catalog.has(bookId)) {
      throw new Error(`Book ${bookId} not found`);
    }
    return this.catalog.get(bookId)!;
  }

  // ========================================================================
  // MEMBER OPERATIONS
  // ========================================================================

  registerMember(memberId: number, name: string): void {
    if (this.members.has(memberId)) {
      throw new Error(`Member ${memberId} already registered`);
    }

    this.members.set(memberId, {
      id: memberId,
      name,
      has_overdue: false,
      loan_count: 0
    });
  }

  incrementLoanCount(memberId: number): void {
    if (!this.members.has(memberId)) {
      throw new Error(`Member ${memberId} not found`);
    }
    const member = this.members.get(memberId)!;
    if (member.loan_count >= MAX_LOANS) {
      throw new Error(`Member at max loans`);
    }

    member.loan_count++;
  }

  decrementLoanCount(memberId: number): void {
    if (!this.members.has(memberId)) {
      throw new Error(`Member ${memberId} not found`);
    }
    const member = this.members.get(memberId)!;
    if (member.loan_count <= 0) {
      throw new Error(`Member has no loans`);
    }

    member.loan_count--;
  }

  setOverdue(memberId: number): void {
    if (!this.members.has(memberId)) {
      throw new Error(`Member ${memberId} not found`);
    }
    this.members.get(memberId)!.has_overdue = true;
  }

  clearOverdue(memberId: number): void {
    if (!this.members.has(memberId)) {
      throw new Error(`Member ${memberId} not found`);
    }
    // NOTE: Spec doesn't formalize precondition that other loans aren't overdue.
    // Orchestrator must ensure this.
    this.members.get(memberId)!.has_overdue = false;
  }

  canBorrow(memberId: number): boolean {
    if (!this.members.has(memberId)) {
      throw new Error(`Member ${memberId} not found`);
    }
    const member = this.members.get(memberId)!;
    return member.loan_count < MAX_LOANS && !member.has_overdue;
  }

  getLoanCount(memberId: number): number {
    if (!this.members.has(memberId)) {
      throw new Error(`Member ${memberId} not found`);
    }
    return this.members.get(memberId)!.loan_count;
  }

  // ========================================================================
  // LOAN OPERATIONS
  // ========================================================================

  createLoan(
    book_id: number,
    member_id: number,
    borrow_date: number,
    is_precious: boolean,
    can_member_borrow: boolean,
    has_available_copies: boolean
  ): number {
    if (is_precious) {
      throw new Error('Cannot loan precious books');
    }
    if (!can_member_borrow) {
      throw new Error('Member cannot borrow');
    }
    if (!has_available_copies) {
      throw new Error('No available copies');
    }

    const loanId = this.loan_counter++;
    const due_date = borrow_date + LOAN_PERIOD;

    this.active_loans.set(loanId, {
      id: loanId,
      book_id,
      member_id,
      borrow_date,
      due_date,
      extended: false,
      is_returned: false
    });

    return loanId;
  }

  extendLoan(loan_id: number): void {
    if (!this.active_loans.has(loan_id)) {
      throw new Error(`Loan ${loan_id} not found`);
    }
    const loan = this.active_loans.get(loan_id)!;
    if (loan.extended) {
      throw new Error(`Already extended`);
    }
    if (loan.is_returned) {
      throw new Error(`Cannot extend returned`);
    }

    loan.due_date += EXTENSION_PERIOD;
    loan.extended = true;
  }

  returnLoan(loan_id: number): void {
    if (!this.active_loans.has(loan_id)) {
      throw new Error(`Loan ${loan_id} not found`);
    }
    const loan = this.active_loans.get(loan_id)!;
    if (loan.is_returned) {
      throw new Error(`Already returned`);
    }

    loan.is_returned = true;
  }

  isOverdue(loan_id: number, current_date: number): boolean {
    if (!this.active_loans.has(loan_id)) {
      throw new Error(`Loan ${loan_id} not found`);
    }
    const loan = this.active_loans.get(loan_id)!;
    return loan.due_date < current_date && !loan.is_returned;
  }

  getMemberLoans(member_id: number): number[] {
    return Array.from(this.active_loans.values())
      .filter(loan => loan.member_id === member_id && !loan.is_returned)
      .map(loan => loan.id);
  }

  getLoan(loan_id: number): Loan {
    if (!this.active_loans.has(loan_id)) {
      throw new Error(`Loan ${loan_id} not found`);
    }
    return this.active_loans.get(loan_id)!;
  }

  // ========================================================================
  // HIGH-LEVEL WORKFLOWS
  // ========================================================================

  borrowBook(bookId: number, memberId: number, currentDate: number): number {
    const book = this.getBookDetails(bookId);
    const isPrecious = this.isPrecious(bookId);
    const canBorrow = this.canBorrow(memberId);
    const availableCopies = this.getAvailableCopies(bookId);

    const loanId = this.createLoan(
      bookId,
      memberId,
      currentDate,
      isPrecious,
      canBorrow,
      availableCopies > 0
    );

    this.reserveBook(bookId);
    this.incrementLoanCount(memberId);

    return loanId;
  }

  returnBookWorkflow(loanId: number, currentDate: number): void {
    const loan = this.getLoan(loanId);
    const isOverdue = this.isOverdue(loanId, currentDate);

    this.returnLoan(loanId);
    this.returnBook(loan.book_id);
    this.decrementLoanCount(loan.member_id);

    if (isOverdue) {
      this.setOverdue(loan.member_id);
    } else {
      // Check all remaining loans to see if any are overdue
      const memberLoans = this.getMemberLoans(loan.member_id);
      const hasAnyOverdue = memberLoans.some(lid =>
        this.isOverdue(lid, currentDate)
      );
      if (!hasAnyOverdue) {
        this.clearOverdue(loan.member_id);
      }
    }
  }
}
