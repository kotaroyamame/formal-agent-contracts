/**
 * Bank Account Management System
 * A simple TypeScript implementation for managing bank accounts with deposits, withdrawals, and transfers
 */

export class BankAccount {
  private accountHolder: string;
  private balance: number;

  constructor(accountHolder: string, initialBalance: number) {
    if (!accountHolder) {
      throw new Error("Account holder name cannot be empty");
    }
    this.accountHolder = accountHolder;
    this.balance = initialBalance;
  }

  /**
   * Get the current balance
   */
  getBalance(): number {
    return this.balance;
  }

  /**
   * Get the account holder's name
   */
  getAccountHolder(): string {
    return this.accountHolder;
  }

  /**
   * Deposit money into the account
   */
  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error("Deposit amount must be greater than 0");
    }
    this.balance += amount;
  }

  /**
   * Withdraw money from the account
   * - Balance cannot go below 0
   * - Maximum withdrawal is 1,000,000
   */
  withdraw(amount: number): void {
    if (amount <= 0) {
      throw new Error("Withdrawal amount must be greater than 0");
    }
    if (amount > 1000000) {
      throw new Error("Withdrawal limit exceeded: maximum 1,000,000 per transaction");
    }
    if (this.balance - amount < 0) {
      throw new Error("Insufficient balance for this withdrawal");
    }
    this.balance -= amount;
  }

  /**
   * Transfer money to another account
   * - Sender and receiver must be different accounts
   * - Balance cannot go below 0 on sender's account
   * - Maximum transfer is limited by withdrawal limit
   */
  transferTo(recipient: BankAccount, amount: number): void {
    if (this === recipient) {
      throw new Error("Cannot transfer to the same account");
    }
    if (amount <= 0) {
      throw new Error("Transfer amount must be greater than 0");
    }
    if (amount > 1000000) {
      throw new Error("Transfer limit exceeded: maximum 1,000,000 per transaction");
    }
    if (this.balance - amount < 0) {
      throw new Error("Insufficient balance for this transfer");
    }

    this.balance -= amount;
    recipient.balance += amount;
  }
}

export class BankAccountManager {
  private accounts: Map<string, BankAccount> = new Map();

  /**
   * Create a new account
   */
  createAccount(
    accountHolder: string,
    initialBalance: number = 0
  ): BankAccount {
    if (!accountHolder) {
      throw new Error("Account holder name cannot be empty");
    }
    const account = new BankAccount(accountHolder, initialBalance);
    this.accounts.set(accountHolder, account);
    return account;
  }

  /**
   * Get account by holder name
   */
  getAccount(accountHolder: string): BankAccount | undefined {
    return this.accounts.get(accountHolder);
  }

  /**
   * Get all accounts
   */
  getAllAccounts(): BankAccount[] {
    return Array.from(this.accounts.values());
  }
}
