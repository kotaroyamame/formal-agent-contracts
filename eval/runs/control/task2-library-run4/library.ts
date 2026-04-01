/**
 * Library Loan Management System - RUN 4
 * Minimal approach - all features work but minimal validation
 * Fewest tests, most likely to pass basic checks but fail edge cases
 *
 * INTENTIONAL GAPS:
 * - Minimal validation on inputs
 * - Weak consistency checks
 * - Minimal test coverage
 * - Edge cases largely unhandled
 */

type BookCategory = "一般" | "参考" | "貴重";

class Book {
  id: string;
  title: string;
  author: string;
  category: BookCategory;
  stock: number;

  constructor(
    id: string,
    title: string,
    author: string,
    category: BookCategory,
    stock: number
  ) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.category = category;
    this.stock = stock;
  }
}

class Member {
  id: string;
  name: string;
  loans: string[] = [];
  overdue: boolean = false;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

class Loan {
  id: string;
  memberId: string;
  bookId: string;
  dueDate: Date;
  returnDate: Date | null = null;
  extended: boolean = false;

  constructor(id: string, memberId: string, bookId: string, dueDate: Date) {
    this.id = id;
    this.memberId = memberId;
    this.bookId = bookId;
    this.dueDate = dueDate;
  }
}

class CatalogAgent {
  private books: Map<string, Book> = new Map();
  private counter = 0;

  addBook(title: string, author: string, category: BookCategory, stock: number): string {
    const id = `B${++this.counter}`;
    this.books.set(id, new Book(id, title, author, category, stock));
    return id;
  }

  getBook(id: string): Book | undefined {
    return this.books.get(id);
  }

  search(title: string): Book[] {
    return Array.from(this.books.values()).filter((b) => b.title.includes(title));
  }

  decrementStock(id: string): boolean {
    const book = this.books.get(id);
    if (book && book.stock > 0) {
      book.stock--;
      return true;
    }
    return false;
  }

  incrementStock(id: string): boolean {
    const book = this.books.get(id);
    if (book) {
      book.stock++;
      return true;
    }
    return false;
  }
}

class MemberAgent {
  private members: Map<string, Member> = new Map();
  private counter = 0;

  register(name: string): string {
    const id = `M${++this.counter}`;
    this.members.set(id, new Member(id, name));
    return id;
  }

  getMember(id: string): Member | undefined {
    return this.members.get(id);
  }

  addLoan(memberId: string, loanId: string): boolean {
    const member = this.members.get(memberId);
    if (member) {
      member.loans.push(loanId);
      return true;
    }
    return false;
  }

  removeLoan(memberId: string, loanId: string): boolean {
    const member = this.members.get(memberId);
    if (member) {
      const idx = member.loans.indexOf(loanId);
      if (idx >= 0) {
        member.loans.splice(idx, 1);
        return true;
      }
    }
    return false;
  }
}

class LoanAgent {
  private loans: Map<string, Loan> = new Map();
  private counter = 0;
  private catalog: CatalogAgent;
  private members: MemberAgent;

  constructor(catalog: CatalogAgent, members: MemberAgent) {
    this.catalog = catalog;
    this.members = members;
  }

  borrow(memberId: string, bookId: string): string | null {
    const member = this.members.getMember(memberId);
    if (!member) return null;

    const book = this.catalog.getBook(bookId);
    if (!book) return null;

    if (book.category === "貴重") return null;
    if (book.stock === 0) return null;
    if (member.overdue) return null;
    if (member.loans.length >= 5) return null;

    const id = `L${++this.counter}`;
    const due = new Date(Date.now() + 14 * 24 * 3600000);
    const loan = new Loan(id, memberId, bookId, due);

    this.catalog.decrementStock(bookId);
    this.loans.set(id, loan);
    this.members.addLoan(memberId, id);

    return id;
  }

  return(loanId: string): boolean {
    const loan = this.loans.get(loanId);
    if (!loan || loan.returnDate) return false;

    loan.returnDate = new Date();
    this.catalog.incrementStock(loan.bookId);
    this.members.removeLoan(loan.memberId, loanId);

    return true;
  }

  extend(loanId: string): boolean {
    const loan = this.loans.get(loanId);
    if (!loan || loan.returnDate || loan.extended) return false;

    loan.extended = true;
    loan.dueDate = new Date(loan.dueDate.getTime() + 7 * 24 * 3600000);

    return true;
  }

  getLoan(loanId: string): Loan | undefined {
    return this.loans.get(loanId);
  }

  checkOverdue(): void {
    const now = new Date();
    this.loans.forEach((loan) => {
      if (!loan.returnDate && loan.dueDate < now) {
        const member = this.members.getMember(loan.memberId);
        if (member) member.overdue = true;
      }
    });
  }
}

export { CatalogAgent, MemberAgent, LoanAgent, Book, Member, Loan };
