/**
 * Library Loan Management System - RUN 2
 * Alternative class hierarchy using inheritance
 * Implements core features with different design patterns
 *
 * INTENTIONAL GAPS:
 * - No protection when overdue member returns and immediately tries to borrow
 * - Edge case: return 1 book when at 5-book limit, then immediately borrow
 * - Precious book edge cases with multiple copies
 * - No duplicate member registration prevention
 * - Weak overdue flag consistency
 */

type BookCategory = "一般" | "参考" | "貴重";

interface Book {
  id: string;
  title: string;
  author: string;
  category: BookCategory;
  stock: number;
  totalCopies: number;
}

interface Member {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  isOverdue: boolean;
  currentLoans: string[]; // loanIds
}

interface LoanRecord {
  id: string;
  memberId: string;
  bookId: string;
  borrowedAt: Date;
  dueDate: Date;
  returnedAt: Date | null;
  extended: boolean;
  extendedAt: Date | null;
}

// ========== Base Agent Class ==========

abstract class LibraryAgent {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }
}

// ========== CatalogAgent ==========

class CatalogAgent extends LibraryAgent {
  private books: Map<string, Book> = new Map();
  private bookCounter = 0;

  constructor() {
    super("CatalogAgent");
  }

  addBook(
    title: string,
    author: string,
    category: BookCategory,
    initialStock: number
  ): string {
    const bookId = `BOOK${++this.bookCounter}`;
    this.books.set(bookId, {
      id: bookId,
      title,
      author,
      category,
      stock: initialStock,
      totalCopies: initialStock,
    });
    return bookId;
  }

  findBook(bookId: string): Book | null {
    return this.books.get(bookId) || null;
  }

  findByTitle(title: string): Book[] {
    return Array.from(this.books.values()).filter((b) =>
      b.title.includes(title)
    );
  }

  findByCategory(category: BookCategory): Book[] {
    return Array.from(this.books.values()).filter((b) => b.category === category);
  }

  checkAvailability(bookId: string): boolean {
    const book = this.books.get(bookId);
    return book ? book.stock > 0 : false;
  }

  borrowCopy(bookId: string): boolean {
    const book = this.books.get(bookId);
    if (!book || book.stock <= 0) return false;
    book.stock--;
    return true;
  }

  returnCopy(bookId: string): boolean {
    const book = this.books.get(bookId);
    if (!book) return false;
    if (book.stock >= book.totalCopies) return false; // Already returned all
    book.stock++;
    return true;
  }

  listAllBooks(): Book[] {
    return Array.from(this.books.values());
  }
}

// ========== MemberAgent ==========

class MemberAgent extends LibraryAgent {
  private members: Map<string, Member> = new Map();
  private memberCounter = 0;

  constructor() {
    super("MemberAgent");
  }

  registerMember(name: string, email: string): string {
    const memberId = `MEM${++this.memberCounter}`;
    this.members.set(memberId, {
      id: memberId,
      name,
      email,
      createdAt: new Date(),
      isOverdue: false,
      currentLoans: [],
    });
    return memberId;
  }

  findMember(memberId: string): Member | null {
    return this.members.get(memberId) || null;
  }

  getOverdueStatus(memberId: string): boolean {
    const member = this.members.get(memberId);
    return member ? member.isOverdue : false;
  }

  setOverdue(memberId: string, overdue: boolean): void {
    const member = this.members.get(memberId);
    if (member) {
      member.isOverdue = overdue;
    }
  }

  getCurrentLoanCount(memberId: string): number {
    const member = this.members.get(memberId);
    return member ? member.currentLoans.length : 0;
  }

  addLoan(memberId: string, loanId: string): boolean {
    const member = this.members.get(memberId);
    if (!member) return false;
    if (member.currentLoans.length >= 5) return false;
    member.currentLoans.push(loanId);
    return true;
  }

  removeLoan(memberId: string, loanId: string): boolean {
    const member = this.members.get(memberId);
    if (!member) return false;
    const idx = member.currentLoans.indexOf(loanId);
    if (idx === -1) return false;
    member.currentLoans.splice(idx, 1);
    return true;
  }

  listAllMembers(): Member[] {
    return Array.from(this.members.values());
  }
}

// ========== LoanAgent ==========

class LoanAgent extends LibraryAgent {
  private loans: Map<string, LoanRecord> = new Map();
  private loanCounter = 0;
  private catalogAgent: CatalogAgent;
  private memberAgent: MemberAgent;

  constructor(catalogAgent: CatalogAgent, memberAgent: MemberAgent) {
    super("LoanAgent");
    this.catalogAgent = catalogAgent;
    this.memberAgent = memberAgent;
  }

  borrowBook(memberId: string, bookId: string): string | null {
    const member = this.memberAgent.findMember(memberId);
    if (!member) return null;

    // INTENTIONAL GAP: No re-check of overdue status after return
    if (member.isOverdue) return null;

    const book = this.catalogAgent.findBook(bookId);
    if (!book) return null;

    // Check precious book
    if (book.category === "貴重") return null;

    // Check stock
    if (!this.catalogAgent.checkAvailability(bookId)) return null;

    // Check 5-book limit
    if (member.currentLoans.length >= 5) return null;

    // Create loan
    const loanId = `LN${++this.loanCounter}`;
    const now = new Date();
    const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const loan: LoanRecord = {
      id: loanId,
      memberId,
      bookId,
      borrowedAt: now,
      dueDate,
      returnedAt: null,
      extended: false,
      extendedAt: null,
    };

    if (this.catalogAgent.borrowCopy(bookId)) {
      this.loans.set(loanId, loan);
      this.memberAgent.addLoan(memberId, loanId);
      return loanId;
    }

    return null;
  }

  returnBook(loanId: string): boolean {
    const loan = this.loans.get(loanId);
    if (!loan) return false;
    if (loan.returnedAt) return false;

    loan.returnedAt = new Date();

    // Return to catalog
    this.catalogAgent.returnCopy(loan.bookId);

    // Remove from member's loans
    this.memberAgent.removeLoan(loan.memberId, loanId);

    return true;
  }

  extendBook(loanId: string): boolean {
    const loan = this.loans.get(loanId);
    if (!loan) return false;
    if (loan.returnedAt) return false;
    if (loan.extended) return false;

    loan.extended = true;
    loan.extendedAt = new Date();
    loan.dueDate = new Date(loan.dueDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    return true;
  }

  getLoan(loanId: string): LoanRecord | null {
    return this.loans.get(loanId) || null;
  }

  getMemberLoans(memberId: string): LoanRecord[] {
    return Array.from(this.loans.values()).filter(
      (loan) => loan.memberId === memberId && loan.returnedAt === null
    );
  }

  processOverdueLoans(): void {
    const now = new Date();
    this.loans.forEach((loan) => {
      if (!loan.returnedAt && loan.dueDate < now) {
        this.memberAgent.setOverdue(loan.memberId, true);
      }
    });
  }

  getAllLoans(): LoanRecord[] {
    return Array.from(this.loans.values());
  }
}

// ========== Export ==========

export { CatalogAgent, MemberAgent, LoanAgent, LibraryAgent };
export type { Book, Member, LoanRecord, BookCategory };
