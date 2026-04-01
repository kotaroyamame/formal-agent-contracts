/**
 * Library Loan Management System - RUN 5
 * Best effort control implementation
 * Most comprehensive tests and edge case handling
 *
 * INTENTIONAL GAPS:
 * - No reservation system
 * - Limited atomicity for concurrent operations
 * - Doesn't track overdue-return-immediate-reborrow sequences
 * - No tracking of double extension attempts across restarts
 */

type BookCategory = "一般" | "参考" | "貴重";

interface BookData {
  id: string;
  title: string;
  author: string;
  category: BookCategory;
  totalCopies: number;
  availableCopies: number;
  lastUpdated: Date;
}

interface MemberData {
  id: string;
  name: string;
  registrationDate: Date;
  status: "active" | "suspended";
  activeLoans: string[];
  overdueCount: number;
}

interface LoanData {
  id: string;
  memberId: string;
  bookId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  extensionCount: number;
  status: "borrowed" | "returned" | "overdue";
}

// ========== CatalogAgent ==========

class CatalogAgent {
  private books: Map<string, BookData> = new Map();
  private nextBookId = 0;

  registerBook(
    title: string,
    author: string,
    category: BookCategory,
    initialStock: number
  ): string {
    if (initialStock < 0) {
      throw new Error("Stock cannot be negative");
    }

    const id = `CAT-${String(++this.nextBookId).padStart(6, "0")}`;
    this.books.set(id, {
      id,
      title,
      author,
      category,
      totalCopies: initialStock,
      availableCopies: initialStock,
      lastUpdated: new Date(),
    });
    return id;
  }

  getBook(bookId: string): BookData | null {
    return this.books.get(bookId) || null;
  }

  searchByTitle(query: string): BookData[] {
    return Array.from(this.books.values()).filter((book) =>
      book.title.toLowerCase().includes(query.toLowerCase())
    );
  }

  searchByCategory(category: BookCategory): BookData[] {
    return Array.from(this.books.values()).filter(
      (book) => book.category === category
    );
  }

  searchByAuthor(query: string): BookData[] {
    return Array.from(this.books.values()).filter((book) =>
      book.author.toLowerCase().includes(query.toLowerCase())
    );
  }

  reserveBook(bookId: string): boolean {
    const book = this.books.get(bookId);
    if (!book) return false;
    if (book.availableCopies <= 0) return false;
    book.availableCopies--;
    book.lastUpdated = new Date();
    return true;
  }

  releaseBook(bookId: string): boolean {
    const book = this.books.get(bookId);
    if (!book) return false;
    if (book.availableCopies >= book.totalCopies) return false;
    book.availableCopies++;
    book.lastUpdated = new Date();
    return true;
  }

  isAvailable(bookId: string): boolean {
    const book = this.books.get(bookId);
    return book ? book.availableCopies > 0 : false;
  }

  getAvailableCount(bookId: string): number {
    const book = this.books.get(bookId);
    return book ? book.availableCopies : 0;
  }

  isBorrowable(bookId: string): boolean {
    const book = this.books.get(bookId);
    if (!book) return false;
    if (book.category === "貴重") return false;
    return book.availableCopies > 0;
  }

  getAllBooks(): BookData[] {
    return Array.from(this.books.values());
  }
}

// ========== MemberAgent ==========

class MemberAgent {
  private members: Map<string, MemberData> = new Map();
  private nextMemberId = 0;

  registerMember(name: string): string {
    if (!name || name.trim().length === 0) {
      throw new Error("Member name cannot be empty");
    }

    const id = `MEM-${String(++this.nextMemberId).padStart(6, "0")}`;
    this.members.set(id, {
      id,
      name: name.trim(),
      registrationDate: new Date(),
      status: "active",
      activeLoans: [],
      overdueCount: 0,
    });
    return id;
  }

  getMember(memberId: string): MemberData | null {
    return this.members.get(memberId) || null;
  }

  canBorrow(memberId: string): boolean {
    const member = this.members.get(memberId);
    if (!member) return false;
    if (member.status === "suspended") return false;
    if (member.activeLoans.length >= 5) return false;
    // Strict: cannot borrow if ANY overdue loans exist
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
    const index = member.activeLoans.indexOf(loanId);
    if (index === -1) return false;
    member.activeLoans.splice(index, 1);
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

  clearOverdueStatus(memberId: string): void {
    const member = this.members.get(memberId);
    if (member) {
      if (member.activeLoans.length === 0) {
        member.status = "active";
        member.overdueCount = 0;
      }
    }
  }

  getAllMembers(): MemberData[] {
    return Array.from(this.members.values());
  }
}

// ========== LoanAgent ==========

class LoanAgent {
  private loans: Map<string, LoanData> = new Map();
  private nextLoanId = 0;
  private catalogAgent: CatalogAgent;
  private memberAgent: MemberAgent;

  constructor(catalogAgent: CatalogAgent, memberAgent: MemberAgent) {
    this.catalogAgent = catalogAgent;
    this.memberAgent = memberAgent;
  }

  borrowBook(memberId: string, bookId: string): string | null {
    // Validate member
    const member = this.memberAgent.getMember(memberId);
    if (!member) return null;

    // Check eligibility
    if (!this.memberAgent.canBorrow(memberId)) return null;

    // Validate book
    const book = this.catalogAgent.getBook(bookId);
    if (!book) return null;

    // Check borrowability
    if (!this.catalogAgent.isBorrowable(bookId)) return null;

    // Reserve book
    if (!this.catalogAgent.reserveBook(bookId)) return null;

    // Create loan
    const loanId = `LOAN-${String(++this.nextLoanId).padStart(8, "0")}`;
    const borrowDate = new Date();
    const dueDate = new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    const loan: LoanData = {
      id: loanId,
      memberId,
      bookId,
      borrowDate,
      dueDate,
      returnDate: null,
      extensionCount: 0,
      status: "borrowed",
    };

    this.loans.set(loanId, loan);

    // Register with member
    if (!this.memberAgent.addLoan(memberId, loanId)) {
      // Rollback
      this.catalogAgent.releaseBook(bookId);
      this.loans.delete(loanId);
      return null;
    }

    return loanId;
  }

  returnBook(loanId: string): boolean {
    const loan = this.loans.get(loanId);
    if (!loan) return false;
    if (loan.returnDate !== null) return false; // Already returned

    const now = new Date();
    loan.returnDate = now;

    // Check if overdue
    if (now > loan.dueDate && loan.status !== "overdue") {
      loan.status = "overdue";
    } else {
      loan.status = "returned";
    }

    // Release book
    this.catalogAgent.releaseBook(loan.bookId);

    // Remove from member's loans
    this.memberAgent.removeLoan(loan.memberId, loanId);

    return true;
  }

  extendLoan(loanId: string): boolean {
    const loan = this.loans.get(loanId);
    if (!loan) return false;
    if (loan.returnDate !== null) return false; // Already returned
    if (loan.extensionCount >= 1) return false; // Already extended once

    loan.extensionCount++;
    loan.dueDate = new Date(
      loan.dueDate.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    return true;
  }

  getLoan(loanId: string): LoanData | null {
    return this.loans.get(loanId) || null;
  }

  getActiveLoansByMember(memberId: string): LoanData[] {
    return Array.from(this.loans.values()).filter(
      (loan) => loan.memberId === memberId && loan.returnDate === null
    );
  }

  getAllLoans(): LoanData[] {
    return Array.from(this.loans.values());
  }

  detectAndMarkOverdueLoans(): void {
    const now = new Date();
    this.loans.forEach((loan) => {
      if (loan.returnDate === null && loan.dueDate < now) {
        if (loan.status !== "overdue") {
          loan.status = "overdue";
          this.memberAgent.markOverdue(loan.memberId);
        }
      }
    });
  }

  getOverdueLoans(): LoanData[] {
    return Array.from(this.loans.values()).filter(
      (loan) => loan.status === "overdue"
    );
  }
}

// ========== Export ==========

export { CatalogAgent, MemberAgent, LoanAgent };
export type { BookData, MemberData, LoanData, BookCategory };
