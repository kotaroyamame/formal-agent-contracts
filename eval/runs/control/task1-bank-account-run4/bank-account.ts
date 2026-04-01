/**
 * Bank Account System
 *
 * Features:
 * - Account opening (account holder name, initial balance)
 * - Deposit
 * - Withdrawal
 * - Balance inquiry
 * - Transfer between accounts
 *
 * Business Rules:
 * - Balance cannot be negative
 * - Maximum withdrawal per transaction: 1,000,000 yen
 * - Account holder name cannot be empty
 * - Transfer source and destination must be different
 */

export class BankAccount {
  private accountId: string;
  private holderName: string;
  private balance: number;

  constructor(accountId: string, holderName: string, initialBalance: number) {
    if (!holderName) {
      throw new Error("Account holder name cannot be empty");
    }

    this.accountId = accountId;
    this.holderName = holderName;
    this.balance = initialBalance;
  }

  getAccountId(): string {
    return this.accountId;
  }

  getHolderName(): string {
    return this.holderName;
  }

  getBalance(): number {
    return this.balance;
  }

  deposit(amount: number): void {
    this.balance += amount;
  }

  withdraw(amount: number): void {
    if (amount > 1000000) {
      throw new Error("Withdrawal amount exceeds maximum limit of 1,000,000 yen");
    }
    if (this.balance - amount < 0) {
      throw new Error("Insufficient balance");
    }
    this.balance -= amount;
  }

  transfer(recipient: BankAccount, amount: number): void {
    if (this.accountId === recipient.accountId) {
      throw new Error("Transfer source and destination must be different");
    }
    this.withdraw(amount);
    recipient.deposit(amount);
  }
}

export class BankSystem {
  private accounts: Map<string, BankAccount> = new Map();

  openAccount(accountId: string, holderName: string, initialBalance: number): BankAccount {
    if (this.accounts.has(accountId)) {
      throw new Error("Account already exists");
    }

    const account = new BankAccount(accountId, holderName, initialBalance);
    this.accounts.set(accountId, account);
    return account;
  }

  getAccount(accountId: string): BankAccount {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error("Account not found");
    }
    return account;
  }
}
