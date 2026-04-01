/**
 * Library Loan Management System - TypeScript Implementation
 * RUN 1: Full 3-Agent Architecture with Comprehensive Contracts
 *
 * Implements CatalogAgent, MemberAgent, and LoanAgent with formal
 * pre/post conditions and invariants derived from VDM-SL spec.
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

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
// CATALOG AGENT: Book Inventory Management
// ============================================================================

export class CatalogAgent {
  private catalog: Map<number, Book> = new Map();

  /**
   * Add book to catalog.
   * Pre: bookId not already in catalog, copies > 0
   * Post: Book added with given copies, all available
   */
  addBook(bookId: number, title: string, category: BookCategory, copies: number): void {
    if (this.catalog.has(bookId)) {
      throw new Error(`Book ${bookId} already exists in catalog`);
    }
    if (copies <= 0) {
      throw new Error('Book copies must be positive');
    }

    this.catalog.set(bookId, {
      id: bookId,
      title,
      category,
      total_copies: copies,
      available_copies: copies
    });

    // Invariant: available <= total
    const book = this.catalog.get(bookId)!;
    if (book.available_copies > book.total_copies) {
      throw new Error('Invariant violation: available_copies > total_copies');
    }
  }

  /**
   * Reserve book (decrease available copies).
   * Pre: Book exists, available > 0
   * Post: available_copies decremented by 1
   */
  reserveBook(bookId: number): void {
    if (!this.catalog.has(bookId)) {
      throw new Error(`Book ${bookId} not found`);
    }
    const book = this.catalog.get(bookId)!;
    if (book.available_copies <= 0) {
      throw new Error(`No available copies of book ${bookId}`);
    }

    book.available_copies--;

    // Invariant: available <= total
    if (book.available_copies > book.total_copies) {
      throw new Error('Invariant violation: available_copies > total_copies');
    }
  }

  /**
   * Return copy to catalog.
   * Pre: Book exists, available < total
   * Post: available_copies incremented by 1
   */
  returnBook(bookId: number): void {
    if (!this.catalog.has(bookId)) {
      throw new Error(`Book ${bookId} not found`);
    }
    const book = this.catalog.get(bookId)!;
    if (book.available_copies >= book.total_copies) {
      throw new Error(`Cannot return: all copies of book ${bookId} are already available`);
    }

    book.available_copies++;

    // Invariant: available <= total
    if (book.available_copies > book.total_copies) {
      throw new Error('Invariant violation: available_copies > total_copies');
    }
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
}

// ============================================================================
// MEMBER AGENT: Patron Management
// ============================================================================

export class MemberAgent {
  private members: Map<number, Member> = new Map();

  /**
   * Register new member.
   * Pre: MemberId not already registered
   * Post: New member added with no loans, no overdue status
   */
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

  /**
   * Increment loan count.
   * Pre: Member exists, count < MAX_LOANS (5)
   * Post: loan_count incremented
   */
  incrementLoanCount(memberId: number): void {
    if (!this.members.has(memberId)) {
      throw new Error(`Member ${memberId} not found`);
    }
    const member = this.members.get(memberId)!;
    if (member.loan_count >= MAX_LOANS) {
      throw new Error(`Member ${memberId} has reached maximum loan limit (${MAX_LOANS})`);
    }

    member.loan_count++;
  }

  /**
   * Decrement loan count.
   * Pre: Member exists, count > 0
   * Post: loan_count decremented
   */
  decrementLoanCount(memberId: number): void {
    if (!this.members.has(memberId)) {
      throw new Error(`Member ${memberId} not found`);
    }
    const member = this.members.get(memberId)!;
    if (member.loan_count <= 0) {
      throw new Error(`Member ${memberId} has no active loans to return`);
    }

    member.loan_count--;
  }

  /**
   * Set overdue flag.
   * Pre: Member exists
   * Post: has_overdue = true
   */
  setOverdue(memberId: number): void {
    if (!this.members.has(memberId)) {
      throw new Error(`Member ${memberId} not found`);
    }
    this.members.get(memberId)!.has_overdue = true;
  }

  /**
   * Clear overdue flag.
   * Pre: Member exists
   * Post: has_overdue = false
   */
  clearOverdue(memberId: number): void {
    if (!this.members.has(memberId)) {
      throw new Error(`Member ${memberId} not found`);
    }
    this.members.get(memberId)!.has_overdue = false;
  }

  hasOverdue(memberId: number): boolean {
    if (!this.members.has(memberId)) {
      throw new Error(`Member ${memberId} not found`);
    }
    return this.members.get(memberId)!.has_overdue;
  }

  getLoanCount(memberId: number): number {
    if (!this.members.has(memberId)) {
      throw new Error(`Member ${memberId} not found`);
    }
    return this.members.get(memberId)!.loan_count;
  }

  /**
   * Check if member can borrow.
   * Post: true iff loan_count < 5 AND has_overdue = false
   */
  canBorrow(memberId: number): boolean {
    if (!this.members.has(memberId)) {
      throw new Error(`Member ${memberId} not found`);
    }
    const member = this.members.get(memberId)!;
    return member.loan_count < MAX_LOANS && !member.has_overdue;
  }
}

// ============================================================================
// LOAN AGENT: Loan Lifecycle Management
// ============================================================================

export class LoanAgent {
  private active_loans: Map<number, Loan> = new Map();
  private loan_counter: number = 0;

  /**
   * Create new loan.
   * Pre: Book not precious, member can borrow, book has available copies
   * Post: New loan created, due_date = borrow_date + 14, extended = false, is_returned = false
   */
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
      throw new Error('Member cannot borrow (max loans or overdue)');
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

    // Invariant: due_date > borrow_date
    const loan = this.active_loans.get(loanId)!;
    if (loan.due_date <= loan.borrow_date) {
      throw new Error('Invariant violation: due_date <= borrow_date');
    }

    return loanId;
  }

  /**
   * Extend loan by 7 days.
   * Pre: Loan exists, not yet extended, not returned
   * Post: due_date += 7, extended = true
   */
  extendLoan(loan_id: number): void {
    if (!this.active_loans.has(loan_id)) {
      throw new Error(`Loan ${loan_id} not found`);
    }
    const loan = this.active_loans.get(loan_id)!;
    if (loan.extended) {
      throw new Error(`Loan ${loan_id} has already been extended`);
    }
    if (loan.is_returned) {
      throw new Error(`Cannot extend returned loan ${loan_id}`);
    }

    loan.due_date += EXTENSION_PERIOD;
    loan.extended = true;

    // Invariant: due_date > borrow_date
    if (loan.due_date <= loan.borrow_date) {
      throw new Error('Invariant violation: due_date <= borrow_date');
    }
  }

  /**
   * Return loan.
   * Pre: Loan exists, not yet returned
   * Post: is_returned = true
   */
  returnLoan(loan_id: number): void {
    if (!this.active_loans.has(loan_id)) {
      throw new Error(`Loan ${loan_id} not found`);
    }
    const loan = this.active_loans.get(loan_id)!;
    if (loan.is_returned) {
      throw new Error(`Loan ${loan_id} is already returned`);
    }

    loan.is_returned = true;
  }

  getMemberLoans(member_id: number): number[] {
    return Array.from(this.active_loans.values())
      .filter(loan => loan.member_id === member_id && !loan.is_returned)
      .map(loan => loan.id);
  }

  /**
   * Check if loan is overdue.
   * Returns true if due_date < current_date and not returned
   */
  isOverdue(loan_id: number, current_date: number): boolean {
    if (!this.active_loans.has(loan_id)) {
      throw new Error(`Loan ${loan_id} not found`);
    }
    const loan = this.active_loans.get(loan_id)!;
    return loan.due_date < current_date && !loan.is_returned;
  }

  getActiveLoanCount(member_id: number): number {
    return Array.from(this.active_loans.values())
      .filter(loan => loan.member_id === member_id && !loan.is_returned).length;
  }

  getLoan(loan_id: number): Loan {
    if (!this.active_loans.has(loan_id)) {
      throw new Error(`Loan ${loan_id} not found`);
    }
    return this.active_loans.get(loan_id)!;
  }
}

// ============================================================================
// ORCHESTRATOR: System-Level Workflow
// ============================================================================

export class LibrarySystem {
  private catalog: CatalogAgent;
  private members: MemberAgent;
  private loans: LoanAgent;

  constructor() {
    this.catalog = new CatalogAgent();
    this.members = new MemberAgent();
    this.loans = new LoanAgent();
  }

  // Public interfaces for testing
  getCatalog(): CatalogAgent {
    return this.catalog;
  }

  getMembers(): MemberAgent {
    return this.members;
  }

  getLoans(): LoanAgent {
    return this.loans;
  }

  /**
   * Workflow: Borrow book (orchestrates all three agents)
   */
  borrowBook(bookId: number, memberId: number, currentDate: number): number {
    // Check book exists and get details
    const book = this.catalog.getBookDetails(bookId);
    const isPrecious = book.category === BookCategory.PRECIOUS;

    // Check member eligibility
    const canBorrow = this.members.canBorrow(memberId);

    // Check availability
    const availableCopies = this.catalog.getAvailableCopies(bookId);

    // Create loan (validates all preconditions)
    const loanId = this.loans.createLoan(
      bookId,
      memberId,
      currentDate,
      isPrecious,
      canBorrow,
      availableCopies > 0
    );

    // Update catalog and member
    this.catalog.reserveBook(bookId);
    this.members.incrementLoanCount(memberId);

    return loanId;
  }

  /**
   * Workflow: Return book (orchestrates all three agents)
   */
  returnBook(loanId: number, currentDate: number): void {
    const loan = this.loans.getLoan(loanId);

    // Check if overdue
    const isOverdue = this.loans.isOverdue(loanId, currentDate);

    // Mark loan as returned
    this.loans.returnLoan(loanId);

    // Update catalog and member
    this.catalog.returnBook(loan.book_id);
    this.members.decrementLoanCount(loan.member_id);

    // Set/clear overdue flag
    if (isOverdue) {
      this.members.setOverdue(loan.member_id);
    } else {
      const memberLoans = this.loans.getMemberLoans(loan.member_id);
      const hasAnyOverdue = memberLoans.some(lid =>
        this.loans.isOverdue(lid, currentDate)
      );
      if (!hasAnyOverdue) {
        this.members.clearOverdue(loan.member_id);
      }
    }
  }

  /**
   * Workflow: Extend loan
   */
  extendLoan(loanId: number): void {
    this.loans.extendLoan(loanId);
  }
}
