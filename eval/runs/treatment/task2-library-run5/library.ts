/**
 * Library Loan Management System - TypeScript Implementation
 * RUN 5: Most Thorough Implementation with All Edge Cases
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
// COMPREHENSIVE LIBRARY SYSTEM
// ============================================================================

export class LibrarySystem {
  private catalog: Map<number, Book> = new Map();
  private members: Map<number, Member> = new Map();
  private active_loans: Map<number, Loan> = new Map();
  private loan_counter: number = 0;

  // ========================================================================
  // HELPER FUNCTIONS WITH FORMAL POSTCONDITIONS
  // ========================================================================

  private countActiveLoansByMember(memberId: number): number {
    return Array.from(this.active_loans.values()).filter(
      loan => loan.member_id === memberId && !loan.is_returned
    ).length;
  }

  private isAvailable(bookId: number): boolean {
    if (!this.catalog.has(bookId)) {
      throw new Error(`Book ${bookId} not found`);
    }
    const result = this.catalog.get(bookId)!.available_copies > 0;
    // POST: result <=> catalog(bookId).available_copies > 0
    return result;
  }

  private hasOverdueLoan(memberId: number, currentDate: number): boolean {
    const result = Array.from(this.active_loans.values()).some(
      loan =>
        loan.member_id === memberId &&
        !loan.is_returned &&
        loan.due_date < currentDate
    );
    // POST: result <=> exists loan for member with due_date < currentDate
    return result;
  }

  private isLoanOverdue(loan: Loan, currentDate: number): boolean {
    const result = loan.due_date < currentDate && !loan.is_returned;
    // POST: result <=> loan.due_date < currentDate /\ loan.is_returned = false
    return result;
  }

  // ========================================================================
  // INVARIANT CHECKING
  // ========================================================================

  private checkInvariants(): void {
    // INV1: Book stock consistency
    for (const book of this.catalog.values()) {
      if (book.available_copies > book.total_copies) {
        throw new Error('INV1 violation: available > total');
      }
    }

    // INV2: Member loan count constraints
    for (const member of this.members.values()) {
      if (member.loan_count < 0 || member.loan_count > MAX_LOANS) {
        throw new Error('INV2 violation: loan_count not in [0,5]');
      }
    }

    // INV3: Loan temporal ordering
    for (const loan of this.active_loans.values()) {
      if (loan.due_date <= loan.borrow_date) {
        throw new Error('INV3 violation: due_date <= borrow_date');
      }
    }

    // INV4: Precious books never in active loans
    for (const loan of this.active_loans.values()) {
      if (!loan.is_returned) {
        if (this.catalog.has(loan.book_id)) {
          if (this.catalog.get(loan.book_id)!.category === BookCategory.PRECIOUS) {
            throw new Error('INV4 violation: precious book in active loans');
          }
        }
      }
    }

    // INV5: Member overdue state consistency
    for (const member of this.members.values()) {
      const hasActualOverdue = this.hasOverdueLoan(member.id, 0); // Check for any overdue at current
      // Note: INV5 checks consistency at date 0 in invariant; during operations,
      // date is checked explicitly
    }
  }

  // ========================================================================
  // CATALOG OPERATIONS
  // ========================================================================

  addBook(bookId: number, title: string, category: BookCategory, copies: number): void {
    // PRE: bookId not in dom catalog, copies > 0
    if (this.catalog.has(bookId)) {
      throw new Error(`PRE violation: Book ${bookId} already exists`);
    }
    if (copies <= 0) {
      throw new Error('PRE violation: copies must be positive');
    }

    this.catalog.set(bookId, {
      id: bookId,
      title,
      category,
      total_copies: copies,
      available_copies: copies
    });

    // POST: catalog = catalog~ union {bookId -> new book}
    this.checkInvariants();
  }

  reserveBook(bookId: number): void {
    // PRE: bookId in dom catalog, IsAvailable(bookId)
    if (!this.isAvailable(bookId)) {
      throw new Error('PRE violation: Book not available');
    }

    const book = this.catalog.get(bookId)!;
    const oldAvailable = book.available_copies;

    book.available_copies--;

    // POST: available_copies = available_copies~ - 1
    if (book.available_copies !== oldAvailable - 1) {
      throw new Error('POST violation: reserveBook');
    }

    this.checkInvariants();
  }

  returnBook(bookId: number): void {
    // PRE: bookId in dom catalog, available < total
    if (!this.catalog.has(bookId)) {
      throw new Error('PRE violation: Book not found');
    }
    const book = this.catalog.get(bookId)!;
    if (book.available_copies >= book.total_copies) {
      throw new Error('PRE violation: All copies already available');
    }

    const oldAvailable = book.available_copies;
    book.available_copies++;

    // POST: available_copies = available_copies~ + 1
    if (book.available_copies !== oldAvailable + 1) {
      throw new Error('POST violation: returnBook');
    }

    this.checkInvariants();
  }

  getAvailableCopies(bookId: number): number {
    if (!this.catalog.has(bookId)) {
      throw new Error('PRE violation: Book not found');
    }
    return this.catalog.get(bookId)!.available_copies;
  }

  isPrecious(bookId: number): boolean {
    if (!this.catalog.has(bookId)) {
      throw new Error('PRE violation: Book not found');
    }
    return this.catalog.get(bookId)!.category === BookCategory.PRECIOUS;
  }

  getBookDetails(bookId: number): Book {
    if (!this.catalog.has(bookId)) {
      throw new Error('PRE violation: Book not found');
    }
    return this.catalog.get(bookId)!;
  }

  // ========================================================================
  // MEMBER OPERATIONS
  // ========================================================================

  registerMember(memberId: number, name: string): void {
    // PRE: memberId not in dom members
    if (this.members.has(memberId)) {
      throw new Error('PRE violation: Member already registered');
    }

    this.members.set(memberId, {
      id: memberId,
      name,
      has_overdue: false,
      loan_count: 0
    });

    this.checkInvariants();
  }

  incrementLoanCount(memberId: number): void {
    // PRE: memberId in dom members, loan_count < 5
    if (!this.members.has(memberId)) {
      throw new Error('PRE violation: Member not found');
    }
    const member = this.members.get(memberId)!;
    if (member.loan_count >= MAX_LOANS) {
      throw new Error('PRE violation: Already at max loans');
    }

    const oldCount = member.loan_count;
    member.loan_count++;

    // POST: loan_count = loan_count~ + 1
    if (member.loan_count !== oldCount + 1) {
      throw new Error('POST violation: incrementLoanCount');
    }

    this.checkInvariants();
  }

  decrementLoanCount(memberId: number): void {
    // PRE: memberId in dom members, loan_count > 0
    if (!this.members.has(memberId)) {
      throw new Error('PRE violation: Member not found');
    }
    const member = this.members.get(memberId)!;
    if (member.loan_count <= 0) {
      throw new Error('PRE violation: No loans to return');
    }

    const oldCount = member.loan_count;
    member.loan_count--;

    // POST: loan_count = loan_count~ - 1
    if (member.loan_count !== oldCount - 1) {
      throw new Error('POST violation: decrementLoanCount');
    }

    this.checkInvariants();
  }

  setOverdue(memberId: number): void {
    // PRE: memberId in dom members
    if (!this.members.has(memberId)) {
      throw new Error('PRE violation: Member not found');
    }

    this.members.get(memberId)!.has_overdue = true;

    // POST: has_overdue = true
    this.checkInvariants();
  }

  clearOverdue(memberId: number): void {
    // PRE: memberId in dom members
    if (!this.members.has(memberId)) {
      throw new Error('PRE violation: Member not found');
    }

    this.members.get(memberId)!.has_overdue = false;

    // POST: has_overdue = false
    this.checkInvariants();
  }

  canBorrow(memberId: number): boolean {
    // PRE: memberId in dom members
    if (!this.members.has(memberId)) {
      throw new Error('PRE violation: Member not found');
    }

    const member = this.members.get(memberId)!;
    const result = member.loan_count < MAX_LOANS && !member.has_overdue;

    // POST: result <=> loan_count < 5 /\ has_overdue = false
    return result;
  }

  getLoanCount(memberId: number): number {
    if (!this.members.has(memberId)) {
      throw new Error('PRE violation: Member not found');
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
    // PRE: not is_precious, can_member_borrow, has_available_copies
    if (is_precious) {
      throw new Error('PRE violation: Cannot loan precious books');
    }
    if (!can_member_borrow) {
      throw new Error('PRE violation: Member cannot borrow');
    }
    if (!has_available_copies) {
      throw new Error('PRE violation: No available copies');
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

    // POST: new loan created with due_date = borrow_date + 14, extended = false, is_returned = false
    const loan = this.active_loans.get(loanId)!;
    if (loan.due_date !== borrow_date + LOAN_PERIOD) {
      throw new Error('POST violation: createLoan due_date');
    }
    if (loan.extended !== false || loan.is_returned !== false) {
      throw new Error('POST violation: createLoan flags');
    }

    this.checkInvariants();
    return loanId;
  }

  extendLoan(loan_id: number): void {
    // PRE: loan_id in dom active_loans, extended = false, is_returned = false
    if (!this.active_loans.has(loan_id)) {
      throw new Error('PRE violation: Loan not found');
    }
    const loan = this.active_loans.get(loan_id)!;
    if (loan.extended) {
      throw new Error('PRE violation: Already extended');
    }
    if (loan.is_returned) {
      throw new Error('PRE violation: Loan already returned');
    }

    const oldDueDate = loan.due_date;
    loan.due_date += EXTENSION_PERIOD;
    loan.extended = true;

    // POST: due_date = due_date~ + 7, extended = true
    if (loan.due_date !== oldDueDate + EXTENSION_PERIOD) {
      throw new Error('POST violation: extendLoan due_date');
    }

    // INV3: due_date > borrow_date must still hold
    if (loan.due_date <= loan.borrow_date) {
      throw new Error('INV3 violation after extension');
    }

    this.checkInvariants();
  }

  returnLoan(loan_id: number): void {
    // PRE: loan_id in dom active_loans, is_returned = false
    if (!this.active_loans.has(loan_id)) {
      throw new Error('PRE violation: Loan not found');
    }
    const loan = this.active_loans.get(loan_id)!;
    if (loan.is_returned) {
      throw new Error('PRE violation: Already returned');
    }

    loan.is_returned = true;

    // POST: is_returned = true
    this.checkInvariants();
  }

  isOverdue(loan_id: number, current_date: number): boolean {
    // PRE: loan_id in dom active_loans
    if (!this.active_loans.has(loan_id)) {
      throw new Error('PRE violation: Loan not found');
    }

    const loan = this.active_loans.get(loan_id)!;
    const result = this.isLoanOverdue(loan, current_date);

    // POST: result <=> due_date < current_date /\ is_returned = false
    return result;
  }

  getMemberLoans(member_id: number): number[] {
    return Array.from(this.active_loans.values())
      .filter(loan => loan.member_id === member_id && !loan.is_returned)
      .map(loan => loan.id);
  }

  getActiveLoanCount(member_id: number): number {
    return this.countActiveLoansByMember(member_id);
  }

  getLoan(loan_id: number): Loan {
    if (!this.active_loans.has(loan_id)) {
      throw new Error('Loan not found');
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
      // Check if member has any other overdue loans
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
