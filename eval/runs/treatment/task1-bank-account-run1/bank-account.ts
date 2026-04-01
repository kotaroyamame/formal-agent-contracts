// Bank Account System - TypeScript Implementation (Run 1)
// Classic VDM-SL with runtime contract checks

type AccountId = number & { readonly __brand: "AccountId" };
type Money = number & { readonly __brand: "Money" };

const MAX_WITHDRAWAL = 1000000;

interface Account {
  id: AccountId;
  name: string;
  balance: Money;
}

interface PreConditionError extends Error {
  name: "PreConditionError";
}

interface PostConditionError extends Error {
  name: "PostConditionError";
}

// Helper functions for contract checking
function checkPre(condition: boolean, message: string): void {
  if (!condition) {
    const error: PreConditionError = new Error(message) as PreConditionError;
    error.name = "PreConditionError";
    throw error;
  }
}

function checkPost(condition: boolean, message: string): void {
  if (!condition) {
    const error: PostConditionError = new Error(message) as PostConditionError;
    error.name = "PostConditionError";
    throw error;
  }
}

function createAccountId(id: number): AccountId {
  return id as AccountId;
}

function createMoney(amount: number): Money {
  return amount as Money;
}

// Invariant checks
function inv_AccountName(name: string): boolean {
  return name.length >= 1;
}

function inv_Money(m: Money): boolean {
  return m >= 0;
}

function inv_Account(acc: Account): boolean {
  return inv_AccountName(acc.name) && inv_Money(acc.balance);
}

// Main Bank Account System
class BankAccountSystem {
  private accounts: Map<AccountId, Account> = new Map();
  private nextAccountId: AccountId = createAccountId(1);

  // OpenAccount: Create new account
  openAccount(name: string, initialBalance: Money): AccountId {
    // Pre-conditions
    checkPre(
      inv_AccountName(name),
      "Account name must have at least 1 character"
    );
    checkPre(inv_Money(initialBalance), "Initial balance must be non-negative");
    checkPre(initialBalance < 1000000000, "Initial balance exceeds maximum");

    const newId = this.nextAccountId;
    const newAccount: Account = {
      id: newId,
      name,
      balance: initialBalance,
    };

    // Post-condition: Account created and stored
    this.accounts.set(newId, newAccount);
    const oldNextId = this.nextAccountId;
    this.nextAccountId = createAccountId(
      (this.nextAccountId as number) + 1
    );

    checkPost(
      this.accounts.has(newId) && this.accounts.get(newId)!.name === name,
      "Account was not properly created"
    );
    checkPost(
      (this.nextAccountId as number) === (oldNextId as number) + 1,
      "NextAccountId was not properly incremented"
    );

    return newId;
  }

  // Deposit: Add money to account
  deposit(accountId: AccountId, amount: Money): void {
    // Pre-conditions
    checkPre(this.accounts.has(accountId), "Account does not exist");
    checkPre(inv_Money(amount), "Amount must be non-negative");
    checkPre(amount > 0, "Amount must be positive");

    const account = this.accounts.get(accountId)!;
    checkPre(
      account.balance + amount < 1000000000,
      "Deposit would exceed maximum balance"
    );

    const oldBalance = account.balance;
    account.balance = createMoney(oldBalance + amount);

    // Post-condition
    checkPost(
      account.balance === oldBalance + amount,
      "Balance was not properly updated"
    );
  }

  // Withdraw: Remove money from account
  withdraw(accountId: AccountId, amount: Money): void {
    // Pre-conditions
    checkPre(this.accounts.has(accountId), "Account does not exist");
    checkPre(inv_Money(amount), "Amount must be non-negative");
    checkPre(amount > 0, "Amount must be positive");
    checkPre(
      amount <= MAX_WITHDRAWAL,
      "Withdrawal exceeds daily limit of 1,000,000"
    );
    checkPre(
      amount <= this.accounts.get(accountId)!.balance,
      "Insufficient funds"
    );

    const account = this.accounts.get(accountId)!;
    const oldBalance = account.balance;
    account.balance = createMoney(oldBalance - amount);

    // Post-condition
    checkPost(
      account.balance === oldBalance - amount,
      "Balance was not properly updated"
    );
  }

  // GetBalance: Query account balance
  getBalance(accountId: AccountId): Money {
    // Pre-condition
    checkPre(this.accounts.has(accountId), "Account does not exist");

    const balance = this.accounts.get(accountId)!.balance;

    // Post-condition
    checkPost(inv_Money(balance), "Balance is invalid");

    return balance;
  }

  // Transfer: Move money between accounts (atomic)
  transfer(fromId: AccountId, toId: AccountId, amount: Money): void {
    // Pre-conditions
    checkPre(this.accounts.has(fromId), "Source account does not exist");
    checkPre(this.accounts.has(toId), "Destination account does not exist");
    checkPre(fromId !== toId, "Source and destination must be different");
    checkPre(inv_Money(amount), "Amount must be non-negative");
    checkPre(amount > 0, "Amount must be positive");
    checkPre(
      amount <= MAX_WITHDRAWAL,
      "Transfer exceeds daily limit of 1,000,000"
    );
    checkPre(
      amount <= this.accounts.get(fromId)!.balance,
      "Insufficient funds in source account"
    );

    const fromAccount = this.accounts.get(fromId)!;
    const toAccount = this.accounts.get(toId)!;
    const oldFromBalance = fromAccount.balance;
    const oldToBalance = toAccount.balance;

    // Atomic operation: withdrawal then deposit
    fromAccount.balance = createMoney(oldFromBalance - amount);
    toAccount.balance = createMoney(oldToBalance + amount);

    // Post-conditions: Atomic transfer completed
    checkPost(
      fromAccount.balance === oldFromBalance - amount,
      "Source account balance was not properly updated"
    );
    checkPost(
      toAccount.balance === oldToBalance + amount,
      "Destination account balance was not properly updated"
    );
  }

  // Helper: Get account for testing
  getAccount(accountId: AccountId): Account | undefined {
    return this.accounts.get(accountId);
  }

  // Helper: Get all accounts
  getAllAccounts(): Map<AccountId, Account> {
    return new Map(this.accounts);
  }
}

export { BankAccountSystem, AccountId, Money, Account, createAccountId, createMoney };
