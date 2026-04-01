// Bank Account System - TypeScript Implementation (Run 3)
// Emphasizes atomicity with try-catch rollback pattern

type AccountId = number & { readonly __brand: "AccountId" };
type Money = number & { readonly __brand: "Money" };

const MAX_WITHDRAWAL = 1000000;

interface Account {
  id: AccountId;
  name: string;
  balance: Money;
}

interface TransactionSnapshot {
  fromId: AccountId;
  toId: AccountId;
  fromBalanceBefore: Money;
  toBalanceBefore: Money;
}

function createAccountId(id: number): AccountId {
  return id as AccountId;
}

function createMoney(amount: number): Money {
  return amount as Money;
}

class AtomicTransactionError extends Error {
  constructor(message: string, public snapshot?: TransactionSnapshot) {
    super(message);
    this.name = "AtomicTransactionError";
  }
}

// Bank Account System with Atomicity Guarantees
class BankAccountSystem {
  private accounts: Map<AccountId, Account> = new Map();
  private nextAccountId: AccountId = createAccountId(1);
  private inTransaction: boolean = false;

  openAccount(name: string, initialBalance: Money): AccountId {
    if (name.trim().length === 0) {
      throw new Error("Account name cannot be empty");
    }
    if (initialBalance < 0 || initialBalance >= 1000000000) {
      throw new Error("Initial balance out of valid range");
    }

    const newId = this.nextAccountId;
    const account: Account = {
      id: newId,
      name,
      balance: initialBalance,
    };

    this.accounts.set(newId, account);
    this.nextAccountId = createAccountId(
      (this.nextAccountId as number) + 1
    );

    return newId;
  }

  deposit(accountId: AccountId, amount: Money): void {
    if (!this.accounts.has(accountId)) {
      throw new Error("Account does not exist");
    }
    if (amount <= 0) {
      throw new Error("Deposit amount must be positive");
    }

    const account = this.accounts.get(accountId)!;
    if (account.balance + amount >= 1000000000) {
      throw new Error("Deposit would exceed maximum balance");
    }

    account.balance = createMoney(account.balance + amount);
  }

  withdraw(accountId: AccountId, amount: Money): void {
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

    account.balance = createMoney(account.balance - amount);
  }

  getBalance(accountId: AccountId): Money {
    if (!this.accounts.has(accountId)) {
      throw new Error("Account does not exist");
    }
    return this.accounts.get(accountId)!.balance;
  }

  // Transfer: Atomic operation with automatic rollback
  // All-or-nothing semantics: either both accounts update or neither does
  transfer(fromId: AccountId, toId: AccountId, amount: Money): void {
    // Pre-conditions
    if (!this.accounts.has(fromId)) {
      throw new Error("Source account does not exist");
    }
    if (!this.accounts.has(toId)) {
      throw new Error("Destination account does not exist");
    }
    if (fromId === toId) {
      throw new Error("Source and destination must be different");
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
    const toAccount = this.accounts.get(toId)!;

    if (amount > fromAccount.balance) {
      throw new Error("Insufficient funds in source account");
    }

    // Save snapshot for rollback
    const snapshot: TransactionSnapshot = {
      fromId,
      toId,
      fromBalanceBefore: fromAccount.balance,
      toBalanceBefore: toAccount.balance,
    };

    if (this.inTransaction) {
      throw new AtomicTransactionError(
        "Nested transactions not supported",
        snapshot
      );
    }

    this.inTransaction = true;

    try {
      // Step 1: Withdraw from source
      fromAccount.balance = createMoney(fromAccount.balance - amount);

      // Step 2: Deposit to destination
      toAccount.balance = createMoney(toAccount.balance + amount);

      // Post-condition: Atomic operation complete
      // Verify both balances updated correctly
      if (
        fromAccount.balance !==
        snapshot.fromBalanceBefore - amount
      ) {
        throw new AtomicTransactionError(
          "Source balance update verification failed",
          snapshot
        );
      }
      if (
        toAccount.balance !==
        snapshot.toBalanceBefore + amount
      ) {
        throw new AtomicTransactionError(
          "Destination balance update verification failed",
          snapshot
        );
      }

      // Verify atomicity: money is conserved
      const totalAfter = fromAccount.balance + toAccount.balance;
      const totalBefore =
        snapshot.fromBalanceBefore + snapshot.toBalanceBefore;
      if (totalAfter !== totalBefore) {
        throw new AtomicTransactionError(
          "Money conservation invariant violated",
          snapshot
        );
      }

      this.inTransaction = false;
    } catch (error) {
      // Rollback: restore original state
      fromAccount.balance = snapshot.fromBalanceBefore;
      toAccount.balance = snapshot.toBalanceBefore;
      this.inTransaction = false;

      if (error instanceof AtomicTransactionError) {
        throw error;
      }
      throw new AtomicTransactionError(
        `Transfer failed and was rolled back: ${
          error instanceof Error ? error.message : String(error)
        }`,
        snapshot
      );
    }
  }

  // TransferSafe: Explicit two-phase commit with rollback control
  transferSafe(
    fromId: AccountId,
    toId: AccountId,
    amount: Money,
    commit: boolean
  ): { success: boolean; fromBalance: Money; toBalance: Money } {
    if (!this.accounts.has(fromId)) {
      throw new Error("Source account does not exist");
    }
    if (!this.accounts.has(toId)) {
      throw new Error("Destination account does not exist");
    }
    if (fromId === toId) {
      throw new Error("Source and destination must be different");
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
    const toAccount = this.accounts.get(toId)!;

    if (amount > fromAccount.balance) {
      throw new Error("Insufficient funds");
    }

    const snapshot: TransactionSnapshot = {
      fromId,
      toId,
      fromBalanceBefore: fromAccount.balance,
      toBalanceBefore: toAccount.balance,
    };

    this.inTransaction = true;

    try {
      if (!commit) {
        // Rollback: no changes
        this.inTransaction = false;
        return {
          success: false,
          fromBalance: fromAccount.balance,
          toBalance: toAccount.balance,
        };
      }

      // Commit: atomic transfer
      fromAccount.balance = createMoney(fromAccount.balance - amount);
      toAccount.balance = createMoney(toAccount.balance + amount);

      this.inTransaction = false;

      return {
        success: true,
        fromBalance: fromAccount.balance,
        toBalance: toAccount.balance,
      };
    } catch (error) {
      // Rollback on error
      fromAccount.balance = snapshot.fromBalanceBefore;
      toAccount.balance = snapshot.toBalanceBefore;
      this.inTransaction = false;
      throw error;
    }
  }

  // Helper methods
  getAccount(accountId: AccountId): Account | undefined {
    return this.accounts.get(accountId);
  }

  getAllAccounts(): Map<AccountId, Account> {
    return new Map(this.accounts);
  }

  isInTransaction(): boolean {
    return this.inTransaction;
  }
}

export {
  BankAccountSystem,
  AccountId,
  Money,
  Account,
  createAccountId,
  createMoney,
  AtomicTransactionError,
  TransactionSnapshot,
};
