/**
 * Bank Account System
 *
 * A simple TypeScript implementation of a bank account system with the following features:
 * - Account creation with name and initial balance
 * - Deposit and withdrawal operations
 * - Balance inquiry
 * - Transfer between accounts
 *
 * Business Rules:
 * - Balance cannot go below 0
 * - Maximum withdrawal amount per transaction is 1,000,000
 * - Account name cannot be empty
 * - Transfers must be between different accounts
 */

export interface Account {
  accountId: string;
  name: string;
  balance: number;
}

export class BankAccountManager {
  private accounts: Map<string, Account> = new Map();
  private nextAccountId: number = 1;

  /**
   * Creates a new bank account
   * @param name - Account holder's name (cannot be empty)
   * @param initialBalance - Initial balance (must be non-negative)
   * @returns Account ID
   * @throws Error if name is empty or initial balance is negative
   */
  createAccount(name: string, initialBalance: number): string {
    // Validate name is not empty
    if (!name || name.trim() === '') {
      throw new Error('Account name cannot be empty');
    }

    // Validate initial balance is non-negative
    if (initialBalance < 0) {
      throw new Error('Initial balance cannot be negative');
    }

    const accountId = `ACC-${this.nextAccountId++}`;
    this.accounts.set(accountId, {
      accountId,
      name,
      balance: initialBalance,
    });

    return accountId;
  }

  /**
   * Deposits money into an account
   * @param accountId - Account ID
   * @param amount - Amount to deposit (must be positive)
   * @throws Error if account not found or amount is invalid
   */
  deposit(accountId: string, amount: number): void {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    // Validate amount is positive
    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }

    account.balance += amount;
  }

  /**
   * Withdraws money from an account
   * @param accountId - Account ID
   * @param amount - Amount to withdraw (must be positive and <= 1,000,000)
   * @throws Error if account not found, insufficient balance, or amount exceeds limit
   */
  withdraw(accountId: string, amount: number): void {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    // Validate amount is positive
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }

    // Check withdrawal limit
    if (amount > 1_000_000) {
      throw new Error('Withdrawal amount cannot exceed 1,000,000');
    }

    // Check sufficient balance
    if (account.balance < amount) {
      throw new Error('Insufficient balance');
    }

    account.balance -= amount;
  }

  /**
   * Gets the current balance of an account
   * @param accountId - Account ID
   * @returns Current balance
   * @throws Error if account not found
   */
  getBalance(accountId: string): number {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }
    return account.balance;
  }

  /**
   * Gets account information
   * @param accountId - Account ID
   * @returns Account details
   * @throws Error if account not found
   */
  getAccount(accountId: string): Account {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }
    return { ...account };
  }

  /**
   * Transfers money from one account to another
   * @param fromAccountId - Source account ID
   * @param toAccountId - Destination account ID
   * @param amount - Amount to transfer (must be positive)
   * @throws Error if accounts are the same, not found, or insufficient balance
   */
  transfer(fromAccountId: string, toAccountId: string, amount: number): void {
    // Validate accounts are different
    if (fromAccountId === toAccountId) {
      throw new Error('Transfer source and destination must be different accounts');
    }

    // Validate both accounts exist
    const fromAccount = this.accounts.get(fromAccountId);
    if (!fromAccount) {
      throw new Error(`Source account ${fromAccountId} not found`);
    }

    const toAccount = this.accounts.get(toAccountId);
    if (!toAccount) {
      throw new Error(`Destination account ${toAccountId} not found`);
    }

    // Validate amount is positive
    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    // Check sufficient balance in source account
    if (fromAccount.balance < amount) {
      throw new Error('Insufficient balance in source account');
    }

    // Perform transfer (simple implementation - not atomic)
    fromAccount.balance -= amount;
    toAccount.balance += amount;
  }
}
