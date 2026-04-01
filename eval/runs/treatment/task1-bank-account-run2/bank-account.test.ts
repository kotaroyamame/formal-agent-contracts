// Tests for Bank Account System (Run 2)
// Property-based style assertions and invariant checks

import { describe, it, expect, beforeEach } from "vitest";
import {
  BankAccountSystem,
  AccountId,
  Money,
  Account,
  createAccountId,
  createMoney,
  Invariants,
} from "./bank-account";

describe("BankAccountSystem - Run 2: Explicit Invariants and Branded Types", () => {
  let bank: BankAccountSystem;

  beforeEach(() => {
    bank = new BankAccountSystem();
  });

  describe("Invariants.isValidName - Name Validation", () => {
    it("should accept non-empty names", () => {
      expect(Invariants.isValidName("John")).toBe(true);
      expect(Invariants.isValidName("A")).toBe(true);
      expect(Invariants.isValidName("Jane Doe")).toBe(true);
    });

    it("should reject empty string", () => {
      expect(Invariants.isValidName("")).toBe(false);
    });

    it("should reject whitespace-only strings", () => {
      expect(Invariants.isValidName(" ")).toBe(false);
      expect(Invariants.isValidName("   ")).toBe(false);
      expect(Invariants.isValidName("\t")).toBe(false);
    });

    it("should accept names with leading/trailing whitespace (after trim)", () => {
      expect(Invariants.isValidName("  John  ")).toBe(true);
      expect(Invariants.isValidName("\tJane\t")).toBe(true);
    });
  });

  describe("Invariants.isValidMoney - Money Invariant", () => {
    it("should accept zero", () => {
      expect(Invariants.isValidMoney(createMoney(0))).toBe(true);
    });

    it("should accept positive amounts", () => {
      expect(Invariants.isValidMoney(createMoney(1))).toBe(true);
      expect(Invariants.isValidMoney(createMoney(1000000))).toBe(true);
      expect(Invariants.isValidMoney(createMoney(999999998))).toBe(true);
    });

    it("should reject maximum value", () => {
      expect(Invariants.isValidMoney(999999999 as Money)).toBe(false);
    });
  });

  describe("OpenAccount - Name Trimming", () => {
    it("should trim leading whitespace from name", () => {
      const id = bank.openAccount("  John", createMoney(100));
      const account = bank.getAccount(id);
      expect(account?.name).toBe("John");
    });

    it("should trim trailing whitespace from name", () => {
      const id = bank.openAccount("John  ", createMoney(100));
      const account = bank.getAccount(id);
      expect(account?.name).toBe("John");
    });

    it("should trim both leading and trailing whitespace", () => {
      const id = bank.openAccount("  Jane Doe  ", createMoney(100));
      const account = bank.getAccount(id);
      expect(account?.name).toBe("Jane Doe");
    });

    it("should reject name that becomes empty after trimming", () => {
      expect(() => {
        bank.openAccount("   ", createMoney(100));
      }).toThrow("not be empty or whitespace-only after trimming");
    });

    it("should accept single character name", () => {
      const id = bank.openAccount("X", createMoney(100));
      expect(bank.getAccount(id)?.name).toBe("X");
    });

    it("should create account with zero balance", () => {
      const id = bank.openAccount("Zero Account", createMoney(0));
      expect(bank.getAccount(id)?.balance).toBe(0);
    });
  });

  describe("Deposit - Zero Amount Handling", () => {
    let accountId: AccountId;

    beforeEach(() => {
      accountId = bank.openAccount("Test", createMoney(100));
    });

    it("should reject zero deposit", () => {
      expect(() => {
        bank.deposit(accountId, createMoney(0));
      }).toThrow("must be positive");
    });

    it("should accept deposit of 1", () => {
      bank.deposit(accountId, createMoney(1));
      expect(bank.getBalance(accountId)).toBe(101);
    });

    it("should preserve state on failed deposit", () => {
      const before = bank.getBalance(accountId);
      try {
        bank.deposit(accountId, createMoney(0));
      } catch (e) {
        // expected
      }
      expect(bank.getBalance(accountId)).toBe(before);
    });
  });

  describe("Withdraw - Boundary Conditions", () => {
    let accountId: AccountId;

    beforeEach(() => {
      accountId = bank.openAccount("Test", createMoney(500000));
    });

    it("should allow withdrawal to zero", () => {
      bank.withdraw(accountId, createMoney(500000));
      expect(bank.getBalance(accountId)).toBe(0);
    });

    it("should reject withdrawal of 1 from zero-balance account", () => {
      const zeroId = bank.openAccount("Zero", createMoney(0));
      expect(() => {
        bank.withdraw(zeroId, createMoney(1));
      }).toThrow("Insufficient funds");
    });

    it("should respect limit boundary", () => {
      const highId = bank.openAccount("High", createMoney(1000000));
      bank.withdraw(highId, createMoney(1000000));
      expect(bank.getBalance(highId)).toBe(0);
    });

    it("should reject amount exceeding limit", () => {
      const highId = bank.openAccount("High", createMoney(2000000));
      expect(() => {
        bank.withdraw(highId, createMoney(1000001));
      }).toThrow("exceeds daily limit");
    });
  });

  describe("Transfer - Atomicity and State Preservation", () => {
    let fromId: AccountId;
    let toId: AccountId;

    beforeEach(() => {
      fromId = bank.openAccount("From", createMoney(100000));
      toId = bank.openAccount("To", createMoney(50000));
    });

    it("should preserve total balance (atomicity property)", () => {
      const totalBefore = bank.getBalance(fromId) + bank.getBalance(toId);
      bank.transfer(fromId, toId, createMoney(25000));
      const totalAfter = bank.getBalance(fromId) + bank.getBalance(toId);
      expect(totalAfter).toBe(totalBefore);
    });

    it("should update both accounts in single operation", () => {
      const fromBefore = bank.getBalance(fromId);
      const toBefore = bank.getBalance(toId);

      bank.transfer(fromId, toId, createMoney(10000));

      expect(bank.getBalance(fromId)).toBe(fromBefore - 10000);
      expect(bank.getBalance(toId)).toBe(toBefore + 10000);
    });

    it("should reject zero amount", () => {
      expect(() => {
        bank.transfer(fromId, toId, createMoney(0));
      }).toThrow("must be positive");
    });

    it("should reject transfer to self", () => {
      expect(() => {
        bank.transfer(fromId, fromId, createMoney(100));
      }).toThrow("must be different");
    });

    it("should reject transfer exceeding limit", () => {
      expect(() => {
        bank.transfer(fromId, toId, createMoney(1000001));
      }).toThrow("exceeds daily limit");
    });

    it("should handle chain of transfers", () => {
      const id3 = bank.openAccount("Third", createMoney(0));

      bank.transfer(fromId, toId, createMoney(30000));
      bank.transfer(toId, id3, createMoney(20000));
      bank.transfer(id3, fromId, createMoney(10000));

      const total =
        bank.getBalance(fromId) +
        bank.getBalance(toId) +
        bank.getBalance(id3);
      expect(total).toBe(150000); // Preserved across chain
    });
  });

  describe("State Invariant Preservation", () => {
    it("should maintain valid state after creating account", () => {
      const id = bank.openAccount("Test", createMoney(100));
      const acc = bank.getAccount(id);
      expect(Invariants.isValidAccount(acc!)).toBe(true);
    });

    it("should maintain valid state after deposit", () => {
      const id = bank.openAccount("Test", createMoney(100));
      bank.deposit(id, createMoney(50));
      const acc = bank.getAccount(id);
      expect(Invariants.isValidAccount(acc!)).toBe(true);
    });

    it("should maintain valid state after withdrawal", () => {
      const id = bank.openAccount("Test", createMoney(100));
      bank.withdraw(id, createMoney(25));
      const acc = bank.getAccount(id);
      expect(Invariants.isValidAccount(acc!)).toBe(true);
    });

    it("should maintain valid state after transfer", () => {
      const id1 = bank.openAccount("From", createMoney(100));
      const id2 = bank.openAccount("To", createMoney(50));
      bank.transfer(id1, id2, createMoney(25));

      const acc1 = bank.getAccount(id1);
      const acc2 = bank.getAccount(id2);
      expect(Invariants.isValidAccount(acc1!)).toBe(true);
      expect(Invariants.isValidAccount(acc2!)).toBe(true);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle multiple accounts with different states", () => {
      const id1 = bank.openAccount("Account1", createMoney(1000));
      const id2 = bank.openAccount("Account2", createMoney(2000));
      const id3 = bank.openAccount("Account3", createMoney(0));

      bank.deposit(id1, createMoney(500));
      bank.withdraw(id2, createMoney(300));
      bank.transfer(id1, id3, createMoney(400));

      expect(bank.getBalance(id1)).toBe(1100);
      expect(bank.getBalance(id2)).toBe(1700);
      expect(bank.getBalance(id3)).toBe(400);
    });

    it("should maintain invariants through high-volume operations", () => {
      const accounts: AccountId[] = [];
      for (let i = 0; i < 10; i++) {
        accounts.push(bank.openAccount(`Account${i}`, createMoney(1000)));
      }

      for (let i = 0; i < 5; i++) {
        bank.deposit(accounts[i], createMoney(100));
      }

      for (let i = 0; i < 4; i++) {
        bank.transfer(accounts[i], accounts[i + 1], createMoney(50));
      }

      for (const id of accounts) {
        expect(Invariants.isValidMoney(bank.getBalance(id))).toBe(true);
      }
    });

    it("should correctly handle maximum balance scenario", () => {
      const id = bank.openAccount("Max Test", createMoney(999999998));
      bank.deposit(id, createMoney(1));
      expect(bank.getBalance(id)).toBe(999999999);

      expect(() => {
        bank.deposit(id, createMoney(1));
      }).toThrow("exceeds maximum");
    });
  });

  describe("Error Recovery and State Consistency", () => {
    it("should maintain consistency after failed deposit", () => {
      const id = bank.openAccount("Test", createMoney(100));
      const before = bank.getBalance(id);

      try {
        bank.deposit(id, createMoney(0));
      } catch (e) {
        // Expected
      }

      expect(bank.getBalance(id)).toBe(before);
    });

    it("should maintain consistency after failed withdrawal", () => {
      const id = bank.openAccount("Test", createMoney(100));
      const before = bank.getBalance(id);

      try {
        bank.withdraw(id, createMoney(101));
      } catch (e) {
        // Expected
      }

      expect(bank.getBalance(id)).toBe(before);
    });

    it("should maintain consistency after failed transfer", () => {
      const id1 = bank.openAccount("From", createMoney(100));
      const id2 = bank.openAccount("To", createMoney(50));
      const fromBefore = bank.getBalance(id1);
      const toBefore = bank.getBalance(id2);

      try {
        bank.transfer(id1, id2, createMoney(101));
      } catch (e) {
        // Expected
      }

      expect(bank.getBalance(id1)).toBe(fromBefore);
      expect(bank.getBalance(id2)).toBe(toBefore);
    });
  });
});
