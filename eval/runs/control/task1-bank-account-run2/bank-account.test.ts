/**
 * Bank Account Management System - Test Suite
 *
 * Tests for the BankSystem class covering:
 * - Account creation
 * - Deposits and withdrawals
 * - Balance inquiries
 * - Inter-account transfers
 */

import { BankSystem } from './bank-account';

describe('BankSystem', () => {
  let bankSystem: BankSystem;

  beforeEach(() => {
    bankSystem = new BankSystem();
  });

  describe('Account Creation', () => {
    it('should create a new account with initial balance', () => {
      const accountId = bankSystem.openAccount('Taro Yamada', 100000);
      expect(accountId).toMatch(/^ACC\d{5}$/);
      expect(bankSystem.getBalance(accountId)).toBe(100000);
    });

    it('should create an account with default zero balance', () => {
      const accountId = bankSystem.openAccount('Hanako Tanaka');
      expect(bankSystem.getBalance(accountId)).toBe(0);
    });

    it('should reject account creation with empty name', () => {
      expect(() => {
        bankSystem.openAccount('', 50000);
      }).toThrow('Account holder name cannot be empty');
    });

    it('should reject account creation with negative initial balance', () => {
      expect(() => {
        bankSystem.openAccount('John Doe', -1000);
      }).toThrow('Initial balance cannot be negative');
    });

    it('should generate unique account IDs', () => {
      const id1 = bankSystem.openAccount('Account 1', 1000);
      const id2 = bankSystem.openAccount('Account 2', 2000);
      const id3 = bankSystem.openAccount('Account 3', 3000);

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should trim whitespace from holder name', () => {
      const accountId = bankSystem.openAccount('  Jane Doe  ', 5000);
      const accountInfo = bankSystem.getAccountInfo(accountId);
      expect(accountInfo.holderName).toBe('Jane Doe');
    });
  });

  describe('Deposits', () => {
    let accountId: string;

    beforeEach(() => {
      accountId = bankSystem.openAccount('Alice Johnson', 10000);
    });

    it('should deposit money into an account', () => {
      bankSystem.deposit(accountId, 5000);
      expect(bankSystem.getBalance(accountId)).toBe(15000);
    });

    it('should handle multiple deposits', () => {
      bankSystem.deposit(accountId, 3000);
      bankSystem.deposit(accountId, 2000);
      bankSystem.deposit(accountId, 1500);
      expect(bankSystem.getBalance(accountId)).toBe(16500);
    });

    it('should reject negative deposit', () => {
      expect(() => {
        bankSystem.deposit(accountId, -1000);
      }).toThrow('Deposit amount must be positive');
    });

    it('should reject zero deposit', () => {
      expect(() => {
        bankSystem.deposit(accountId, 0);
      }).toThrow('Deposit amount must be positive');
    });
  });

  describe('Withdrawals', () => {
    let accountId: string;

    beforeEach(() => {
      accountId = bankSystem.openAccount('Bob Smith', 500000);
    });

    it('should withdraw money from an account', () => {
      bankSystem.withdraw(accountId, 100000);
      expect(bankSystem.getBalance(accountId)).toBe(400000);
    });

    it('should handle multiple withdrawals', () => {
      bankSystem.withdraw(accountId, 50000);
      bankSystem.withdraw(accountId, 75000);
      expect(bankSystem.getBalance(accountId)).toBe(375000);
    });

    it('should reject withdrawal exceeding balance', () => {
      expect(() => {
        bankSystem.withdraw(accountId, 600000);
      }).toThrow('Insufficient balance');
    });

    it('should reject withdrawal exceeding limit', () => {
      expect(() => {
        bankSystem.withdraw(accountId, 1500000);
      }).toThrow('Withdrawal limit exceeded');
    });

    it('should reject negative withdrawal', () => {
      expect(() => {
        bankSystem.withdraw(accountId, -50000);
      }).toThrow('Withdrawal amount must be positive');
    });

    it('should allow maximum withdrawal limit', () => {
      const largeAccountId = bankSystem.openAccount('Rich Person', 5000000);
      bankSystem.withdraw(largeAccountId, 1000000);
      expect(bankSystem.getBalance(largeAccountId)).toBe(4000000);
    });
  });

  describe('Balance Inquiry', () => {
    it('should return correct balance', () => {
      const accountId = bankSystem.openAccount('Carol Davis', 250000);
      expect(bankSystem.getBalance(accountId)).toBe(250000);
    });

    it('should return zero balance for new account', () => {
      const accountId = bankSystem.openAccount('David Wilson');
      expect(bankSystem.getBalance(accountId)).toBe(0);
    });

    it('should reject balance inquiry for non-existent account', () => {
      expect(() => {
        bankSystem.getBalance('ACC99999');
      }).toThrow('Account not found');
    });
  });

  describe('Inter-Account Transfers', () => {
    let account1: string;
    let account2: string;

    beforeEach(() => {
      account1 = bankSystem.openAccount('Sender', 100000);
      account2 = bankSystem.openAccount('Recipient', 50000);
    });

    it('should transfer money between accounts', () => {
      bankSystem.transfer(account1, account2, 30000);
      expect(bankSystem.getBalance(account1)).toBe(70000);
      expect(bankSystem.getBalance(account2)).toBe(80000);
    });

    it('should handle multiple transfers', () => {
      bankSystem.transfer(account1, account2, 10000);
      bankSystem.transfer(account2, account1, 5000);
      bankSystem.transfer(account1, account2, 15000);

      expect(bankSystem.getBalance(account1)).toBe(80000);
      expect(bankSystem.getBalance(account2)).toBe(70000);
    });

    it('should reject transfer to same account', () => {
      expect(() => {
        bankSystem.transfer(account1, account1, 10000);
      }).toThrow('Cannot transfer to the same account');
    });

    it('should reject transfer with insufficient balance', () => {
      expect(() => {
        bankSystem.transfer(account1, account2, 150000);
      }).toThrow('Insufficient balance for transfer');
    });

    it('should reject transfer with negative amount', () => {
      expect(() => {
        bankSystem.transfer(account1, account2, -5000);
      }).toThrow('Transfer amount must be positive');
    });

    it('should reject transfer to non-existent account', () => {
      expect(() => {
        bankSystem.transfer(account1, 'ACC99999', 10000);
      }).toThrow('Account not found');
    });

    it('should reject transfer from non-existent account', () => {
      expect(() => {
        bankSystem.transfer('ACC99999', account2, 10000);
      }).toThrow('Account not found');
    });
  });

  describe('Account Information Retrieval', () => {
    it('should return complete account information', () => {
      const accountId = bankSystem.openAccount('Emily Chen', 75000);
      const accountInfo = bankSystem.getAccountInfo(accountId);

      expect(accountInfo.id).toBe(accountId);
      expect(accountInfo.holderName).toBe('Emily Chen');
      expect(accountInfo.balance).toBe(75000);
    });

    it('should list all accounts in the system', () => {
      bankSystem.openAccount('Account 1', 1000);
      bankSystem.openAccount('Account 2', 2000);
      bankSystem.openAccount('Account 3', 3000);

      const allAccounts = bankSystem.listAccounts();
      expect(allAccounts).toHaveLength(3);
      expect(allAccounts[0].balance).toBe(1000);
      expect(allAccounts[1].balance).toBe(2000);
      expect(allAccounts[2].balance).toBe(3000);
    });
  });

  describe('Integration Tests', () => {
    it('should handle a complete banking scenario', () => {
      // Create accounts
      const account1 = bankSystem.openAccount('Alice', 100000);
      const account2 = bankSystem.openAccount('Bob', 50000);
      const account3 = bankSystem.openAccount('Charlie', 0);

      // Alice deposits additional funds
      bankSystem.deposit(account1, 50000);
      expect(bankSystem.getBalance(account1)).toBe(150000);

      // Alice transfers to Bob
      bankSystem.transfer(account1, account2, 40000);
      expect(bankSystem.getBalance(account1)).toBe(110000);
      expect(bankSystem.getBalance(account2)).toBe(90000);

      // Bob withdraws
      bankSystem.withdraw(account2, 30000);
      expect(bankSystem.getBalance(account2)).toBe(60000);

      // Bob transfers to Charlie
      bankSystem.transfer(account2, account3, 25000);
      expect(bankSystem.getBalance(account2)).toBe(35000);
      expect(bankSystem.getBalance(account3)).toBe(25000);

      // Verify final state
      const allAccounts = bankSystem.listAccounts();
      expect(allAccounts).toHaveLength(3);
    });
  });
});
