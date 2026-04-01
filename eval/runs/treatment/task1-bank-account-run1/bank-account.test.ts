// Comprehensive Tests for Bank Account System (Run 1)
// Tests derived from VDM-SL specification and boundary values

import { describe, it, expect, beforeEach } from "vitest";
import {
  BankAccountSystem,
  AccountId,
  Money,
  createAccountId,
  createMoney,
} from "./bank-account";

describe("BankAccountSystem - Run 1: Classic VDM-SL with Contract Checks", () => {
  let bank: BankAccountSystem;

  beforeEach(() => {
    bank = new BankAccountSystem();
  });

  describe("OpenAccount - Precondition Tests", () => {
    it("should create account with valid name and initial balance", () => {
      const id = bank.openAccount("John Doe", createMoney(1000));
      expect(id).toBeDefined();
      const account = bank.getAccount(id);
      expect(account?.name).toBe("John Doe");
      expect(account?.balance).toBe(1000);
    });

    it("should reject empty name", () => {
      expect(() => {
        bank.openAccount("", createMoney(1000));
      }).toThrow("Account name must have at least 1 character");
    });

    it("should reject whitespace-only name", () => {
      expect(() => {
        bank.openAccount("   ", createMoney(1000));
      }).toThrow("Account name must have at least 1 character");
    });

    it("should accept single character name", () => {
      const id = bank.openAccount("A", createMoney(100));
      expect(bank.getAccount(id)?.name).toBe("A");
    });

    it("should allow zero initial balance", () => {
      const id = bank.openAccount("Zero Balance", createMoney(0));
      expect(bank.getAccount(id)?.balance).toBe(0);
    });

    it("should allow large initial balance", () => {
      const id = bank.openAccount("Large Balance", createMoney(999999999));
      expect(bank.getAccount(id)?.balance).toBe(999999999);
    });

    it("should reject initial balance exceeding maximum", () => {
      expect(() => {
        bank.openAccount("Too Much", createMoney(1000000000));
      }).toThrow("Initial balance exceeds maximum");
    });

    it("should reject negative initial balance", () => {
      expect(() => {
        bank.openAccount("Negative", createMoney(-100));
      }).toThrow("Initial balance exceeds maximum");
    });

    it("should assign incrementing account IDs", () => {
      const id1 = bank.openAccount("Account1", createMoney(100));
      const id2 = bank.openAccount("Account2", createMoney(200));
      const id3 = bank.openAccount("Account3", createMoney(300));
      expect((id2 as number) - (id1 as number)).toBe(1);
      expect((id3 as number) - (id2 as number)).toBe(1);
    });
  });

  describe("Deposit - Precondition Tests", () => {
    let accountId: AccountId;

    beforeEach(() => {
      accountId = bank.openAccount("Test Account", createMoney(1000));
    });

    it("should deposit positive amount", () => {
      bank.deposit(accountId, createMoney(500));
      expect(bank.getBalance(accountId)).toBe(1500);
    });

    it("should deposit minimum positive amount", () => {
      bank.deposit(accountId, createMoney(1));
      expect(bank.getBalance(accountId)).toBe(1001);
    });

    it("should reject deposit of zero", () => {
      expect(() => {
        bank.deposit(accountId, createMoney(0));
      }).toThrow("Amount must be positive");
    });

    it("should reject deposit to non-existent account", () => {
      expect(() => {
        bank.deposit(createAccountId(9999), createMoney(100));
      }).toThrow("Account does not exist");
    });

    it("should reject deposit that would exceed maximum balance", () => {
      const id = bank.openAccount("Near Max", createMoney(999999998));
      expect(() => {
        bank.deposit(id, createMoney(2));
      }).toThrow("Deposit would exceed maximum balance");
    });

    it("should handle multiple deposits", () => {
      bank.deposit(accountId, createMoney(100));
      expect(bank.getBalance(accountId)).toBe(1100);
      bank.deposit(accountId, createMoney(200));
      expect(bank.getBalance(accountId)).toBe(1300);
      bank.deposit(accountId, createMoney(50));
      expect(bank.getBalance(accountId)).toBe(1350);
    });
  });

  describe("Withdraw - Precondition Tests", () => {
    let accountId: AccountId;

    beforeEach(() => {
      accountId = bank.openAccount("Test Account", createMoney(500000));
    });

    it("should withdraw positive amount", () => {
      bank.withdraw(accountId, createMoney(100000));
      expect(bank.getBalance(accountId)).toBe(400000);
    });

    it("should withdraw minimum positive amount", () => {
      bank.withdraw(accountId, createMoney(1));
      expect(bank.getBalance(accountId)).toBe(499999);
    });

    it("should withdraw exact balance", () => {
      bank.withdraw(accountId, createMoney(500000));
      expect(bank.getBalance(accountId)).toBe(0);
    });

    it("should reject withdrawal of zero", () => {
      expect(() => {
        bank.withdraw(accountId, createMoney(0));
      }).toThrow("Amount must be positive");
    });

    it("should reject withdrawal exceeding balance", () => {
      expect(() => {
        bank.withdraw(accountId, createMoney(500001));
      }).toThrow("Insufficient funds");
    });

    it("should reject withdrawal exceeding daily limit", () => {
      const id = bank.openAccount("High Balance", createMoney(2000000));
      expect(() => {
        bank.withdraw(id, createMoney(1000001));
      }).toThrow("Withdrawal exceeds daily limit");
    });

    it("should allow withdrawal at limit boundary", () => {
      const id = bank.openAccount("Limit Test", createMoney(1000000));
      bank.withdraw(id, createMoney(1000000));
      expect(bank.getBalance(id)).toBe(0);
    });

    it("should reject withdrawal from non-existent account", () => {
      expect(() => {
        bank.withdraw(createAccountId(9999), createMoney(100));
      }).toThrow("Account does not exist");
    });

    it("should handle multiple withdrawals", () => {
      bank.withdraw(accountId, createMoney(100000));
      expect(bank.getBalance(accountId)).toBe(400000);
      bank.withdraw(accountId, createMoney(200000));
      expect(bank.getBalance(accountId)).toBe(200000);
      bank.withdraw(accountId, createMoney(50000));
      expect(bank.getBalance(accountId)).toBe(150000);
    });
  });

  describe("GetBalance - Tests", () => {
    it("should return current balance", () => {
      const id = bank.openAccount("Balance Test", createMoney(12345));
      expect(bank.getBalance(id)).toBe(12345);
    });

    it("should return zero balance", () => {
      const id = bank.openAccount("Zero", createMoney(0));
      expect(bank.getBalance(id)).toBe(0);
    });

    it("should reflect deposits", () => {
      const id = bank.openAccount("Check", createMoney(100));
      bank.deposit(id, createMoney(50));
      expect(bank.getBalance(id)).toBe(150);
    });

    it("should reflect withdrawals", () => {
      const id = bank.openAccount("Check", createMoney(200));
      bank.withdraw(id, createMoney(75));
      expect(bank.getBalance(id)).toBe(125);
    });

    it("should reject query of non-existent account", () => {
      expect(() => {
        bank.getBalance(createAccountId(9999));
      }).toThrow("Account does not exist");
    });
  });

  describe("Transfer - Precondition Tests", () => {
    let fromId: AccountId;
    let toId: AccountId;

    beforeEach(() => {
      fromId = bank.openAccount("From Account", createMoney(100000));
      toId = bank.openAccount("To Account", createMoney(50000));
    });

    it("should transfer positive amount", () => {
      bank.transfer(fromId, toId, createMoney(10000));
      expect(bank.getBalance(fromId)).toBe(90000);
      expect(bank.getBalance(toId)).toBe(60000);
    });

    it("should transfer minimum positive amount", () => {
      bank.transfer(fromId, toId, createMoney(1));
      expect(bank.getBalance(fromId)).toBe(99999);
      expect(bank.getBalance(toId)).toBe(50001);
    });

    it("should transfer entire balance", () => {
      bank.transfer(fromId, toId, createMoney(100000));
      expect(bank.getBalance(fromId)).toBe(0);
      expect(bank.getBalance(toId)).toBe(150000);
    });

    it("should reject transfer of zero", () => {
      expect(() => {
        bank.transfer(fromId, toId, createMoney(0));
      }).toThrow("Amount must be positive");
    });

    it("should reject transfer to same account", () => {
      expect(() => {
        bank.transfer(fromId, fromId, createMoney(100));
      }).toThrow("Source and destination must be different");
    });

    it("should reject transfer from non-existent source", () => {
      expect(() => {
        bank.transfer(createAccountId(9999), toId, createMoney(100));
      }).toThrow("Source account does not exist");
    });

    it("should reject transfer to non-existent destination", () => {
      expect(() => {
        bank.transfer(fromId, createAccountId(9999), createMoney(100));
      }).toThrow("Destination account does not exist");
    });

    it("should reject transfer exceeding balance", () => {
      expect(() => {
        bank.transfer(fromId, toId, createMoney(100001));
      }).toThrow("Insufficient funds in source account");
    });

    it("should reject transfer exceeding daily limit", () => {
      expect(() => {
        bank.transfer(fromId, toId, createMoney(1000001));
      }).toThrow("Transfer exceeds daily limit");
    });

    it("should allow transfer at limit boundary", () => {
      const id1 = bank.openAccount("Limit From", createMoney(1000000));
      const id2 = bank.openAccount("Limit To", createMoney(0));
      bank.transfer(id1, id2, createMoney(1000000));
      expect(bank.getBalance(id1)).toBe(0);
      expect(bank.getBalance(id2)).toBe(1000000);
    });

    it("should be atomic - both accounts updated together", () => {
      bank.transfer(fromId, toId, createMoney(25000));
      // Verify atomicity: sum of balances remains constant minus transfer
      const totalBefore = 100000 + 50000;
      const totalAfter = bank.getBalance(fromId) + bank.getBalance(toId);
      expect(totalAfter).toBe(totalBefore);
    });

    it("should handle multiple transfers", () => {
      bank.transfer(fromId, toId, createMoney(10000));
      expect(bank.getBalance(fromId)).toBe(90000);
      expect(bank.getBalance(toId)).toBe(60000);

      bank.transfer(toId, fromId, createMoney(5000));
      expect(bank.getBalance(fromId)).toBe(95000);
      expect(bank.getBalance(toId)).toBe(55000);

      bank.transfer(fromId, toId, createMoney(20000));
      expect(bank.getBalance(fromId)).toBe(75000);
      expect(bank.getBalance(toId)).toBe(75000);
    });

    it("should handle transfer chain", () => {
      const id3 = bank.openAccount("Third", createMoney(0));
      bank.transfer(fromId, toId, createMoney(30000));
      bank.transfer(toId, id3, createMoney(20000));
      expect(bank.getBalance(fromId)).toBe(70000);
      expect(bank.getBalance(toId)).toBe(60000);
      expect(bank.getBalance(id3)).toBe(20000);
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle account with zero balance correctly", () => {
      const id = bank.openAccount("Zero", createMoney(0));
      expect(bank.getBalance(id)).toBe(0);
      expect(() => {
        bank.withdraw(id, createMoney(1));
      }).toThrow("Insufficient funds");
    });

    it("should handle maximum balance operations", () => {
      const id = bank.openAccount("Max", createMoney(999999999));
      expect(bank.getBalance(id)).toBe(999999999);
      expect(() => {
        bank.deposit(id, createMoney(1));
      }).toThrow("Deposit would exceed maximum balance");
    });

    it("should preserve account state across operations", () => {
      const id1 = bank.openAccount("Preserved 1", createMoney(100));
      const id2 = bank.openAccount("Preserved 2", createMoney(200));
      const id3 = bank.openAccount("Preserved 3", createMoney(300));

      bank.deposit(id2, createMoney(50));
      bank.withdraw(id3, createMoney(25));
      bank.transfer(id1, id2, createMoney(10));

      expect(bank.getBalance(id1)).toBe(90);
      expect(bank.getBalance(id2)).toBe(260);
      expect(bank.getBalance(id3)).toBe(275);
    });

    it("should enforce withdrawal limit across operations", () => {
      const id = bank.openAccount("Limit Enforced", createMoney(2000000));
      bank.withdraw(id, createMoney(500000));
      expect(() => {
        bank.withdraw(id, createMoney(500001));
      }).toThrow("Withdrawal exceeds daily limit");
    });
  });
});
