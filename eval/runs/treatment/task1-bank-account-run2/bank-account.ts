// Bank Account System - TypeScript Implementation (Run 2)
// VDM-SL with explicit invariants and branded types

// Branded types for type safety
type AccountId = number & { readonly __brand: "AccountId" };
type Money = number & { readonly __brand: "Money" };

const MAX_WITHDRAWAL = 1000000;
const MAX_BALANCE = 999999999;

interface Account {
  id: AccountId;
  name: string;
  balance: Money;
}

// Type invariant checkers
class Invariants {
  static isValidName(name: string): boolean {
    const trimmed = name.trim();
    return trimmed.length > 0;
  }

  static isValidMoney(m: Money): boolean {
    return m >= 0 && m < MAX_BALANCE;
  }

  static isValidAccount(acc: Account): boolean {
    return (
      Invariants.isValidName(acc.name) && Invariants.isValidMoney(acc.balance)
    );
  }

  static isValidAccounts(
    accounts: Map<AccountId, Account>
  ): boolean {
    for (const [id, acc] of accounts) {
      if (
        acc.id !== id ||
        !Invariants.isValidName(acc.name) ||
        !Invariants.isValidMoney(acc.balance)
      ) {
        return false;
      }
    }
    return true;
  }
}

// Helper functions to create branded types
function createAccountId(id: number): AccountId {
  if (id <= 0) throw new Error("AccountId must be positive");
  return id as AccountId;
}

function createMoney(amount: number): Money {
  if (!Number.isInteger(amount) || amount < 0 || amount >= MAX_BALANCE) {
    throw new Error(`Money must be integer in range [0, ${MAX_BALANCE})`);
  }
  return amount as Money;
}

// Bank Account System
class BankAccountSystem {
  private accounts: Map<AccountId, Account> = new Map();
  private nextAccountId: AccountId = createAccountId(1);

  // Check state invariant
  private checkStateInvariant(): void {
    if (!Invariants.isValidAccounts(this.accounts)) {
      throw new Error("State invariant violated");
    }
  }

  // OpenAccount: Create new account with name validation
  openAccount(name: string, initialBalance: Money): AccountId {
    // Pre-conditions: Validate name and balance
    if (!Invariants.isValidName(name)) {
      throw new Error(
        "Account name must not be empty or whitespace-only after trimming"
      );
    }
    if (!Invariants.isValidMoney(initialBalance)) {
      throw new Error("Initial balance is invalid");
    }

    const trimmedName = name.trim();
    const newId = this.nextAccountId;

    const newAccount: Account = {
      id: newId,
      name: trimmedName,
      balance: initialBalance,
    };

    // Post-condition: Account is created and stored
    if (!Invariants.isValidAccount(newAccount)) {
      throw new Error("Created account violates invariant");
    }

    this.accounts.set(newId, newAccount);
    this.nextAccountId = createAccountId(
      (this.nextAccountId as number) + 1
    );
    this.checkStateInvariant();

    return newId;
  }

  // Deposit: Add amount to account
  deposit(accountId: AccountId, amount: Money): void {
    // Pre-conditions
    if (!this.accounts.has(accountId)) {
      throw new Error("Account does not exist");
    }
    if (amount <= 0) {
      throw new Error("Deposit amount must be positive");
    }

    const account = this.accounts.get(accountId)!;
    const newBalance = account.balance + amount;

    if (newBalance >= MAX_BALANCE) {
      throw new Error("Deposit would exceed maximum balance");
    }

    // Post-condition: Balance updated
    account.balance = createMoney(newBalance);
    this.checkStateInvariant();
  }

  // Withdraw: Remove amount from account
  withdraw(accountId: AccountId, amount: Money): void {
    // Pre-conditions
    if (!this.accounts.has(accountId)) {
      throw new Error("Account does not exist");
    }
    if (amount <= 0) {
      throw new Error("Withdrawal amount must be positive");
    }
    if (amount > MAX_WITHDRAWAL) {
      throw new Error(
        `Withdrawal exceeds daily limit of ${MAX_WITHDRAWAL}`
      );
    }

    const account = this.accounts.get(accountId)!;
    if (amount > account.balance) {
      throw new Error("Insufficient funds");
    }

    // Post-condition: Balance updated
    account.balance = createMoney(account.balance - amount);
    this.checkStateInvariant();
  }

  // GetBalance: Query balance
  getBalance(accountId: AccountId): Money {
    // Pre-condition
    if (!this.accounts.has(accountId)) {
      throw new Error("Account does not exist");
    }

    const balance = this.accounts.get(accountId)!.balance;

    // Post-condition: Result is valid money
    if (!Invariants.isValidMoney(balance)) {
      throw new Error("Balance invariant violated");
    }

    return balance;
  }

  // Transfer: Atomic operation between accounts
  transfer(fromId: AccountId, toId: AccountId, amount: Money): void {
    // Pre-conditions
    if (!this.accounts.has(fromId)) {
      throw new Error("Source account does not exist");
    }
    if (!this.accounts.has(toId)) {
      throw new Error("Destination account does not exist");
    }
    if (fromId === toId) {
      throw new Error("Source and destination accounts must be different");
    }
    if (amount <= 0) {
      throw new Error("Transfer amount must be positive");
    }
    if (amount > MAX_WITHDRAWAL) {
      throw new Error(
        `Transfer exceeds daily limit of ${MAX_WITHDRAWAL}`
      );
    }

    const fromAccount = this.accounts.get(fromId)!;
    if (amount > fromAccount.balance) {
      throw new Error("Insufficient funds in source account");
    }

    // Atomic operation: update both accounts
    const oldFromBalance = fromAccount.balance;
    const toAccount = this.accounts.get(toId)!;
    const oldToBalance = toAccount.balance;

    fromAccount.balance = createMoney(oldFromBalance - amount);
    toAccount.balance = createMoney(oldToBalance + amount);

    // Post-condition: Both balances properly updated
    this.checkStateInvariant();
  }

  // Helpers for testing
  getAccount(accountId: AccountId): Account | undefined {
    return this.accounts.get(accountId);
  }

  getAllAccounts(): Map<AccountId, Account> {
    return new Map(this.accounts);
  }
}

export {
  BankAccountSystem,
  AccountId,
  Money,
  Account,
  createAccountId,
  createMoney,
  Invariants,
};
