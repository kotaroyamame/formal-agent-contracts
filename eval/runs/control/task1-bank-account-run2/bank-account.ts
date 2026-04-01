/**
 * Bank Account Management System
 *
 * A TypeScript implementation of a bank account system supporting:
 * - Account creation with holder name and initial balance
 * - Deposits (credit)
 * - Withdrawals (debit) with a 1 million yen limit
 * - Balance inquiry
 * - Inter-account transfers
 */

interface Account {
  id: string;
  holderName: string;
  balance: number;
}

class BankSystem {
  private accounts: Map<string, Account>;
  private nextAccountId: number;

  constructor() {
    this.accounts = new Map();
    this.nextAccountId = 1;
  }

  /**
   * Creates a new bank account
   * @param holderName - Name of the account holder
   * @param initialBalance - Initial balance (defaults to 0)
   * @returns The account ID
   */
  openAccount(holderName: string, initialBalance: number = 0): string {
    if (!holderName || holderName.trim() === '') {
      throw new Error('Account holder name cannot be empty');
    }

    if (initialBalance < 0) {
      throw new Error('Initial balance cannot be negative');
    }

    const accountId = `ACC${String(this.nextAccountId).padStart(5, '0')}`;
    this.nextAccountId++;

    const newAccount: Account = {
      id: accountId,
      holderName: holderName.trim(),
      balance: initialBalance,
    };

    this.accounts.set(accountId, newAccount);
    return accountId;
  }

  /**
   * Deposits money into an account
   * @param accountId - The account ID
   * @param amount - Amount to deposit
   */
  deposit(accountId: string, amount: number): void {
    const account = this.getAccount(accountId);

    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }

    account.balance += amount;
  }

  /**
   * Withdraws money from an account
   * @param accountId - The account ID
   * @param amount - Amount to withdraw
   */
  withdraw(accountId: string, amount: number): void {
    const account = this.getAccount(accountId);

    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }

    if (amount > 1000000) {
      throw new Error('Withdrawal limit exceeded (max 1,000,000 yen)');
    }

    if (account.balance < amount) {
      throw new Error('Insufficient balance');
    }

    account.balance -= amount;
  }

  /**
   * Checks the balance of an account
   * @param accountId - The account ID
   * @returns The current balance
   */
  getBalance(accountId: string): number {
    const account = this.getAccount(accountId);
    return account.balance;
  }

  /**
   * Transfers money from one account to another
   * @param fromAccountId - Source account ID
   * @param toAccountId - Destination account ID
   * @param amount - Amount to transfer
   */
  transfer(fromAccountId: string, toAccountId: string, amount: number): void {
    if (fromAccountId === toAccountId) {
      throw new Error('Cannot transfer to the same account');
    }

    const fromAccount = this.getAccount(fromAccountId);
    const toAccount = this.getAccount(toAccountId);

    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    if (fromAccount.balance < amount) {
      throw new Error('Insufficient balance for transfer');
    }

    fromAccount.balance -= amount;
    toAccount.balance += amount;
  }

  /**
   * Gets account information
   * @param accountId - The account ID
   * @returns Account details
   */
  getAccountInfo(accountId: string): Account {
    return this.getAccount(accountId);
  }

  /**
   * Lists all accounts in the system
   * @returns Array of all accounts
   */
  listAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  /**
   * Internal helper to retrieve an account or throw if not found
   */
  private getAccount(accountId: string): Account {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }
    return account;
  }
}

export { BankSystem, Account };
