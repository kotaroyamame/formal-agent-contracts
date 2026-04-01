/**
 * Library Loan Management System - RUN 3
 * More modular design with separate agent classes
 * Better organization and comprehensive rule checking
 *
 * INTENTIONAL GAPS:
 * - No reservation system
 * - Stock consistency across agents not guaranteed under concurrent access
 * - Extended-then-overdue scenario handling incomplete
 * - Last copy edge case when multiple agents access concurrently
 */

type BookCategory = "一般" | "参考" | "貴重";

interface BookRecord {
  id: string;
  title: string;
  author: string;
  category: BookCategory;
  totalCopies: number;
  availableCopies: number;
}

interface MemberRecord {
  id: string;
  name: string;
  status: "active" | "suspended";
  overdueCount: number;
  activeLoans: string[];
}

interface LoanTransactionRecord {
  id: string;
  memberId: string;
  bookId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  extensionCount: number;
  status: "active" | "returned" | "overdue";
}

// ========== CatalogAgent ==========

class CatalogAgent {
  private catalog: Map<string, BookRecord> = new Map();
  private bookIdSeq = 0;

  registerBook(
    title: string,
    author: string,
    category: BookCategory,
    copies: number
  ): string {
    const bookId = `B${String(++this.bookIdSeq).padStart(5, "0")}`;
    this.catalog.set(bookId, {
      id: bookId,
      title,
      author,
      category,
      totalCopies: copies,
      availableCopies: copies,
    });
    return bookId;
  }

  getBook(bookId: string): BookRecord | null {
    const book = this.catalog.get(bookId);
    return book || null;
  }

  searchBooks(criteria: {
    title?: string;
    author?: string;
    category?: BookCategory;
  }): BookRecord[] {
    return Array.from(this.catalog.values()).filter((book) => {
      if (criteria.title && !book.title.includes(criteria.title)) return false;
      if (criteria.author && !book.author.includes(criteria.author))
        return false;
      if (criteria.category && book.category !== criteria.category)
        return false;
      return true;
    });
  }

  canBorrow(bookId: string): boolean {
    const book = this.catalog.get(bookId);
    if (!book) return false;
    if (book.category === "貴重") return false;
    return book.availableCopies > 0;
  }

  borrowBook(bookId: string): boolean {
    const book = this.catalog.get(bookId);
    if (!book) return false;
    if (book.availableCopies <= 0) return false;
    book.availableCopies--;
    return true;
  }

  returnBook(bookId: string): boolean {
    const book = this.catalog.get(bookId);
    if (!book) return false;
    if (book.availableCopies >= book.totalCopies) return false;
    book.availableCopies++;
    return true;
  }

  getAvailability(bookId: string): number {
    const book = this.catalog.get(bookId);
    return book ? book.availableCopies : 0;
  }

  getAllBooks(): BookRecord[] {
    return Array.from(this.catalog.values());
  }
}

// ========== MemberAgent ==========

class MemberAgent {
  private members: Map<string, MemberRecord> = new Map();
  private memberIdSeq = 0;

  registerMember(name: string): string {
    const memberId = `M${String(++this.memberIdSeq).padStart(5, "0")}`;
    this.members.set(memberId, {
      id: memberId,
      name,
      status: "active",
      overdueCount: 0,
      activeLoans: [],
    });
    return memberId;
  }

  getMember(memberId: string): MemberRecord | null {
    const member = this.members.get(memberId);
    return member || null;
  }

  canBorrow(memberId: string): boolean {
    const member = this.members.get(memberId);
    if (!member) return false;
    if (member.status === "suspended") return false;
    if (member.activeLoans.length >= 5) return false;
    if (member.overdueCount > 0) return false;
    return true;
  }

  addLoan(memberId: string, loanId: string): boolean {
    const member = this.members.get(memberId);
    if (!member) return false;
    if (member.activeLoans.length >= 5) return false;
    member.activeLoans.push(loanId);
    return true;
  }

  removeLoan(memberId: string, loanId: string): boolean {
    const member = this.members.get(memberId);
    if (!member) return false;
    const idx = member.activeLoans.indexOf(loanId);
    if (idx === -1) return false;
    member.activeLoans.splice(idx, 1);
    return true;
  }

  getActiveLoanCount(memberId: string): number {
    const member = this.members.get(memberId);
    return member ? member.activeLoans.length : 0;
  }

  markOverdue(memberId: string): void {
    const member = this.members.get(memberId);
    if (member) {
      member.status = "suspended";
      member.overdueCount++;
    }
  }

  clearOverdue(memberId: string): void {
    const member = this.members.get(memberId);
    if (member) {
      member.status = "active";
      member.overdueCount = 0;
    }
  }

  getAllMembers(): MemberRecord[] {
    return Array.from(this.members.values());
  }
}

// ========== LoanAgent ==========

class LoanAgent {
  private loans: Map<string, LoanTransactionRecord> = new Map();
  private loanIdSeq = 0;
  private catalogAgent: CatalogAgent;
  private memberAgent: MemberAgent;

  constructor(catalogAgent: CatalogAgent, memberAgent: MemberAgent) {
    this.catalogAgent = catalogAgent;
    this.memberAgent = memberAgent;
  }

  borrowBook(memberId: string, bookId: string): string | null {
    // Validate member
    if (!this.memberAgent.getMember(memberId)) return null;
    if (!this.memberAgent.canBorrow(memberId)) return null;

    // Validate book
    const book = this.catalogAgent.getBook(bookId);
    if (!book) return null;
    if (book.category === "貴重") return null;
    if (!this.catalogAgent.canBorrow(bookId)) return null;

    // Execute borrow
    if (!this.catalogAgent.borrowBook(bookId)) return null;

    // Create loan record
    const loanId = `L${String(++this.loanIdSeq).padStart(8, "0")}`;
    const borrowDate = new Date();
    const dueDate = new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    const loan: LoanTransactionRecord = {
      id: loanId,
      memberId,
      bookId,
      borrowDate,
      dueDate,
      returnDate: null,
      extensionCount: 0,
      status: "active",
    };

    this.loans.set(loanId, loan);

    if (!this.memberAgent.addLoan(memberId, loanId)) {
      // Rollback
      this.catalogAgent.returnBook(bookId);
      this.loans.delete(loanId);
      return null;
    }

    return loanId;
  }

  returnBook(loanId: string): boolean {
    const loan = this.loans.get(loanId);
    if (!loan) return false;
    if (loan.returnDate) return false; // Already returned

    loan.returnDate = new Date();
    loan.status = "returned";

    this.catalogAgent.returnBook(loan.bookId);
    this.memberAgent.removeLoan(loan.memberId, loanId);

    return true;
  }

  extendBook(loanId: string): boolean {
    const loan = this.loans.get(loanId);
    if (!loan) return false;
    if (loan.returnDate) return false;
    if (loan.extensionCount >= 1) return false;

    loan.extensionCount++;
    loan.dueDate = new Date(loan.dueDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    return true;
  }

  getLoan(loanId: string): LoanTransactionRecord | null {
    return this.loans.get(loanId) || null;
  }

  getMemberLoans(memberId: string): LoanTransactionRecord[] {
    return Array.from(this.loans.values()).filter(
      (loan) => loan.memberId === memberId
    );
  }

  detectOverdueLoans(): void {
    const now = new Date();
    this.loans.forEach((loan) => {
      if (!loan.returnDate && loan.dueDate < now && loan.status !== "overdue") {
        loan.status = "overdue";
        this.memberAgent.markOverdue(loan.memberId);
      }
    });
  }

  getAllLoans(): LoanTransactionRecord[] {
    return Array.from(this.loans.values());
  }
}

// ========== Export ==========

export { CatalogAgent, MemberAgent, LoanAgent };
export type { BookRecord, MemberRecord, LoanTransactionRecord, BookCategory };
