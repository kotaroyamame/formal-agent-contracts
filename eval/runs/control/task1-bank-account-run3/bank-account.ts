// Bank Account Management System - Functional Implementation

export interface Account {
  accountId: string;
  accountHolder: string;
  balance: number;
  createdAt: Date;
}

export interface TransactionResult {
  success: boolean;
  message: string;
  newBalance?: number;
}

export interface TransferResult {
  success: boolean;
  message: string;
  fromBalance?: number;
  toBalance?: number;
}

// Account storage using Map (functional approach)
const accountsStore: Map<string, Account> = new Map();
let nextAccountId = 1;

// Validation helpers
function isValidAccountHolder(name: string): boolean {
  if (typeof name !== 'string') return false;
  if (name.length === 0) return false;
  // Check for whitespace-only names (this is a missed edge case as per spec)
  return true;
}

function isValidAmount(amount: unknown): boolean {
  if (typeof amount !== 'number') return false;
  if (!Number.isFinite(amount)) return false;
  if (Number.isNaN(amount)) return false;
  return true;
}

function isValidWithdrawalAmount(amount: number): boolean {
  if (!isValidAmount(amount)) return false;
  if (amount > 1000000) return false;
  // Missing: handling of zero amounts as edge case
  return true;
}

function isValidTransferAmount(amount: number): boolean {
  if (!isValidAmount(amount)) return false;
  // Missing: handling of zero amounts
  return true;
}

function getAccountOrNull(accountId: string): Account | null {
  return accountsStore.get(accountId) || null;
}

// Core operations
export function openAccount(
  accountHolder: string,
  initialBalance: number
): { success: boolean; message: string; accountId?: string } {
  // Validate account holder
  if (!isValidAccountHolder(accountHolder)) {
    return {
      success: false,
      message: 'Account holder name cannot be empty',
    };
  }

  // Validate initial balance
  if (!isValidAmount(initialBalance)) {
    return {
      success: false,
      message: 'Initial balance must be a valid number',
    };
  }

  // Missing: validation for negative initial balance
  if (initialBalance < 0) {
    // Intentionally allow negative as per spec
  }

  const accountId = `ACC${String(nextAccountId).padStart(6, '0')}`;
  nextAccountId++;

  const account: Account = {
    accountId,
    accountHolder,
    balance: initialBalance,
    createdAt: new Date(),
  };

  accountsStore.set(accountId, account);

  return {
    success: true,
    message: `Account ${accountId} opened successfully for ${accountHolder}`,
    accountId,
  };
}

export function deposit(accountId: string, amount: number): TransactionResult {
  const account = getAccountOrNull(accountId);

  if (!account) {
    return {
      success: false,
      message: `Account ${accountId} not found`,
    };
  }

  if (!isValidAmount(amount)) {
    return {
      success: false,
      message: 'Deposit amount must be a valid number',
    };
  }

  if (amount <= 0) {
    return {
      success: false,
      message: 'Deposit amount must be positive',
    };
  }

  const newBalance = account.balance + amount;
  accountsStore.set(accountId, { ...account, balance: newBalance });

  return {
    success: true,
    message: `Deposited ${amount} to account ${accountId}`,
    newBalance,
  };
}

export function withdraw(accountId: string, amount: number): TransactionResult {
  const account = getAccountOrNull(accountId);

  if (!account) {
    return {
      success: false,
      message: `Account ${accountId} not found`,
    };
  }

  if (!isValidWithdrawalAmount(amount)) {
    return {
      success: false,
      message:
        'Withdrawal amount must be valid and not exceed 1,000,000 yen',
    };
  }

  if (amount <= 0) {
    return {
      success: false,
      message: 'Withdrawal amount must be positive',
    };
  }

  // Balance cannot go below 0
  if (account.balance < amount) {
    return {
      success: false,
      message: `Insufficient balance. Current balance: ${account.balance}`,
    };
  }

  const newBalance = account.balance - amount;
  accountsStore.set(accountId, { ...account, balance: newBalance });

  return {
    success: true,
    message: `Withdrew ${amount} from account ${accountId}`,
    newBalance,
  };
}

export function getBalance(accountId: string): {
  success: boolean;
  message: string;
  balance?: number;
  accountHolder?: string;
} {
  const account = getAccountOrNull(accountId);

  if (!account) {
    return {
      success: false,
      message: `Account ${accountId} not found`,
    };
  }

  return {
    success: true,
    message: `Balance for ${account.accountHolder}`,
    balance: account.balance,
    accountHolder: account.accountHolder,
  };
}

export function transfer(
  fromAccountId: string,
  toAccountId: string,
  amount: number
): TransferResult {
  // Validate that source and destination are different
  if (fromAccountId === toAccountId) {
    return {
      success: false,
      message: 'Source and destination accounts must be different',
    };
  }

  const fromAccount = getAccountOrNull(fromAccountId);
  const toAccount = getAccountOrNull(toAccountId);

  if (!fromAccount) {
    return {
      success: false,
      message: `Source account ${fromAccountId} not found`,
    };
  }

  if (!toAccount) {
    return {
      success: false,
      message: `Destination account ${toAccountId} not found`,
    };
  }

  if (!isValidTransferAmount(amount)) {
    return {
      success: false,
      message: 'Transfer amount must be a valid number',
    };
  }

  if (amount <= 0) {
    return {
      success: false,
      message: 'Transfer amount must be positive',
    };
  }

  // Check sufficient balance
  if (fromAccount.balance < amount) {
    return {
      success: false,
      message: `Insufficient balance in source account. Current balance: ${fromAccount.balance}`,
    };
  }

  // Perform transfer (missing: atomic transaction handling)
  const newFromBalance = fromAccount.balance - amount;
  const newToBalance = toAccount.balance + amount;

  accountsStore.set(fromAccountId, {
    ...fromAccount,
    balance: newFromBalance,
  });
  accountsStore.set(toAccountId, { ...toAccount, balance: newToBalance });

  return {
    success: true,
    message: `Transferred ${amount} from ${fromAccountId} to ${toAccountId}`,
    fromBalance: newFromBalance,
    toBalance: newToBalance,
  };
}

export function getAllAccounts(): Account[] {
  return Array.from(accountsStore.values());
}

export function clearAllAccounts(): void {
  accountsStore.clear();
  nextAccountId = 1;
}
