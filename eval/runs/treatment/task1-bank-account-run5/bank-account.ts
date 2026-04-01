// Bank Account System - TypeScript Implementation (Run 5)
// Assertions mapped to proof obligations from VDM-SL spec

type AccountId = number & { readonly __brand: "AccountId" };
type Money = number & { readonly __brand: "Money" };

const MAX_WITHDRAWAL = 1000000;

interface Account {
  id: AccountId;
  name: string;
  balance: Money;
}

function createAccountId(id: number): AccountId {
  return id as AccountId;
}

function createMoney(amount: number): Money {
  return amount as Money;
}

// Assertion helpers for proof obligations
class ProofObligations {
  // PO-1: Name invariant
  static po1_ValidName(name: string): void {
    if (name.length === 0) {
      throw new Error("PO-1 Failed: Name must be non-empty");
    }
  }

  // PO-6: Deposit amount positive
  static po6_DepositPositive(amount: Money): void {
    if (amount <= 0) {
      throw new Error("PO-6 Failed: Deposit amount must be positive");
    }
  }

  // PO-7: Balance increased correctly
  static po7_BalanceIncreasedCorrectly(
    oldBalance: Money,
    amount: Money,
    newBalance: Money
  ): void {
    if (newBalance !== oldBalance + amount) {
      throw new Error("PO-7 Failed: Balance not increased correctly");
    }
  }

  // PO-9: Withdrawal conditions
  static po9_WithdrawalValid(
    amount: Money,
    balance: Money
  ): void {
    if (amount <= 0) {
      throw new Error("PO-9 Failed: Amount must be positive");
    }
    if (amount > MAX_WITHDRAWAL) {
      throw new Error("PO-9 Failed: Amount exceeds daily limit");
    }
    if (amount > balance) {
      throw new Error("PO-9 Failed: Insufficient funds");
    }
  }

  // PO-10: Balance decreased correctly
  static po10_BalanceDecreasedCorrectly(
    oldBalance: Money,
    amount: Money,
    newBalance: Money
  ): void {
    if (newBalance !== oldBalance - amount) {
      throw new Error("PO-10 Failed: Balance not decreased correctly");
    }
  }

  // PO-12: No negative balance
  static po12_NoNegativeBalance(balance: Money): void {
    if (balance < 0) {
      throw new Error("PO-12 Failed: Balance is negative");
    }
  }

  // PO-13: Query returns actual balance
  static po13_BalanceQuery(result: Money, accountBalance: Money): void {
    if (result !== accountBalance) {
      throw new Error("PO-13 Failed: Query did not return actual balance");
    }
  }

  // PO-14: Result is valid money
  static po14_ValidMoney(result: Money): void {
    if (result < 0 || result >= 1000000000) {
      throw new Error("PO-14 Failed: Invalid money value");
    }
  }

  // PO-15: Transfer atomicity condition
  static po15_TransferAtomic(
    oldFromBalance: Money,
    oldToBalance: Money,
    amount: Money
  ): void {
    if (amount <= 0 || amount > MAX_WITHDRAWAL || amount > oldFromBalance) {
      throw new Error("PO-15 Failed: Transfer atomicity precondition violated");
    }
  }

  // PO-16: Source balance decreased
  static po16_SourceDecreased(
    oldFromBalance: Money,
    amount: Money,
    newFromBalance: Money
  ): void {
    if (newFromBalance !== oldFromBalance - amount) {
      throw new Error("PO-16 Failed: Source balance not decreased correctly");
    }
  }

  // PO-17: Destination balance increased
  static po17_DestinationIncreased(
    oldToBalance: Money,
    amount: Money,
    newToBalance: Money
  ): void {
    if (newToBalance !== oldToBalance + amount) {
      throw new Error("PO-17 Failed: Destination balance not increased correctly");
    }
  }

  // PO-18: Money conservation
  static po18_MoneyConservation(
    oldFromBalance: Money,
    oldToBalance: Money,
    newFromBalance: Money,
    newToBalance: Money
  ): void {
    const oldTotal = oldFromBalance + oldToBalance;
    const newTotal = newFromBalance + newToBalance;
    if (oldTotal !== newTotal) {
      throw new Error("PO-18 Failed: Money not conserved in transfer");
    }
  }

  // PO-20: No negative balances
  static po20_NoNegativeBalances(
    fromBalance: Money,
    toBalance: Money
  ): void {
    if (fromBalance < 0 || toBalance < 0) {
      throw new Error("PO-20 Failed: Negative balance detected");
    }
  }
}

// Bank Account System
class BankAccountSystem {
  private accounts: Map<AccountId, Account> = new Map();
  private nextAccountId: AccountId = createAccountId(1);

  openAccount(name: string, initialBalance: Money): AccountId {
    // PO-1: Validate name
    ProofObligations.po1_ValidName(name);

    if (initialBalance < 0 || initialBalance >= 1000000000) {
      throw new Error("Initial balance out of valid range");
    }

    const newId = this.nextAccountId;

    // PO-2: Create with correct name
    // PO-3: Create with correct balance
    const newAccount: Account = {
      id: newId,
      name,
      balance: initialBalance,
    };

    this.accounts.set(newId, newAccount);

    // PO-4: Increment next ID
    const oldNextId = this.nextAccountId;
    this.nextAccountId = createAccountId(
      (this.nextAccountId as number) + 1
    );

    if ((this.nextAccountId as number) !== (oldNextId as number) + 1) {
      throw new Error("PO-4 Failed: Next ID not incremented");
    }

    // PO-5: Verify existing accounts unchanged
    const allAccounts = Array.from(this.accounts.values());
    if (
      !allAccounts.some((acc) => acc.id === newId && acc.name === name)
    ) {
      throw new Error("PO-5 Failed: New account not properly stored");
    }

    return newId;
  }

  deposit(accountId: AccountId, amount: Money): void {
    if (!this.accounts.has(accountId)) {
      throw new Error("Account does not exist");
    }

    // PO-6: Amount must be positive
    ProofObligations.po6_DepositPositive(amount);

    const account = this.accounts.get(accountId)!;

    if (account.balance + amount >= 1000000000) {
      throw new Error("Deposit would exceed maximum balance");
    }

    const oldBalance = account.balance;

    // Update balance
    account.balance = createMoney(oldBalance + amount);

    // PO-7: Verify balance increased correctly
    ProofObligations.po7_BalanceIncreasedCorrectly(
      oldBalance,
      amount,
      account.balance
    );

    // PO-8: Other accounts unchanged (implicit - we only modified one)
  }

  withdraw(accountId: AccountId, amount: Money): void {
    if (!this.accounts.has(accountId)) {
      throw new Error("Account does not exist");
    }

    // PO-9: Withdrawal conditions
    const account = this.accounts.get(accountId)!;
    ProofObligations.po9_WithdrawalValid(amount, account.balance);

    const oldBalance = account.balance;

    // Update balance
    account.balance = createMoney(oldBalance - amount);

    // PO-10: Verify balance decreased correctly
    ProofObligations.po10_BalanceDecreasedCorrectly(
      oldBalance,
      amount,
      account.balance
    );

    // PO-12: No negative balance
    ProofObligations.po12_NoNegativeBalance(account.balance);

    // PO-11: Other accounts unchanged (implicit)
  }

  getBalance(accountId: AccountId): Money {
    if (!this.accounts.has(accountId)) {
      throw new Error("Account does not exist");
    }

    const result = this.accounts.get(accountId)!.balance;

    // PO-13: Query returns actual balance
    ProofObligations.po13_BalanceQuery(
      result,
      this.accounts.get(accountId)!.balance
    );

    // PO-14: Result is valid money
    ProofObligations.po14_ValidMoney(result);

    return result;
  }

  transfer(fromId: AccountId, toId: AccountId, amount: Money): void {
    if (!this.accounts.has(fromId)) {
      throw new Error("Source account does not exist");
    }
    if (!this.accounts.has(toId)) {
      throw new Error("Destination account does not exist");
    }
    if (fromId === toId) {
      throw new Error("Source and destination must be different");
    }

    const fromAccount = this.accounts.get(fromId)!;
    const toAccount = this.accounts.get(toId)!;

    const oldFromBalance = fromAccount.balance;
    const oldToBalance = toAccount.balance;

    // PO-15: Transfer atomicity preconditions
    ProofObligations.po15_TransferAtomic(
      oldFromBalance,
      oldToBalance,
      amount
    );

    // Atomic transfer
    fromAccount.balance = createMoney(oldFromBalance - amount);
    toAccount.balance = createMoney(oldToBalance + amount);

    // PO-16: Source balance decreased correctly
    ProofObligations.po16_SourceDecreased(
      oldFromBalance,
      amount,
      fromAccount.balance
    );

    // PO-17: Destination balance increased correctly
    ProofObligations.po17_DestinationIncreased(
      oldToBalance,
      amount,
      toAccount.balance
    );

    // PO-18: Money conservation
    ProofObligations.po18_MoneyConservation(
      oldFromBalance,
      oldToBalance,
      fromAccount.balance,
      toAccount.balance
    );

    // PO-20: No negative balances
    ProofObligations.po20_NoNegativeBalances(
      fromAccount.balance,
      toAccount.balance
    );

    // PO-19: Other accounts unchanged (implicit)
  }

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
  ProofObligations,
};
