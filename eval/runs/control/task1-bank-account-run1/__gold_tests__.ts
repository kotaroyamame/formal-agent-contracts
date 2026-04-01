/**
 * Gold Standard Test Suite for Bank Account Agent
 * TypeScript/Jest format
 *
 * This test suite validates all business rules and all 10 traps (T1-01 through T1-10).
 * Total: ~50 test cases covering positive and negative scenarios.
 */

// ============================================================================
// MINIMAL INTERFACE FOR TESTING
// ============================================================================

interface IBankAccount {
  createAccount(name: string, initialBalance: number): string; // returns accountId
  deposit(accountId: string, amount: number): void;
  withdraw(accountId: string, amount: number): void;
  getBalance(accountId: string): number;
  transfer(sourceId: string, destId: string, amount: number): void;
}

/**
 * Reference implementation for testing
 * This represents the gold standard behavior
 */
class BankAccountImpl implements IBankAccount {
  private accounts: Map<string, { name: string; balance: number }> = new Map();
  private nextId = 1;

  createAccount(name: string, initialBalance: number): string {
    // T1-01: Reject negative initial balance
    if (initialBalance < 0) {
      throw new Error("Initial balance cannot be negative");
    }
    // T1-10: Reject whitespace-only names
    if (!name || name.trim().length === 0) {
      throw new Error("Account name cannot be empty or whitespace-only");
    }
    const accountId = String(this.nextId++);
    this.accounts.set(accountId, { name, balance: initialBalance });
    return accountId;
  }

  deposit(accountId: string, amount: number): void {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }
    // T1-02: Allow zero-amount deposits (semantically valid)
    if (amount < 0) {
      throw new Error("Deposit amount cannot be negative");
    }
    account.balance += amount;
  }

  withdraw(accountId: string, amount: number): void {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }
    // T1-03: Reject zero-amount withdrawals
    if (amount <= 0) {
      throw new Error("Withdrawal amount must be positive");
    }
    // T1-05 & T1-06: Enforce 1,000,000 yen withdrawal limit (inclusive)
    if (amount > 1000000) {
      throw new Error("Withdrawal amount exceeds maximum limit of 1,000,000 yen");
    }
    // T1-04: Ensure balance does not go negative
    if (account.balance < amount) {
      throw new Error("Insufficient balance for withdrawal");
    }
    account.balance -= amount;
  }

  getBalance(accountId: string): number {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }
    return account.balance;
  }

  transfer(sourceId: string, destId: string, amount: number): void {
    const sourceAccount = this.accounts.get(sourceId);
    const destAccount = this.accounts.get(destId);

    if (!sourceAccount) {
      throw new Error(`Source account not found: ${sourceId}`);
    }
    if (!destAccount) {
      throw new Error(`Destination account not found: ${destId}`);
    }

    // T1-08: Reject self-transfers
    if (sourceId === destId) {
      throw new Error("Cannot transfer to the same account");
    }

    // T1-09: Apply withdrawal limit to transfer amount
    if (amount <= 0) {
      throw new Error("Transfer amount must be positive");
    }
    if (amount > 1000000) {
      throw new Error(
        "Transfer amount exceeds maximum limit of 1,000,000 yen"
      );
    }

    // T1-07: Enforce atomicity - both must succeed or both fail
    if (sourceAccount.balance < amount) {
      throw new Error("Insufficient balance for transfer");
    }

    sourceAccount.balance -= amount;
    destAccount.balance += amount;
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe("Bank Account Agent - Gold Standard Tests", () => {
  let bank: IBankAccount;

  beforeEach(() => {
    bank = new BankAccountImpl();
  });

  // ==========================================================================
  // BASIC FUNCTIONALITY TESTS
  // ==========================================================================

  describe("Account Creation (Basic)", () => {
    test("should create an account with name and initial balance", () => {
      const accountId = bank.createAccount("太郎", 50000);
      expect(bank.getBalance(accountId)).toBe(50000);
    });

    test("should create account with zero initial balance", () => {
      const accountId = bank.createAccount("花子", 0);
      expect(bank.getBalance(accountId)).toBe(0);
    });

    test("should create multiple accounts with unique IDs", () => {
      const id1 = bank.createAccount("Account 1", 1000);
      const id2 = bank.createAccount("Account 2", 2000);
      expect(id1).not.toBe(id2);
      expect(bank.getBalance(id1)).toBe(1000);
      expect(bank.getBalance(id2)).toBe(2000);
    });
  });

  describe("Deposit (Basic)", () => {
    let accountId: string;

    beforeEach(() => {
      accountId = bank.createAccount("太郎", 100000);
    });

    test("should increase balance on deposit", () => {
      bank.deposit(accountId, 50000);
      expect(bank.getBalance(accountId)).toBe(150000);
    });

    test("should allow multiple deposits", () => {
      bank.deposit(accountId, 10000);
      bank.deposit(accountId, 20000);
      bank.deposit(accountId, 30000);
      expect(bank.getBalance(accountId)).toBe(160000);
    });

    test("should reject deposit to non-existent account", () => {
      expect(() => bank.deposit("invalid-id", 1000)).toThrow();
    });
  });

  describe("Withdrawal (Basic)", () => {
    let accountId: string;

    beforeEach(() => {
      accountId = bank.createAccount("太郎", 500000);
    });

    test("should decrease balance on withdrawal", () => {
      bank.withdraw(accountId, 100000);
      expect(bank.getBalance(accountId)).toBe(400000);
    });

    test("should allow multiple withdrawals", () => {
      bank.withdraw(accountId, 100000);
      bank.withdraw(accountId, 150000);
      bank.withdraw(accountId, 50000);
      expect(bank.getBalance(accountId)).toBe(200000);
    });

    test("should reject withdrawal from non-existent account", () => {
      expect(() => bank.withdraw("invalid-id", 1000)).toThrow();
    });
  });

  describe("Balance Inquiry", () => {
    test("should return correct balance", () => {
      const accountId = bank.createAccount("太郎", 75000);
      expect(bank.getBalance(accountId)).toBe(75000);
    });

    test("should reflect balance changes", () => {
      const accountId = bank.createAccount("太郎", 100000);
      bank.deposit(accountId, 50000);
      expect(bank.getBalance(accountId)).toBe(150000);
      bank.withdraw(accountId, 30000);
      expect(bank.getBalance(accountId)).toBe(120000);
    });

    test("should throw on invalid account ID", () => {
      expect(() => bank.getBalance("invalid-id")).toThrow();
    });
  });

  describe("Transfer (Basic)", () => {
    let sourceId: string;
    let destId: string;

    beforeEach(() => {
      sourceId = bank.createAccount("太郎", 500000);
      destId = bank.createAccount("花子", 100000);
    });

    test("should transfer money between accounts", () => {
      bank.transfer(sourceId, destId, 100000);
      expect(bank.getBalance(sourceId)).toBe(400000);
      expect(bank.getBalance(destId)).toBe(200000);
    });

    test("should allow multiple transfers", () => {
      bank.transfer(sourceId, destId, 50000);
      bank.transfer(sourceId, destId, 75000);
      expect(bank.getBalance(sourceId)).toBe(375000);
      expect(bank.getBalance(destId)).toBe(225000);
    });

    test("should throw on transfer to non-existent destination", () => {
      expect(() => bank.transfer(sourceId, "invalid-id", 10000)).toThrow();
    });

    test("should throw on transfer from non-existent source", () => {
      expect(() => bank.transfer("invalid-id", destId, 10000)).toThrow();
    });
  });

  // ==========================================================================
  // TRAP T1-01: NEGATIVE INITIAL BALANCE
  // ==========================================================================

  describe("T1-01: Negative Initial Balance", () => {
    test("should reject account creation with negative initial balance", () => {
      expect(() => bank.createAccount("太郎", -1000)).toThrow();
    });

    test("should reject account creation with large negative balance", () => {
      expect(() => bank.createAccount("太郎", -1000000)).toThrow();
    });

    test("should accept zero initial balance (boundary)", () => {
      const accountId = bank.createAccount("太郎", 0);
      expect(bank.getBalance(accountId)).toBe(0);
    });

    test("should accept positive initial balance", () => {
      const accountId = bank.createAccount("太郎", 1);
      expect(bank.getBalance(accountId)).toBe(1);
    });
  });

  // ==========================================================================
  // TRAP T1-02: ZERO-AMOUNT DEPOSIT
  // ==========================================================================

  describe("T1-02: Zero-Amount Deposit", () => {
    let accountId: string;

    beforeEach(() => {
      accountId = bank.createAccount("太郎", 100000);
    });

    test("should accept zero-amount deposit", () => {
      bank.deposit(accountId, 0);
      expect(bank.getBalance(accountId)).toBe(100000);
    });

    test("should accept zero deposit without changing balance", () => {
      bank.deposit(accountId, 0);
      bank.deposit(accountId, 0);
      bank.deposit(accountId, 0);
      expect(bank.getBalance(accountId)).toBe(100000);
    });

    test("should reject negative deposit", () => {
      expect(() => bank.deposit(accountId, -1000)).toThrow();
    });
  });

  // ==========================================================================
  // TRAP T1-03: ZERO-AMOUNT WITHDRAWAL
  // ==========================================================================

  describe("T1-03: Zero-Amount Withdrawal", () => {
    let accountId: string;

    beforeEach(() => {
      accountId = bank.createAccount("太郎", 100000);
    });

    test("should reject zero-amount withdrawal", () => {
      expect(() => bank.withdraw(accountId, 0)).toThrow();
    });

    test("should reject negative withdrawal", () => {
      expect(() => bank.withdraw(accountId, -1000)).toThrow();
    });

    test("should accept positive withdrawal of 1 yen", () => {
      bank.withdraw(accountId, 1);
      expect(bank.getBalance(accountId)).toBe(99999);
    });
  });

  // ==========================================================================
  // TRAP T1-04: WITHDRAWAL EXACTLY EQUAL TO BALANCE (BOUNDARY)
  // ==========================================================================

  describe("T1-04: Withdrawal Exactly Equal to Balance", () => {
    test("should allow withdrawal that reduces balance to zero", () => {
      const accountId = bank.createAccount("太郎", 50000);
      bank.withdraw(accountId, 50000);
      expect(bank.getBalance(accountId)).toBe(0);
    });

    test("should allow withdrawal leaving zero balance even from large balance", () => {
      const accountId = bank.createAccount("太郎", 1000000);
      bank.withdraw(accountId, 1000000);
      expect(bank.getBalance(accountId)).toBe(0);
    });

    test("should reject withdrawal that would make balance negative", () => {
      const accountId = bank.createAccount("太郎", 50000);
      expect(() => bank.withdraw(accountId, 50001)).toThrow();
    });

    test("should allow withdrawal that leaves 1 yen balance", () => {
      const accountId = bank.createAccount("太郎", 50000);
      bank.withdraw(accountId, 49999);
      expect(bank.getBalance(accountId)).toBe(1);
    });
  });

  // ==========================================================================
  // TRAP T1-05: WITHDRAWAL AT EXACT LIMIT (1,000,000 yen)
  // ==========================================================================

  describe("T1-05: Withdrawal at Exact Limit (1,000,000 yen)", () => {
    test("should allow withdrawal of exactly 1,000,000 yen", () => {
      const accountId = bank.createAccount("太郎", 1000000);
      bank.withdraw(accountId, 1000000);
      expect(bank.getBalance(accountId)).toBe(0);
    });

    test("should allow withdrawal of exactly 1,000,000 yen from larger balance", () => {
      const accountId = bank.createAccount("太郎", 5000000);
      bank.withdraw(accountId, 1000000);
      expect(bank.getBalance(accountId)).toBe(4000000);
    });

    test("should allow 1,000,000 yen withdrawal as boundary case", () => {
      const accountId = bank.createAccount("太郎", 2000000);
      bank.withdraw(accountId, 1000000);
      bank.withdraw(accountId, 1000000);
      expect(bank.getBalance(accountId)).toBe(0);
    });

    test("should allow multiple consecutive 1,000,000 yen withdrawals", () => {
      const accountId = bank.createAccount("太郎", 3000000);
      bank.withdraw(accountId, 1000000);
      expect(bank.getBalance(accountId)).toBe(2000000);
      bank.withdraw(accountId, 1000000);
      expect(bank.getBalance(accountId)).toBe(1000000);
      bank.withdraw(accountId, 1000000);
      expect(bank.getBalance(accountId)).toBe(0);
    });
  });

  // ==========================================================================
  // TRAP T1-06: WITHDRAWAL ABOVE LIMIT (1,000,001 yen)
  // ==========================================================================

  describe("T1-06: Withdrawal Above Limit (1,000,001 yen)", () => {
    test("should reject withdrawal of 1,000,001 yen", () => {
      const accountId = bank.createAccount("太郎", 1000001);
      expect(() => bank.withdraw(accountId, 1000001)).toThrow();
    });

    test("should reject withdrawal significantly above limit", () => {
      const accountId = bank.createAccount("太郎", 10000000);
      expect(() => bank.withdraw(accountId, 1000001)).toThrow();
    });

    test("should reject withdrawal of 2,000,000 yen", () => {
      const accountId = bank.createAccount("太郎", 5000000);
      expect(() => bank.withdraw(accountId, 2000000)).toThrow();
    });

    test("should not modify balance when rejecting over-limit withdrawal", () => {
      const accountId = bank.createAccount("太郎", 5000000);
      try {
        bank.withdraw(accountId, 1000001);
      } catch (e) {
        // Expected
      }
      expect(bank.getBalance(accountId)).toBe(5000000);
    });

    test("should allow 999,999 yen withdrawal (just below limit)", () => {
      const accountId = bank.createAccount("太郎", 1000000);
      bank.withdraw(accountId, 999999);
      expect(bank.getBalance(accountId)).toBe(1);
    });
  });

  // ==========================================================================
  // TRAP T1-07: TRANSFER ATOMICITY
  // ==========================================================================

  describe("T1-07: Transfer Atomicity", () => {
    let sourceId: string;
    let destId: string;

    beforeEach(() => {
      sourceId = bank.createAccount("太郎", 500000);
      destId = bank.createAccount("花子", 100000);
    });

    test("should transfer atomically (both debit and credit succeed)", () => {
      bank.transfer(sourceId, destId, 100000);
      expect(bank.getBalance(sourceId)).toBe(400000);
      expect(bank.getBalance(destId)).toBe(200000);
    });

    test("should not debit source if destination does not exist", () => {
      const initialBalance = bank.getBalance(sourceId);
      try {
        bank.transfer(sourceId, "invalid-id", 50000);
      } catch (e) {
        // Expected
      }
      expect(bank.getBalance(sourceId)).toBe(initialBalance);
    });

    test("should not credit destination if transfer fails due to insufficient balance", () => {
      const destInitial = bank.getBalance(destId);
      try {
        bank.transfer(sourceId, destId, 1000000);
      } catch (e) {
        // Expected
      }
      expect(bank.getBalance(destId)).toBe(destInitial);
    });

    test("should maintain total money in system across transfer", () => {
      const totalBefore =
        bank.getBalance(sourceId) + bank.getBalance(destId);
      bank.transfer(sourceId, destId, 100000);
      const totalAfter =
        bank.getBalance(sourceId) + bank.getBalance(destId);
      expect(totalAfter).toBe(totalBefore);
    });

    test("should handle zero balance source correctly", () => {
      const zeroId = bank.createAccount("ゼロ", 0);
      const targetId = bank.createAccount("ターゲット", 100000);
      expect(() => bank.transfer(zeroId, targetId, 1)).toThrow();
    });
  });

  // ==========================================================================
  // TRAP T1-08: SELF-TRANSFER (SAME SOURCE AND DESTINATION)
  // ==========================================================================

  describe("T1-08: Self-Transfer (Same Source and Destination)", () => {
    let accountId: string;

    beforeEach(() => {
      accountId = bank.createAccount("太郎", 500000);
    });

    test("should reject self-transfer", () => {
      expect(() => bank.transfer(accountId, accountId, 100000)).toThrow();
    });

    test("should reject self-transfer with any amount", () => {
      expect(() => bank.transfer(accountId, accountId, 1)).toThrow();
      expect(() => bank.transfer(accountId, accountId, 1000000)).toThrow();
      expect(() => bank.transfer(accountId, accountId, 500000)).toThrow();
    });

    test("should not modify balance on rejected self-transfer", () => {
      const initialBalance = bank.getBalance(accountId);
      try {
        bank.transfer(accountId, accountId, 100000);
      } catch (e) {
        // Expected
      }
      expect(bank.getBalance(accountId)).toBe(initialBalance);
    });

    test("should allow transfers between different accounts", () => {
      const id2 = bank.createAccount("花子", 100000);
      bank.transfer(accountId, id2, 50000);
      expect(bank.getBalance(accountId)).toBe(450000);
      expect(bank.getBalance(id2)).toBe(150000);
    });
  });

  // ==========================================================================
  // TRAP T1-09: TRANSFER AMOUNT EXCEEDING WITHDRAWAL LIMIT
  // ==========================================================================

  describe("T1-09: Transfer Amount Exceeding Withdrawal Limit", () => {
    let sourceId: string;
    let destId: string;

    beforeEach(() => {
      sourceId = bank.createAccount("太郎", 5000000);
      destId = bank.createAccount("花子", 1000000);
    });

    test("should allow transfer of exactly 1,000,000 yen", () => {
      bank.transfer(sourceId, destId, 1000000);
      expect(bank.getBalance(sourceId)).toBe(4000000);
      expect(bank.getBalance(destId)).toBe(2000000);
    });

    test("should reject transfer exceeding 1,000,000 yen limit", () => {
      expect(() => bank.transfer(sourceId, destId, 1000001)).toThrow();
    });

    test("should reject transfer of 2,000,000 yen", () => {
      expect(() => bank.transfer(sourceId, destId, 2000000)).toThrow();
    });

    test("should allow 999,999 yen transfer (below limit)", () => {
      bank.transfer(sourceId, destId, 999999);
      expect(bank.getBalance(sourceId)).toBe(4000001);
      expect(bank.getBalance(destId)).toBe(1999999);
    });

    test("should not modify accounts when rejecting over-limit transfer", () => {
      const sourceBefore = bank.getBalance(sourceId);
      const destBefore = bank.getBalance(destId);
      try {
        bank.transfer(sourceId, destId, 2000000);
      } catch (e) {
        // Expected
      }
      expect(bank.getBalance(sourceId)).toBe(sourceBefore);
      expect(bank.getBalance(destId)).toBe(destBefore);
    });
  });

  // ==========================================================================
  // TRAP T1-10: WHITESPACE-ONLY ACCOUNT NAME
  // ==========================================================================

  describe("T1-10: Whitespace-Only Account Name", () => {
    test("should reject account name with only spaces", () => {
      expect(() => bank.createAccount("   ", 100000)).toThrow();
    });

    test("should reject account name with only tabs", () => {
      expect(() => bank.createAccount("\t\t\t", 100000)).toThrow();
    });

    test("should reject account name with only newlines", () => {
      expect(() => bank.createAccount("\n\n", 100000)).toThrow();
    });

    test("should reject account name with mixed whitespace", () => {
      expect(() => bank.createAccount(" \t \n ", 100000)).toThrow();
    });

    test("should reject empty string account name", () => {
      expect(() => bank.createAccount("", 100000)).toThrow();
    });

    test("should accept name with leading/trailing spaces but non-whitespace content", () => {
      const accountId = bank.createAccount("  太郎  ", 100000);
      expect(bank.getBalance(accountId)).toBe(100000);
    });

    test("should accept valid account names", () => {
      const id1 = bank.createAccount("太郎", 100000);
      const id2 = bank.createAccount("John Doe", 100000);
      const id3 = bank.createAccount("123", 100000);
      expect(bank.getBalance(id1)).toBe(100000);
      expect(bank.getBalance(id2)).toBe(100000);
      expect(bank.getBalance(id3)).toBe(100000);
    });
  });

  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================

  describe("Integration: Complex Scenarios", () => {
    test("should handle realistic banking sequence", () => {
      const account1 = bank.createAccount("Account 1", 100000);
      const account2 = bank.createAccount("Account 2", 200000);
      const account3 = bank.createAccount("Account 3", 50000);

      // Deposit to account 1
      bank.deposit(account1, 50000);
      expect(bank.getBalance(account1)).toBe(150000);

      // Transfer from account 1 to account 2
      bank.transfer(account1, account2, 75000);
      expect(bank.getBalance(account1)).toBe(75000);
      expect(bank.getBalance(account2)).toBe(275000);

      // Withdraw from account 2
      bank.withdraw(account2, 100000);
      expect(bank.getBalance(account2)).toBe(175000);

      // Transfer from account 2 to account 3
      bank.transfer(account2, account3, 75000);
      expect(bank.getBalance(account2)).toBe(100000);
      expect(bank.getBalance(account3)).toBe(125000);
    });

    test("should enforce all limits in complex scenario", () => {
      const source = bank.createAccount("Source", 10000000);
      const dest = bank.createAccount("Dest", 1000000);

      // Should allow up to 1,000,000 per transaction
      bank.withdraw(source, 1000000);
      bank.withdraw(source, 1000000);
      bank.transfer(source, dest, 1000000);

      // Should reject over limit
      expect(() => bank.transfer(source, dest, 1000001)).toThrow();
    });

    test("should maintain consistency across multiple operations", () => {
      const a = bank.createAccount("A", 1000000);
      const b = bank.createAccount("B", 1000000);
      const c = bank.createAccount("C", 1000000);

      const initial = bank.getBalance(a) + bank.getBalance(b) + bank.getBalance(c);

      bank.transfer(a, b, 500000);
      bank.transfer(b, c, 300000);
      bank.transfer(c, a, 200000);
      bank.withdraw(b, 100000);
      bank.deposit(c, 50000);

      const final = bank.getBalance(a) + bank.getBalance(b) + bank.getBalance(c);

      // Total should decrease by withdrawal amount only
      expect(final).toBe(initial - 100000);
    });
  });
});
