// Bank Account System - TypeScript Implementation (Run 4)
// Mirrors VDM-SL validation functions as pure functions

type AccountId = number & { readonly __brand: "AccountId" };
type Money = number & { readonly __brand: "Money" };

const MAX_WITHDRAWAL = 1000000;
const MAX_BALANCE = 1000000000;

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

// Pure validation functions (matching VDM-SL specification)
class Validators {
  static trim(s: string): string {
    return s.trim();
  }

  static isValidName(name: string): boolean {
    // Name is valid if non-empty and contains no spaces
    return name.length > 0 && !name.includes(" ");
  }

  static isValidNameAfterTrim(name: string): boolean {
    // Name is valid if after trimming it's non-empty
    const trimmed = Validators.trim(name);
    return trimmed.length > 0;
  }

  static isValidMoney(m: Money): boolean {
    return m >= 0 && m < MAX_BALANCE;
  }

  static isValidAccountId(id: AccountId): boolean {
    return (id as number) > 0;
  }

  static isValidBalance(bal: Money): boolean {
    return bal >= 0 && bal < MAX_BALANCE;
  }

  static isWithdrawable(balance: Money, amount: Money): boolean {
    return amount > 0 && amount <= MAX_WITHDRAWAL && amount <= balance;
  }

  static isTransferable(fromBalance: Money, amount: Money): boolean {
    return amount > 0 && amount <= MAX_WITHDRAWAL && amount <= fromBalance;
  }

  static canDeposit(currentBalance: Money, depositAmount: Money): boolean {
    return depositAmount > 0 && currentBalance + depositAmount < MAX_BALANCE;
  }

  // Validation query functions (implicit in spec)
  static validateName(name: string): boolean {
    return Validators.isValidNameAfterTrim(name);
  }

  static validateBalance(balance: Money): boolean {
    return Validators.isValidBalance(balance);
  }

  static validateDeposit(currentBalance: Money, amount: Money): boolean {
    return Validators.canDeposit(currentBalance, amount);
  }

  static validateWithdraw(balance: Money, amount: Money): boolean {
    return Validators.isWithdrawable(balance, amount);
  }

  static validateTransfer(
    fromBalance: Money,
    toBalance: Money,
    amount: Money
  ): boolean {
    return (
      Validators.isTransferable(fromBalance, amount) &&
      toBalance + amount < MAX_BALANCE
    );
  }
}

// Bank Account System
class BankAccountSystem {
  private accounts: Map<AccountId, Account> = new Map();
  private nextAccountId: AccountId = createAccountId(1);

  openAccount(name: string, initialBalance: Money): AccountId {
    // Use validation functions explicitly
    if (!Validators.validateName(name)) {
      throw new Error("Account name must not be empty after trimming");
    }
    if (!Validators.validateBalance(initialBalance)) {
      throw new Error("Initial balance is invalid");
    }

    const trimmedName = Validators.trim(name);
    const newId = this.nextAccountId;

    const newAccount: Account = {
      id: newId,
      name: trimmedName,
      balance: initialBalance,
    };

    this.accounts.set(newId, newAccount);
    this.nextAccountId = createAccountId(
      (this.nextAccountId as number) + 1
    );

    return newId;
  }

  deposit(accountId: AccountId, amount: Money): void {
    if (!this.accounts.has(accountId)) {
      throw new Error("Account does not exist");
    }

    const account = this.accounts.get(accountId)!;

    // Use validation function
    if (!Validators.validateDeposit(account.balance, amount)) {
      throw new Error("Deposit operation is invalid");
    }

    account.balance = createMoney(account.balance + amount);
  }

  withdraw(accountId: AccountId, amount: Money): void {
    if (!this.accounts.has(accountId)) {
      throw new Error("Account does not exist");
    }

    const account = this.accounts.get(accountId)!;

    // Use validation function
    if (!Validators.validateWithdraw(account.balance, amount)) {
      if (amount <= 0) {
        throw new Error("Withdrawal amount must be positive");
      }
      if (amount > MAX_WITHDRAWAL) {
        throw new Error(
          `Withdrawal exceeds daily limit of ${MAX_WITHDRAWAL}`
        );
      }
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

    // Use validation function
    if (!Validators.validateTransfer(fromAccount.balance, toAccount.balance, amount)) {
      if (amount <= 0) {
        throw new Error("Transfer amount must be positive");
      }
      if (amount > MAX_WITHDRAWAL) {
        throw new Error(
          `Transfer exceeds daily limit of ${MAX_WITHDRAWAL}`
        );
      }
      if (amount > fromAccount.balance) {
        throw new Error("Insufficient funds in source account");
      }
      throw new Error("Transfer would exceed maximum balance in destination");
    }

    fromAccount.balance = createMoney(fromAccount.balance - amount);
    toAccount.balance = createMoney(toAccount.balance + amount);
  }

  // Expose validation functions for testing
  static getValidators() {
    return Validators;
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
  Validators,
};
