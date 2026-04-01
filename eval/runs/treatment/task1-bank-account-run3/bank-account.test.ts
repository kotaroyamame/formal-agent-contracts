// Tests for Bank Account System (Run 3)
// Focus on atomicity and rollback scenarios

import { describe, it, expect, beforeEach } from "vitest";
import {
  BankAccountSystem,
  AccountId,
  Money,
  createAccountId,
  createMoney,
  AtomicTransactionError,
} from "./bank-account";

describe("BankAccountSystem - Run 3: Atomicity and Rollback", () => {
  let bank: BankAccountSystem;

  beforeEach(() => {
    bank = new BankAccountSystem();
  });

  describe("Transfer - Atomicity Guarantees", () => {
    let fromId: AccountId;
    let toId: AccountId;

    beforeEach(() => {
      fromId = bank.openAccount("From", createMoney(100000));
      toId = bank.openAccount("To", createMoney(50000));
    });

    it("should atomically transfer both amounts", () => {
      const fromBefore = bank.getBalance(fromId);
      const toBefore = bank.getBalance(toId);

      bank.transfer(fromId, toId, createMoney(25000));

      expect(bank.getBalance(fromId)).toBe(fromBefore - 25000);
      expect(bank.getBalance(toId)).toBe(toBefore + 25000);
    });

    it("should preserve money conservation (atomicity property)", () => {
      const totalBefore =
        bank.getBalance(fromId) + bank.getBalance(toId);

      bank.transfer(fromId, toId, createMoney(30000));

      const totalAfter =
        bank.getBalance(fromId) + bank.getBalance(toId);
      expect(totalAfter).toBe(totalBefore);
    });

    it("should rollback on insufficient funds pre-check", () => {
      const fromBefore = bank.getBalance(fromId);
      const toBefore = bank.getBalance(toId);

      expect(() => {
        bank.transfer(fromId, toId, createMoney(100001));
      }).toThrow("Insufficient funds");

      // Verify no state change
      expect(bank.getBalance(fromId)).toBe(fromBefore);
      expect(bank.getBalance(toId)).toBe(toBefore);
    });

    it("should reject self-transfer", () => {
      const before = bank.getBalance(fromId);

      expect(() => {
        bank.transfer(fromId, fromId, createMoney(100));
      }).toThrow("must be different");

      expect(bank.getBalance(fromId)).toBe(before);
    });

    it("should reject transfer exceeding limit", () => {
      const fromBefore = bank.getBalance(fromId);
      const toBefore = bank.getBalance(toId);

      expect(() => {
        bank.transfer(fromId, toId, createMoney(1000001));
      }).toThrow("exceeds daily limit");

      expect(bank.getBalance(fromId)).toBe(fromBefore);
      expect(bank.getBalance(toId)).toBe(toBefore);
    });

    it("should handle transfers at limit boundary", () => {
      const id1 = bank.openAccount("Limit From", createMoney(1000000));
      const id2 = bank.openAccount("Limit To", createMoney(0));

      bank.transfer(id1, id2, createMoney(1000000));

      expect(bank.getBalance(id1)).toBe(0);
      expect(bank.getBalance(id2)).toBe(1000000);
    });

    it("should be repeatable (idempotent in state)", () => {
      const amount = createMoney(10000);

      bank.transfer(fromId, toId, amount);
      const fromAfter1 = bank.getBalance(fromId);
      const toAfter1 = bank.getBalance(toId);

      bank.transfer(fromId, toId, amount);
      const fromAfter2 = bank.getBalance(fromId);
      const toAfter2 = bank.getBalance(toId);

      expect(fromAfter2).toBe(fromAfter1 - Number(amount));
      expect(toAfter2).toBe(toAfter1 + Number(amount));
    });
  });

  describe("TransferSafe - Two-Phase Commit", () => {
    let fromId: AccountId;
    let toId: AccountId;

    beforeEach(() => {
      fromId = bank.openAccount("From", createMoney(100000));
      toId = bank.openAccount("To", createMoney(50000));
    });

    it("should commit transfer when flag is true", () => {
      const result = bank.transferSafe(
        fromId,
        toId,
        createMoney(25000),
        true
      );

      expect(result.success).toBe(true);
      expect(bank.getBalance(fromId)).toBe(75000);
      expect(bank.getBalance(toId)).toBe(75000);
    });

    it("should rollback when flag is false", () => {
      const fromBefore = bank.getBalance(fromId);
      const toBefore = bank.getBalance(toId);

      const result = bank.transferSafe(
        fromId,
        toId,
        createMoney(25000),
        false
      );

      expect(result.success).toBe(false);
      expect(bank.getBalance(fromId)).toBe(fromBefore);
      expect(bank.getBalance(toId)).toBe(toBefore);
    });

    it("should preserve balances in returned result", () => {
      const result = bank.transferSafe(
        fromId,
        toId,
        createMoney(10000),
        true
      );

      expect(result.fromBalance).toBe(90000);
      expect(result.toBalance).toBe(60000);
    });

    it("should preserve state on rollback", () => {
      const fromBefore = bank.getBalance(fromId);
      const toBefore = bank.getBalance(toId);

      bank.transferSafe(fromId, toId, createMoney(30000), false);

      expect(bank.getBalance(fromId)).toBe(fromBefore);
      expect(bank.getBalance(toId)).toBe(toBefore);
    });
  });

  describe("Transaction State Management", () => {
    let fromId: AccountId;
    let toId: AccountId;

    beforeEach(() => {
      fromId = bank.openAccount("From", createMoney(100000));
      toId = bank.openAccount("To", createMoney(50000));
    });

    it("should not be in transaction before transfer", () => {
      expect(bank.isInTransaction()).toBe(false);
    });

    it("should not be in transaction after successful transfer", () => {
      bank.transfer(fromId, toId, createMoney(10000));
      expect(bank.isInTransaction()).toBe(false);
    });

    it("should reset transaction state after failed transfer", () => {
      try {
        bank.transfer(fromId, toId, createMoney(100001));
      } catch (e) {
        // Expected
      }
      expect(bank.isInTransaction()).toBe(false);
    });

    it("should reset transaction state after rollback", () => {
      bank.transferSafe(fromId, toId, createMoney(10000), false);
      expect(bank.isInTransaction()).toBe(false);
    });
  });

  describe("Complex Atomicity Scenarios", () => {
    it("should maintain atomicity across multiple sequential transfers", () => {
      const id1 = bank.openAccount("Account1", createMoney(1000));
      const id2 = bank.openAccount("Account2", createMoney(500));
      const id3 = bank.openAccount("Account3", createMoney(200));

      const totalBefore =
        bank.getBalance(id1) +
        bank.getBalance(id2) +
        bank.getBalance(id3);

      bank.transfer(id1, id2, createMoney(200));
      bank.transfer(id2, id3, createMoney(150));
      bank.transfer(id3, id1, createMoney(100));

      const totalAfter =
        bank.getBalance(id1) +
        bank.getBalance(id2) +
        bank.getBalance(id3);

      expect(totalAfter).toBe(totalBefore);
    });

    it("should correctly update all accounts in transfer", () => {
      const id1 = bank.openAccount("A", createMoney(500));
      const id2 = bank.openAccount("B", createMoney(300));

      bank.transfer(id1, id2, createMoney(100));

      const accA = bank.getAccount(id1);
      const accB = bank.getAccount(id2);

      expect(accA?.balance).toBe(400);
      expect(accB?.balance).toBe(400);
    });

    it("should preserve other accounts during transfer", () => {
      const id1 = bank.openAccount("A", createMoney(1000));
      const id2 = bank.openAccount("B", createMoney(500));
      const id3 = bank.openAccount("C", createMoney(200));

      const id3Before = bank.getBalance(id3);

      bank.transfer(id1, id2, createMoney(250));

      expect(bank.getBalance(id3)).toBe(id3Before);
    });

    it("should handle zero-balance source after transfer", () => {
      const id1 = bank.openAccount("From Zero", createMoney(500));
      const id2 = bank.openAccount("To", createMoney(100));

      bank.transfer(id1, id2, createMoney(500));

      expect(bank.getBalance(id1)).toBe(0);
      expect(bank.getBalance(id2)).toBe(600);
    });

    it("should handle transfer to and from zero-balance account", () => {
      const id1 = bank.openAccount("From", createMoney(100));
      const id2 = bank.openAccount("To Zero", createMoney(0));

      bank.transfer(id1, id2, createMoney(50));
      expect(bank.getBalance(id2)).toBe(50);

      bank.transfer(id2, id1, createMoney(30));
      expect(bank.getBalance(id1)).toBe(80);
      expect(bank.getBalance(id2)).toBe(20);
    });
  });

  describe("Error Handling and State Consistency", () => {
    let fromId: AccountId;
    let toId: AccountId;

    beforeEach(() => {
      fromId = bank.openAccount("From", createMoney(100000));
      toId = bank.openAccount("To", createMoney(50000));
    });

    it("should preserve state on error during transfer", () => {
      const fromBefore = bank.getBalance(fromId);
      const toBefore = bank.getBalance(toId);

      try {
        bank.transfer(fromId, toId, createMoney(100001));
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }

      expect(bank.getBalance(fromId)).toBe(fromBefore);
      expect(bank.getBalance(toId)).toBe(toBefore);
    });

    it("should have consistent state after failed transfer attempt", () => {
      bank.transfer(fromId, toId, createMoney(25000));
      const afterFirstTransfer =
        bank.getBalance(fromId) + bank.getBalance(toId);

      try {
        bank.transfer(toId, fromId, createMoney(100000));
      } catch (e) {
        // Expected to fail
      }

      const afterFailedTransfer =
        bank.getBalance(fromId) + bank.getBalance(toId);

      expect(afterFailedTransfer).toBe(afterFirstTransfer);
    });

    it("should reject empty name accounts", () => {
      expect(() => {
        bank.openAccount("", createMoney(100));
      }).toThrow("cannot be empty");
    });

    it("should reject non-existent account in transfer", () => {
      expect(() => {
        bank.transfer(createAccountId(9999), toId, createMoney(100));
      }).toThrow("does not exist");
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero-balance account correctly", () => {
      const id = bank.openAccount("Zero", createMoney(0));
      expect(bank.getBalance(id)).toBe(0);
    });

    it("should allow minimum transfer of 1", () => {
      const id1 = bank.openAccount("From", createMoney(100));
      const id2 = bank.openAccount("To", createMoney(0));

      bank.transfer(id1, id2, createMoney(1));

      expect(bank.getBalance(id1)).toBe(99);
      expect(bank.getBalance(id2)).toBe(1);
    });

    it("should enforce withdrawal limit on transfers", () => {
      const id1 = bank.openAccount("High Balance", createMoney(2000000));
      const id2 = bank.openAccount("Recipient", createMoney(0));

      expect(() => {
        bank.transfer(id1, id2, createMoney(1000001));
      }).toThrow("exceeds daily limit");
    });
  });
});
