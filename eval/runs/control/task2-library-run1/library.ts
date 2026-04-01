/**
 * Library Loan Management System - RUN 1
 * Standard OOP approach with 3 agent classes
 * Implements core features without formal methods
 *
 * INTENTIONAL GAPS:
 * - No reservation system
 * - No handling of return-then-immediately-borrow race conditions
 * - Stock consistency between agents not guaranteed
 * - Doesn't handle multiple copies of same book properly
 * - No protection against double extension attempts
 */

// ========== TYPE Definitions ==========

type BookCategory = "一般" | "参考" | "貴重";

interface Book {
  id: string;
  title: string;
  author: string;
  category: BookCategory;
  stock: number;
}

interface Member {
  id: string;
  name: string;
  registeredAt: Date;
  isOverdue: boolean;
  activeLoans: LoanRecord[];
}

interface LoanRecord {
  loanId: string;
  memberId: string;
  bookId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  isExtended: boolean;
}

// ========== CatalogAgent ==========

class CatalogAgent {
  private books: Map<string, Book> = new Map();
  private bookIdCounter = 0;

  registerBook(
    title: string,
    author: string,
    category: BookCategory,
    initialStock: number
  ): string {
    const id = `BOOK-${++this.bookIdCounter}`;
    this.books.set(id, {
      id,
      title,
      author,
      category,
      stock: initialStock,
    });
    return id;
  }

  getBook(bookId: string): Book | undefined {
    return this.books.get(bookId);
  }

  searchByTitle(query: string): Book[] {
    return Array.from(this.books.values()).filter((book) =>
      book.title.includes(query)
    );
  }

  searchByCategory(category: BookCategory): Book[] {
    return Array.from(this.books.values()).filter(
      (book) => book.category === category
    );
  }

  decreaseStock(bookId: string): boolean {
    const book = this.books.get(bookId);
    if (!book) return false;
    if (book.stock <= 0) return false;
    book.stock--;
    return true;
  }

  increaseStock(bookId: string): boolean {
    const book = this.books.get(bookId);
    if (!book) return false;
    book.stock++;
    return true;
  }

  getStock(bookId: string): number {
    const book = this.books.get(bookId);
    return book ? book.stock : 0;
  }

  getAllBooks(): Book[] {
    return Array.from(this.books.values());
  }
}

// ========== MemberAgent ==========

class MemberAgent {
  private members: Map<string, Member> = new Map();
  private memberIdCounter = 0;

  registerMember(name: string): string {
    const id = `MEMBER-${++this.memberIdCounter}`;
    this.members.set(id, {
      id,
      name,
      registeredAt: new Date(),
      isOverdue: false,
      activeLoans: [],
    });
    return id;
  }

  getMember(memberId: string): Member | undefined {
    return this.members.get(memberId);
  }

  isEligibleToBorrow(memberId: string): boolean {
    const member = this.members.get(memberId);
    if (!member) return false;
    return !member.isOverdue && member.activeLoans.length < 5;
  }

  addActiveLoan(memberId: string, loan: LoanRecord): boolean {
    const member = this.members.get(memberId);
    if (!member) return false;
    if (member.activeLoans.length >= 5) return false;
    member.activeLoans.push(loan);
    return true;
  }

  removeLoan(memberId: string, loanId: string): boolean {
    const member = this.members.get(memberId);
    if (!member) return false;
    const index = member.activeLoans.findIndex(
      (loan) => loan.loanId === loanId
    );
    if (index === -1) return false;
    member.activeLoans.splice(index, 1);
    return true;
  }

  markOverdue(memberId: string): void {
    const member = this.members.get(memberId);
    if (member) {
      member.isOverdue = true;
    }
  }

  clearOverdue(memberId: string): void {
    const member = this.members.get(memberId);
    if (member) {
      member.isOverdue = false;
    }
  }

  getActiveLoanCount(memberId: string): number {
    const member = this.members.get(memberId);
    return member ? member.activeLoans.length : 0;
  }

  getAllMembers(): Member[] {
    return Array.from(this.members.values());
  }
}

// ========== LoanAgent ==========

class LoanAgent {
  private loans: Map<string, LoanRecord> = new Map();
  private loanIdCounter = 0;
  private catalogAgent: CatalogAgent;
  private memberAgent: MemberAgent;

  constructor(catalogAgent: CatalogAgent, memberAgent: MemberAgent) {
    this.catalogAgent = catalogAgent;
    this.memberAgent = memberAgent;
  }

  borrowBook(memberId: string, bookId: string): string | null {
    // Check member exists
    const member = this.memberAgent.getMember(memberId);
    if (!member) return null;

    // Check if member is overdue
    if (member.isOverdue) return null;

    // Check book exists
    const book = this.catalogAgent.getBook(bookId);
    if (!book) return null;

    // Check stock
    if (book.stock <= 0) return null;

    // Precious books cannot be borrowed
    if (book.category === "貴重") return null;

    // Check 5-book limit
    if (member.activeLoans.length >= 5) return null;

    // Create loan record
    const loanId = `LOAN-${++this.loanIdCounter}`;
    const borrowDate = new Date();
    const dueDate = new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    const loan: LoanRecord = {
      loanId,
      memberId,
      bookId,
      borrowDate,
      dueDate,
      returnDate: null,
      isExtended: false,
    };

    // Decrease stock and add loan
    if (this.catalogAgent.decreaseStock(bookId)) {
      this.loans.set(loanId, loan);
      this.memberAgent.addActiveLoan(memberId, loan);
      return loanId;
    }

    return null;
  }

  returnBook(loanId: string): boolean {
    const loan = this.loans.get(loanId);
    if (!loan) return false;
    if (loan.returnDate) return false; // Already returned

    loan.returnDate = new Date();

    // Increase stock
    this.catalogAgent.increaseStock(loan.bookId);

    // Remove from active loans
    this.memberAgent.removeLoan(loan.memberId, loanId);

    return true;
  }

  extendLoan(loanId: string): boolean {
    const loan = this.loans.get(loanId);
    if (!loan) return false;
    if (loan.returnDate) return false; // Already returned
    if (loan.isExtended) return false; // Already extended

    loan.isExtended = true;
    loan.dueDate = new Date(loan.dueDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    return true;
  }

  checkOverdueLoans(): void {
    const now = new Date();

    this.loans.forEach((loan) => {
      if (!loan.returnDate && loan.dueDate < now) {
        this.memberAgent.markOverdue(loan.memberId);
      }
    });
  }

  getLoan(loanId: string): LoanRecord | undefined {
    return this.loans.get(loanId);
  }

  getActiveLoansByMember(memberId: string): LoanRecord[] {
    return Array.from(this.loans.values()).filter(
      (loan) =>
        loan.memberId === memberId && loan.returnDate === null
    );
  }

  getAllLoans(): LoanRecord[] {
    return Array.from(this.loans.values());
  }
}

// ========== Export ==========

export { CatalogAgent, MemberAgent, LoanAgent };
export type { Book, Member, LoanRecord, BookCategory };
