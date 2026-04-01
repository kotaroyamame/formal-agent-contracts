// Comprehensive Tests for Bank Account System (Run 4)
// Tests every boundary condition and validation function

import { describe, it, expect, beforeEach } from "vitest";
import {
  BankAccountSystem,
  AccountId,
  Money,
  createAccountId,
  createMoney,
  Validators,
} from "./bank-account";

describe("BankAccountSystem - Run 4: Extensive Validation and Boundaries", () => {
  let bank: BankAccountSystem;

  beforeEach(() => {
    bank = new BankAccountSystem();
  });

  describe("Validators - Pure Validation Functions", () => {
    describe("Validators.trim", () => {
      it("should trim leading whitespace", () => {
        expect(Validators.trim("  hello")).toBe("hello");
      });

      it("should trim trailing whitespace", () => {
        expect(Validators.trim("hello  ")).toBe("hello");
      });

      it("should trim both", () => {
        expect(Validators.trim("  hello  ")).toBe("hello");
      });

      it("should handle tabs", () => {
        expect(Validators.trim("\thello\t")).toBe("hello");
      });

      it("should preserve internal spaces", () => {
        expect(Validators.trim("  hello world  ")).toBe("hello world");
      });
    });

    describe("Validators.isValidName", () => {
      it("should accept valid names without spaces", () => {
        expect(Validators.isValidName("John")).toBe(true);
        expect(Validators.isValidName("A")).toBe(true);
      });

      it("should reject empty string", () => {
        expect(Validators.isValidName("")).toBe(false);
      });

      it("should reject names with spaces", () => {
        expect(Validators.isValidName("John Doe")).toBe(false);
      });

      it("should reject names with leading space", () => {
        expect(Validators.isValidName(" John")).toBe(false);
      });

      it("should reject names with trailing space", () => {
        expect(Validators.isValidName("John ")).toBe(false);
      });
    });

    describe("Validators.isValidNameAfterTrim", () => {
      it("should accept non-empty names after trimming", () => {
        expect(Validators.isValidNameAfterTrim("John")).toBe(true);
        expect(Validators.isValidNameAfterTrim("  John  ")).toBe(true);
      });

      it("should reject empty string", () => {
        expect(Validators.isValidNameAfterTrim("")).toBe(false);
      });

      it("should reject whitespace-only", () => {
        expect(Validators.isValidNameAfterTrim("   ")).toBe(false);
        expect(Validators.isValidNameAfterTrim("\t")).toBe(false);
      });

      it("should accept names with internal spaces", () => {
        expect(Validators.isValidNameAfterTrim("  John Doe  ")).toBe(true);
      });
    });

    describe("Validators.isValidMoney", () => {
      it("should accept zero", () => {
        expect(Validators.isValidMoney(createMoney(0))).toBe(true);
      });

      it("should accept positive amounts", () => {
        expect(Validators.isValidMoney(createMoney(1))).toBe(true);
        expect(Validators.isValidMoney(createMoney(999999998))).toBe(true);
      });

      it("should reject maximum value", () => {
        expect(Validators.isValidMoney(1000000000 as Money)).toBe(false);
      });
    });

    describe("Validators.isWithdrawable", () => {
      it("should accept valid withdrawal", () => {
        expect(
          Validators.isWithdrawable(createMoney(1000), createMoney(100))
        ).toBe(true);
      });

      it("should accept withdrawal of exact balance", () => {
        expect(
          Validators.isWithdrawable(createMoney(1000), createMoney(1000))
        ).toBe(true);
      });

      it("should reject zero amount", () => {
        expect(
          Validators.isWithdrawable(createMoney(1000), createMoney(0))
        ).toBe(false);
      });

      it("should reject amount exceeding balance", () => {
        expect(
          Validators.isWithdrawable(createMoney(1000), createMoney(1001))
        ).toBe(false);
      });

      it("should reject amount exceeding limit", () => {
        expect(
          Validators.isWithdrawable(createMoney(2000000), createMoney(1000001))
        ).toBe(false);
      });

      it("should accept amount at limit boundary", () => {
        expect(
          Validators.isWithdrawable(createMoney(1000000), createMoney(1000000))
        ).toBe(true);
      });
    });

    describe("Validators.isTransferable", () => {
      it("should accept valid transfer", () => {
        expect(
          Validators.isTransferable(createMoney(10000), createMoney(5000))
        ).toBe(true);
      });

      it("should accept transfer of exact balance", () => {
        expect(
          Validators.isTransferable(createMoney(10000), createMoney(10000))
        ).toBe(true);
      });

      it("should reject zero amount", () => {
        expect(
          Validators.isTransferable(createMoney(10000), createMoney(0))
        ).toBe(false);
      });

      it("should reject amount exceeding balance", () => {
        expect(
          Validators.isTransferable(createMoney(10000), createMoney(10001))
        ).toBe(false);
      });

      it("should reject amount exceeding limit", () => {
        expect(
          Validators.isTransferable(createMoney(2000000), createMoney(1000001))
        ).toBe(false);
      });

      it("should accept amount at limit boundary", () => {
        expect(
          Validators.isTransferable(createMoney(1000000), createMoney(1000000))
        ).toBe(true);
      });
    });

    describe("Validators.canDeposit", () => {
      it("should accept valid deposit", () => {
        expect(
          Validators.canDeposit(createMoney(1000), createMoney(500))
        ).toBe(true);
      });

      it("should reject zero amount", () => {
        expect(
          Validators.canDeposit(createMoney(1000), createMoney(0))
        ).toBe(false);
      });

      it("should reject deposit that exceeds max balance", () => {
        expect(
          Validators.canDeposit(createMoney(999999998), createMoney(2))
        ).toBe(false);
      });

      it("should accept deposit at boundary", () => {
        expect(
          Validators.canDeposit(createMoney(999999998), createMoney(1))
        ).toBe(true);
      });
    });

    describe("Validators.validateTransfer", () => {
      it("should validate complete transfer scenario", () => {
        expect(
          Validators.validateTransfer(
            createMoney(100000),
            createMoney(50000),
            createMoney(25000)
          )
        ).toBe(true);
      });

      it("should reject if destination would exceed max balance", () => {
        expect(
          Validators.validateTransfer(
            createMoney(100000),
            createMoney(999999998),
            createMoney(10)
          )
        ).toBe(false);
      });

      it("should reject if source insufficient", () => {
        expect(
          Validators.validateTransfer(
            createMoney(1000),
            createMoney(50000),
            createMoney(1001)
          )
        ).toBe(false);
      });
    });
  });

  describe("OpenAccount - Complete Name Validation", () => {
    it("should accept trimmed names", () => {
      const id = bank.openAccount("  John  ", createMoney(100));
      expect(bank.getAccount(id)?.name).toBe("John");
    });

    it("should accept names with internal spaces", () => {
      const id = bank.openAccount("  John Doe  ", createMoney(100));
      expect(bank.getAccount(id)?.name).toBe("John Doe");
    });

    it("should reject empty after trim", () => {
      expect(() => {
        bank.openAccount("   ", createMoney(100));
      }).toThrow("not be empty after trimming");
    });

    it("should accept single character", () => {
      const id = bank.openAccount("X", createMoney(100));
      expect(bank.getAccount(id)?.name).toBe("X");
    });

    it("should allow zero initial balance", () => {
      const id = bank.openAccount("Zero", createMoney(0));
      expect(bank.getBalance(id)).toBe(0);
    });

    it("should reject negative initial balance", () => {
      expect(() => {
        bank.openAccount("Negative", createMoney(-1 as Money));
      }).toThrow("invalid");
    });

    it("should reject maximum balance value", () => {
      expect(() => {
        bank.openAccount("Max", createMoney(1000000000 as Money));
      }).toThrow("invalid");
    });
  });

  describe("Deposit - Boundary Testing", () => {
    let accountId: AccountId;

    beforeEach(() => {
      accountId = bank.openAccount("Test", createMoney(500000));
    });

    it("should accept deposit of 1", () => {
      bank.deposit(accountId, createMoney(1));
      expect(bank.getBalance(accountId)).toBe(500001);
    });

    it("should reject deposit of 0", () => {
      expect(() => {
        bank.deposit(accountId, createMoney(0));
      }).toThrow("invalid");
    });

    it("should deposit maximum safe amount", () => {
      const id = bank.openAccount("Max Deposit", createMoney(999999998));
      bank.deposit(id, createMoney(1));
      expect(bank.getBalance(id)).toBe(999999999);
    });

    it("should reject deposit exceeding max", () => {
      const id = bank.openAccount("Max Test", createMoney(999999998));
      expect(() => {
        bank.deposit(id, createMoney(2));
      }).toThrow("invalid");
    });
  });

  describe("Withdraw - Boundary Testing", () => {
    let accountId: AccountId;

    beforeEach(() => {
      accountId = bank.openAccount("Test", createMoney(500000));
    });

    it("should allow withdrawal of 1", () => {
      bank.withdraw(accountId, createMoney(1));
      expect(bank.getBalance(accountId)).toBe(499999);
    });

    it("should allow withdrawal to zero", () => {
      const id = bank.openAccount("To Zero", createMoney(500000));
      bank.withdraw(id, createMoney(500000));
      expect(bank.getBalance(id)).toBe(0);
    });

    it("should reject withdrawal of 0", () => {
      expect(() => {
        bank.withdraw(accountId, createMoney(0));
      }).toThrow("invalid");
    });

    it("should allow withdrawal at limit", () => {
      const id = bank.openAccount("At Limit", createMoney(1000000));
      bank.withdraw(id, createMoney(1000000));
      expect(bank.getBalance(id)).toBe(0);
    });

    it("should reject withdrawal over limit", () => {
      const id = bank.openAccount("Over Limit", createMoney(2000000));
      expect(() => {
        bank.withdraw(id, createMoney(1000001));
      }).toThrow("invalid");
    });

    it("should reject withdrawal exceeding balance", () => {
      expect(() => {
        bank.withdraw(accountId, createMoney(500001));
      }).toThrow("invalid");
    });
  });

  describe("Transfer - Complete Boundary Testing", () => {
    let fromId: AccountId;
    let toId: AccountId;

    beforeEach(() => {
      fromId = bank.openAccount("From", createMoney(100000));
      toId = bank.openAccount("To", createMoney(50000));
    });

    it("should allow transfer of 1", () => {
      bank.transfer(fromId, toId, createMoney(1));
      expect(bank.getBalance(fromId)).toBe(99999);
      expect(bank.getBalance(toId)).toBe(50001);
    });

    it("should allow transfer of exact balance", () => {
      bank.transfer(fromId, toId, createMoney(100000));
      expect(bank.getBalance(fromId)).toBe(0);
      expect(bank.getBalance(toId)).toBe(150000);
    });

    it("should reject transfer of 0", () => {
      expect(() => {
        bank.transfer(fromId, toId, createMoney(0));
      }).toThrow("invalid");
    });

    it("should reject transfer at limit boundary", () => {
      const id1 = bank.openAccount("High From", createMoney(1000000));
      const id2 = bank.openAccount("High To", createMoney(999999998));
      expect(() => {
        bank.transfer(id1, id2, createMoney(1000001));
      }).toThrow("invalid");
    });

    it("should allow transfer at limit", () => {
      const id1 = bank.openAccount("Limit From", createMoney(1000000));
      const id2 = bank.openAccount("Limit To", createMoney(0));
      bank.transfer(id1, id2, createMoney(1000000));
      expect(bank.getBalance(id1)).toBe(0);
      expect(bank.getBalance(id2)).toBe(1000000);
    });

    it("should reject transfer exceeding destination max", () => {
      const id1 = bank.openAccount("From", createMoney(100));
      const id2 = bank.openAccount("To Max", createMoney(999999998));
      expect(() => {
        bank.transfer(id1, id2, createMoney(10));
      }).toThrow("invalid");
    });

    it("should reject self-transfer", () => {
      expect(() => {
        bank.transfer(fromId, fromId, createMoney(100));
      }).toThrow("must be different");
    });

    it("should reject transfer exceeding balance", () => {
      expect(() => {
        bank.transfer(fromId, toId, createMoney(100001));
      }).toThrow("invalid");
    });
  });

  describe("State Preservation Across Operations", () => {
    it("should preserve all accounts during mixed operations", () => {
      const id1 = bank.openAccount("A", createMoney(1000));
      const id2 = bank.openAccount("B", createMoney(500));
      const id3 = bank.openAccount("C", createMoney(200));

      bank.deposit(id1, createMoney(100));
      bank.withdraw(id2, createMoney(50));
      bank.transfer(id1, id3, createMoney(100));

      expect(bank.getBalance(id1)).toBe(1000);
      expect(bank.getBalance(id2)).toBe(450);
      expect(bank.getBalance(id3)).toBe(300);
    });

    it("should maintain consistency on validation failure", () => {
      const id1 = bank.openAccount("From", createMoney(100));
      const id2 = bank.openAccount("To", createMoney(50));

      const before1 = bank.getBalance(id1);
      const before2 = bank.getBalance(id2);

      try {
        bank.transfer(id1, id2, createMoney(101));
      } catch (e) {
        // Expected
      }

      expect(bank.getBalance(id1)).toBe(before1);
      expect(bank.getBalance(id2)).toBe(before2);
    });
  });

  describe("High Volume Boundary Tests", () => {
    it("should handle 100 accounts with various operations", () => {
      const accounts: AccountId[] = [];

      for (let i = 0; i < 100; i++) {
        accounts.push(bank.openAccount(`Account${i}`, createMoney(1000)));
      }

      for (let i = 0; i < 50; i++) {
        bank.deposit(accounts[i], createMoney(100));
      }

      for (let i = 0; i < 49; i++) {
        bank.transfer(accounts[i], accounts[i + 1], createMoney(50));
      }

      // Verify all accounts are valid
      for (const id of accounts) {
        const balance = bank.getBalance(id);
        expect(Validators.isValidMoney(balance)).toBe(true);
      }
    });

    it("should handle repeated maximum operations", () => {
      const id1 = bank.openAccount("Repeated", createMoney(5000000));
      const id2 = bank.openAccount("Recipient", createMoney(0));

      // 5 transfers of maximum amount each
      for (let i = 0; i < 5; i++) {
        bank.transfer(id1, id2, createMoney(1000000));
      }

      expect(bank.getBalance(id1)).toBe(0);
      expect(bank.getBalance(id2)).toBe(5000000);
    });
  });
});
