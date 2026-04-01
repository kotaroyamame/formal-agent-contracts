// Tests for Bank Account System (Run 5)
// Test each proof obligation explicitly

import { describe, it, expect, beforeEach } from "vitest";
import {
  BankAccountSystem,
  AccountId,
  Money,
  Account,
  createAccountId,
  createMoney,
  ProofObligations,
} from "./bank-account";

describe("BankAccountSystem - Run 5: Proof Obligation Tests", () => {
  let bank: BankAccountSystem;

  beforeEach(() => {
    bank = new BankAccountSystem();
  });

  describe("PO-1: Name Invariant", () => {
    it("PO-1 should enforce non-empty names on account creation", () => {
      expect(() => {
        bank.openAccount("", createMoney(100));
      }).toThrow("non-empty");
    });

    it("PO-1 should accept valid names", () => {
      const id = bank.openAccount("John", createMoney(100));
      expect(bank.getAccount(id)?.name).toBe("John");
    });

    it("PO-1 should reject whitespace-only names", () => {
      expect(() => {
        bank.openAccount("   ", createMoney(100));
      }).toThrow("non-empty");
    });
  });

  describe("PO-2 & PO-3: Account Creation Properties", () => {
    it("PO-2 should create account with correct name", () => {
      const id = bank.openAccount("TestName", createMoney(500));
      const acc = bank.getAccount(id);
      expect(acc?.name).toBe("TestName");
    });

    it("PO-3 should create account with correct balance", () => {
      const id = bank.openAccount("Test", createMoney(12345));
      const acc = bank.getAccount(id);
      expect(acc?.balance).toBe(12345);
    });

    it("PO-2 & PO-3 should create account with both correct", () => {
      const id = bank.openAccount("Complete", createMoney(54321));
      const acc = bank.getAccount(id);
      expect(acc?.name).toBe("Complete");
      expect(acc?.balance).toBe(54321);
    });
  });

  describe("PO-4: Next ID Increment", () => {
    it("PO-4 should increment ID on each account creation", () => {
      const id1 = bank.openAccount("Account1", createMoney(100));
      const id2 = bank.openAccount("Account2", createMoney(200));
      const id3 = bank.openAccount("Account3", createMoney(300));

      expect((id2 as number) - (id1 as number)).toBe(1);
      expect((id3 as number) - (id2 as number)).toBe(1);
    });

    it("PO-4 should produce sequential IDs", () => {
      const ids = [];
      for (let i = 0; i < 10; i++) {
        ids.push(bank.openAccount(`Acc${i}`, createMoney(i * 100)));
      }

      for (let i = 0; i < ids.length - 1; i++) {
        expect((ids[i + 1] as number) - (ids[i] as number)).toBe(1);
      }
    });
  });

  describe("PO-5: Existing Accounts Unchanged", () => {
    it("PO-5 should preserve existing accounts when creating new one", () => {
      const id1 = bank.openAccount("First", createMoney(100));
      const id2 = bank.openAccount("Second", createMoney(200));

      const acc1 = bank.getAccount(id1);
      expect(acc1?.balance).toBe(100);
      expect(acc1?.name).toBe("First");
    });

    it("PO-5 should not modify existing account data", () => {
      const id1 = bank.openAccount("Original", createMoney(999));
      const originalBalance = bank.getBalance(id1);

      bank.openAccount("NewAccount", createMoney(111));

      expect(bank.getBalance(id1)).toBe(originalBalance);
      expect(bank.getAccount(id1)?.name).toBe("Original");
    });
  });

  describe("PO-6: Deposit Amount Must Be Positive", () => {
    let accountId: AccountId;

    beforeEach(() => {
      accountId = bank.openAccount("Test", createMoney(1000));
    });

    it("PO-6 should reject zero deposit", () => {
      expect(() => {
        bank.deposit(accountId, createMoney(0));
      }).toThrow("positive");
    });

    it("PO-6 should accept positive deposit", () => {
      expect(() => {
        bank.deposit(accountId, createMoney(100));
      }).not.toThrow();
    });

    it("PO-6 should reject negative deposit (via type constraint)", () => {
      expect(() => {
        bank.deposit(accountId, -100 as Money);
      }).toThrow();
    });
  });

  describe("PO-7: Balance Increased Correctly", () => {
    let accountId: AccountId;

    beforeEach(() => {
      accountId = bank.openAccount("Test", createMoney(1000));
    });

    it("PO-7 should verify balance increase by deposit amount", () => {
      const before = bank.getBalance(accountId);
      bank.deposit(accountId, createMoney(500));
      const after = bank.getBalance(accountId);
      expect(after).toBe(before + 500);
    });

    it("PO-7 should handle multiple deposits", () => {
      bank.deposit(accountId, createMoney(100));
      expect(bank.getBalance(accountId)).toBe(1100);
      bank.deposit(accountId, createMoney(200));
      expect(bank.getBalance(accountId)).toBe(1300);
    });

    it("PO-7 should deposit minimum amount correctly", () => {
      const before = bank.getBalance(accountId);
      bank.deposit(accountId, createMoney(1));
      expect(bank.getBalance(accountId)).toBe(before + 1);
    });
  });

  describe("PO-9: Withdrawal Validity Conditions", () => {
    let accountId: AccountId;

    beforeEach(() => {
      accountId = bank.openAccount("Test", createMoney(500000));
    });

    it("PO-9 should reject zero withdrawal", () => {
      expect(() => {
        bank.withdraw(accountId, createMoney(0));
      }).toThrow("positive");
    });

    it("PO-9 should reject withdrawal exceeding limit", () => {
      const highId = bank.openAccount("High", createMoney(2000000));
      expect(() => {
        bank.withdraw(highId, createMoney(1000001));
      }).toThrow("exceeds daily limit");
    });

    it("PO-9 should reject withdrawal exceeding balance", () => {
      expect(() => {
        bank.withdraw(accountId, createMoney(500001));
      }).toThrow("Insufficient funds");
    });

    it("PO-9 should accept valid withdrawal", () => {
      expect(() => {
        bank.withdraw(accountId, createMoney(100000));
      }).not.toThrow();
    });
  });

  describe("PO-10: Balance Decreased Correctly", () => {
    let accountId: AccountId;

    beforeEach(() => {
      accountId = bank.openAccount("Test", createMoney(5000));
    });

    it("PO-10 should verify balance decrease by withdrawal amount", () => {
      const before = bank.getBalance(accountId);
      bank.withdraw(accountId, createMoney(1000));
      const after = bank.getBalance(accountId);
      expect(after).toBe(before - 1000);
    });

    it("PO-10 should handle withdrawal to zero", () => {
      bank.withdraw(accountId, createMoney(5000));
      expect(bank.getBalance(accountId)).toBe(0);
    });

    it("PO-10 should handle minimum withdrawal", () => {
      const before = bank.getBalance(accountId);
      bank.withdraw(accountId, createMoney(1));
      expect(bank.getBalance(accountId)).toBe(before - 1);
    });
  });

  describe("PO-12: No Negative Balance", () => {
    it("PO-12 should prevent balance from going negative via withdrawal", () => {
      const id = bank.openAccount("Test", createMoney(100));
      bank.withdraw(id, createMoney(100));
      const balance = bank.getBalance(id);
      expect(balance).toBeGreaterThanOrEqual(0);
    });

    it("PO-12 should maintain non-negative balance across operations", () => {
      const id = bank.openAccount("Test", createMoney(500));
      bank.withdraw(id, createMoney(500));
      expect(bank.getBalance(id)).toBe(0);

      // Verify balance is not negative
      const balance = bank.getBalance(id);
      expect(balance).not.toBeLessThan(0);
    });
  });

  describe("PO-13: Query Returns Actual Balance", () => {
    it("PO-13 should return correct balance on creation", () => {
      const id = bank.openAccount("Test", createMoney(12345));
      const result = bank.getBalance(id);
      expect(result).toBe(12345);
    });

    it("PO-13 should return updated balance after deposit", () => {
      const id = bank.openAccount("Test", createMoney(1000));
      bank.deposit(id, createMoney(500));
      const result = bank.getBalance(id);
      expect(result).toBe(1500);
    });

    it("PO-13 should return updated balance after withdrawal", () => {
      const id = bank.openAccount("Test", createMoney(1000));
      bank.withdraw(id, createMoney(250));
      const result = bank.getBalance(id);
      expect(result).toBe(750);
    });
  });

  describe("PO-14: Valid Money in Query Result", () => {
    it("PO-14 should ensure query result is valid (non-negative)", () => {
      const id = bank.openAccount("Test", createMoney(5000));
      const result = bank.getBalance(id);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it("PO-14 should ensure query result is within max", () => {
      const id = bank.openAccount("Test", createMoney(999999998));
      const result = bank.getBalance(id);
      expect(result).toBeLessThan(1000000000);
    });

    it("PO-14 should validate balance of zero account", () => {
      const id = bank.openAccount("Zero", createMoney(0));
      const result = bank.getBalance(id);
      expect(result).toBe(0);
    });
  });

  describe("PO-15 to PO-20: Transfer Atomicity and Money Conservation", () => {
    let fromId: AccountId;
    let toId: AccountId;

    beforeEach(() => {
      fromId = bank.openAccount("From", createMoney(100000));
      toId = bank.openAccount("To", createMoney(50000));
    });

    describe("PO-15: Transfer Atomicity Preconditions", () => {
      it("PO-15 should enforce positive amount", () => {
        expect(() => {
          bank.transfer(fromId, toId, createMoney(0));
        }).toThrow();
      });

      it("PO-15 should enforce within limit", () => {
        const highId = bank.openAccount("High", createMoney(2000000));
        const id2 = bank.openAccount("Recipient", createMoney(0));
        expect(() => {
          bank.transfer(highId, id2, createMoney(1000001));
        }).toThrow();
      });

      it("PO-15 should enforce sufficient funds", () => {
        expect(() => {
          bank.transfer(fromId, toId, createMoney(100001));
        }).toThrow();
      });
    });

    describe("PO-16: Source Balance Decreased", () => {
      it("PO-16 should decrease source by transfer amount", () => {
        const before = bank.getBalance(fromId);
        bank.transfer(fromId, toId, createMoney(25000));
        const after = bank.getBalance(fromId);
        expect(after).toBe(before - 25000);
      });

      it("PO-16 should handle transfer of entire balance", () => {
        bank.transfer(fromId, toId, createMoney(100000));
        expect(bank.getBalance(fromId)).toBe(0);
      });
    });

    describe("PO-17: Destination Balance Increased", () => {
      it("PO-17 should increase destination by transfer amount", () => {
        const before = bank.getBalance(toId);
        bank.transfer(fromId, toId, createMoney(25000));
        const after = bank.getBalance(toId);
        expect(after).toBe(before + 25000);
      });

      it("PO-17 should handle zero-to-positive transition", () => {
        const id2 = bank.openAccount("ZeroBalance", createMoney(0));
        bank.transfer(fromId, id2, createMoney(50000));
        expect(bank.getBalance(id2)).toBe(50000);
      });
    });

    describe("PO-18: Money Conservation", () => {
      it("PO-18 should conserve total money in transfer", () => {
        const totalBefore =
          bank.getBalance(fromId) + bank.getBalance(toId);
        bank.transfer(fromId, toId, createMoney(30000));
        const totalAfter =
          bank.getBalance(fromId) + bank.getBalance(toId);
        expect(totalAfter).toBe(totalBefore);
      });

      it("PO-18 should conserve through multiple transfers", () => {
        const id3 = bank.openAccount("Third", createMoney(100));
        const totalInitial =
          bank.getBalance(fromId) +
          bank.getBalance(toId) +
          bank.getBalance(id3);

        bank.transfer(fromId, toId, createMoney(10000));
        bank.transfer(toId, id3, createMoney(5000));

        const totalFinal =
          bank.getBalance(fromId) +
          bank.getBalance(toId) +
          bank.getBalance(id3);

        expect(totalFinal).toBe(totalInitial);
      });
    });

    describe("PO-19: Other Accounts Unchanged", () => {
      it("PO-19 should not modify third account", () => {
        const id3 = bank.openAccount("Third", createMoney(500));
        const balanceBefore = bank.getBalance(id3);

        bank.transfer(fromId, toId, createMoney(10000));

        expect(bank.getBalance(id3)).toBe(balanceBefore);
      });

      it("PO-19 should preserve all uninvolved accounts", () => {
        const ids: AccountId[] = [];
        const initialBalances: Money[] = [];

        for (let i = 0; i < 5; i++) {
          const id = bank.openAccount(`Account${i}`, createMoney((i + 1) * 1000));
          ids.push(id);
          initialBalances.push(bank.getBalance(id));
        }

        bank.transfer(ids[0], ids[1], createMoney(100));

        for (let i = 2; i < ids.length; i++) {
          expect(bank.getBalance(ids[i])).toBe(initialBalances[i]);
        }
      });
    });

    describe("PO-20: No Negative Balances", () => {
      it("PO-20 should ensure source balance non-negative", () => {
        bank.transfer(fromId, toId, createMoney(100000));
        expect(bank.getBalance(fromId)).toBeGreaterThanOrEqual(0);
      });

      it("PO-20 should ensure both balances non-negative", () => {
        bank.transfer(fromId, toId, createMoney(50000));
        expect(bank.getBalance(fromId)).toBeGreaterThanOrEqual(0);
        expect(bank.getBalance(toId)).toBeGreaterThanOrEqual(0);
      });

      it("PO-20 should maintain through chain transfers", () => {
        const id3 = bank.openAccount("Third", createMoney(200));

        bank.transfer(fromId, toId, createMoney(30000));
        bank.transfer(toId, id3, createMoney(20000));

        expect(bank.getBalance(fromId)).toBeGreaterThanOrEqual(0);
        expect(bank.getBalance(toId)).toBeGreaterThanOrEqual(0);
        expect(bank.getBalance(id3)).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("Proof Obligation Integration Tests", () => {
    it("should satisfy all POs in complex scenario", () => {
      const id1 = bank.openAccount("Alice", createMoney(100000));
      const id2 = bank.openAccount("Bob", createMoney(50000));
      const id3 = bank.openAccount("Charlie", createMoney(200000));

      // PO tests through sequence of operations
      const total1 =
        bank.getBalance(id1) +
        bank.getBalance(id2) +
        bank.getBalance(id3);

      bank.deposit(id1, createMoney(10000)); // PO-6, PO-7
      bank.withdraw(id2, createMoney(5000)); // PO-9, PO-10, PO-12
      bank.transfer(id3, id1, createMoney(20000)); // PO-15 through PO-20

      const total2 =
        bank.getBalance(id1) +
        bank.getBalance(id2) +
        bank.getBalance(id3);

      // PO-18: Money conserved despite operations
      expect(total2).toBe(total1 + 10000 - 5000); // Net change = +10000 - 5000

      // PO-12, PO-20: No negative balances
      expect(bank.getBalance(id1)).toBeGreaterThanOrEqual(0);
      expect(bank.getBalance(id2)).toBeGreaterThanOrEqual(0);
      expect(bank.getBalance(id3)).toBeGreaterThanOrEqual(0);
    });
  });
});
