/**
 * Tests for Bank Account Management System
 */

import { BankAccount, BankAccountManager } from "./bank-account";

describe("BankAccount", () => {
  describe("Account Creation", () => {
    it("should create a new account with account holder name and initial balance", () => {
      const account = new BankAccount("太郎", 10000);
      expect(account.getAccountHolder()).toBe("太郎");
      expect(account.getBalance()).toBe(10000);
    });

    it("should throw error if account holder name is empty", () => {
      expect(() => new BankAccount("", 10000)).toThrow(
        "Account holder name cannot be empty"
      );
    });

    it("should create an account with zero initial balance", () => {
      const account = new BankAccount("花子", 0);
      expect(account.getBalance()).toBe(0);
    });
  });

  describe("Deposit", () => {
    it("should add money to the account balance", () => {
      const account = new BankAccount("太郎", 10000);
      account.deposit(5000);
      expect(account.getBalance()).toBe(15000);
    });

    it("should handle multiple deposits", () => {
      const account = new BankAccount("太郎", 10000);
      account.deposit(3000);
      account.deposit(2000);
      expect(account.getBalance()).toBe(15000);
    });

    it("should throw error for negative deposit amount", () => {
      const account = new BankAccount("太郎", 10000);
      expect(() => account.deposit(-1000)).toThrow(
        "Deposit amount must be greater than 0"
      );
    });

    it("should throw error for zero deposit amount", () => {
      const account = new BankAccount("太郎", 10000);
      expect(() => account.deposit(0)).toThrow(
        "Deposit amount must be greater than 0"
      );
    });
  });

  describe("Withdraw", () => {
    it("should subtract money from the account balance", () => {
      const account = new BankAccount("太郎", 10000);
      account.withdraw(3000);
      expect(account.getBalance()).toBe(7000);
    });

    it("should throw error if withdrawal exceeds balance", () => {
      const account = new BankAccount("太郎", 5000);
      expect(() => account.withdraw(6000)).toThrow(
        "Insufficient balance for this withdrawal"
      );
    });

    it("should throw error if withdrawal amount exceeds limit of 1,000,000", () => {
      const account = new BankAccount("太郎", 2000000);
      expect(() => account.withdraw(1000001)).toThrow(
        "Withdrawal limit exceeded: maximum 1,000,000 per transaction"
      );
    });

    it("should allow withdrawal of exactly 1,000,000", () => {
      const account = new BankAccount("太郎", 1500000);
      account.withdraw(1000000);
      expect(account.getBalance()).toBe(500000);
    });

    it("should throw error for negative withdrawal amount", () => {
      const account = new BankAccount("太郎", 10000);
      expect(() => account.withdraw(-1000)).toThrow(
        "Withdrawal amount must be greater than 0"
      );
    });

    it("should throw error for zero withdrawal amount", () => {
      const account = new BankAccount("太郎", 10000);
      expect(() => account.withdraw(0)).toThrow(
        "Withdrawal amount must be greater than 0"
      );
    });

    it("should allow withdrawal that reduces balance to zero", () => {
      const account = new BankAccount("太郎", 10000);
      account.withdraw(10000);
      expect(account.getBalance()).toBe(0);
    });
  });

  describe("Balance Inquiry", () => {
    it("should return current balance", () => {
      const account = new BankAccount("太郎", 15000);
      expect(account.getBalance()).toBe(15000);
    });

    it("should return updated balance after transactions", () => {
      const account = new BankAccount("太郎", 10000);
      account.deposit(5000);
      account.withdraw(3000);
      expect(account.getBalance()).toBe(12000);
    });
  });

  describe("Transfer", () => {
    it("should transfer money from sender to recipient", () => {
      const sender = new BankAccount("太郎", 10000);
      const recipient = new BankAccount("花子", 5000);

      sender.transferTo(recipient, 3000);

      expect(sender.getBalance()).toBe(7000);
      expect(recipient.getBalance()).toBe(8000);
    });

    it("should throw error if transfer is to the same account", () => {
      const account = new BankAccount("太郎", 10000);
      expect(() => account.transferTo(account, 1000)).toThrow(
        "Cannot transfer to the same account"
      );
    });

    it("should throw error if transfer exceeds sender balance", () => {
      const sender = new BankAccount("太郎", 5000);
      const recipient = new BankAccount("花子", 1000);

      expect(() => sender.transferTo(recipient, 6000)).toThrow(
        "Insufficient balance for this transfer"
      );
    });

    it("should throw error if transfer amount exceeds limit of 1,000,000", () => {
      const sender = new BankAccount("太郎", 2000000);
      const recipient = new BankAccount("花子", 1000);

      expect(() => sender.transferTo(recipient, 1000001)).toThrow(
        "Transfer limit exceeded: maximum 1,000,000 per transaction"
      );
    });

    it("should allow transfer of exactly 1,000,000", () => {
      const sender = new BankAccount("太郎", 1500000);
      const recipient = new BankAccount("花子", 0);

      sender.transferTo(recipient, 1000000);

      expect(sender.getBalance()).toBe(500000);
      expect(recipient.getBalance()).toBe(1000000);
    });

    it("should throw error for negative transfer amount", () => {
      const sender = new BankAccount("太郎", 10000);
      const recipient = new BankAccount("花子", 1000);

      expect(() => sender.transferTo(recipient, -1000)).toThrow(
        "Transfer amount must be greater than 0"
      );
    });

    it("should throw error for zero transfer amount", () => {
      const sender = new BankAccount("太郎", 10000);
      const recipient = new BankAccount("花子", 1000);

      expect(() => sender.transferTo(recipient, 0)).toThrow(
        "Transfer amount must be greater than 0"
      );
    });

    it("should allow transfer that reduces sender balance to zero", () => {
      const sender = new BankAccount("太郎", 5000);
      const recipient = new BankAccount("花子", 1000);

      sender.transferTo(recipient, 5000);

      expect(sender.getBalance()).toBe(0);
      expect(recipient.getBalance()).toBe(6000);
    });
  });
});

describe("BankAccountManager", () => {
  describe("Account Management", () => {
    it("should create a new account", () => {
      const manager = new BankAccountManager();
      const account = manager.createAccount("太郎", 10000);

      expect(account.getAccountHolder()).toBe("太郎");
      expect(account.getBalance()).toBe(10000);
    });

    it("should retrieve created account", () => {
      const manager = new BankAccountManager();
      manager.createAccount("太郎", 10000);

      const account = manager.getAccount("太郎");
      expect(account).toBeDefined();
      expect(account?.getBalance()).toBe(10000);
    });

    it("should return undefined for non-existent account", () => {
      const manager = new BankAccountManager();
      const account = manager.getAccount("存在しない");
      expect(account).toBeUndefined();
    });

    it("should return all accounts", () => {
      const manager = new BankAccountManager();
      manager.createAccount("太郎", 10000);
      manager.createAccount("花子", 5000);
      manager.createAccount("次郎", 15000);

      const accounts = manager.getAllAccounts();
      expect(accounts.length).toBe(3);
    });

    it("should throw error when creating account with empty name", () => {
      const manager = new BankAccountManager();
      expect(() => manager.createAccount("", 10000)).toThrow(
        "Account holder name cannot be empty"
      );
    });

    it("should create account with zero initial balance by default", () => {
      const manager = new BankAccountManager();
      const account = manager.createAccount("太郎");

      expect(account.getBalance()).toBe(0);
    });
  });

  describe("Integration", () => {
    it("should handle multiple accounts with deposits and withdrawals", () => {
      const manager = new BankAccountManager();
      const account1 = manager.createAccount("太郎", 10000);
      const account2 = manager.createAccount("花子", 5000);

      account1.deposit(3000);
      account2.withdraw(1000);
      account1.transferTo(account2, 2000);

      expect(account1.getBalance()).toBe(11000);
      expect(account2.getBalance()).toBe(6000);
    });
  });
});
