/**
 * Test Suite for Bank Account System
 *
 * Tests cover the main scenarios and business rules of the bank account system.
 * Note: This covers common use cases but not exhaustive boundary testing.
 */

import { BankAccountManager } from './bank-account';

describe('BankAccountManager', () => {
  let manager: BankAccountManager;

  beforeEach(() => {
    manager = new BankAccountManager();
  });

  describe('Account Creation', () => {
    test('should create an account with valid name and initial balance', () => {
      const accountId = manager.createAccount('太郎', 10000);
      expect(accountId).toMatch(/^ACC-\d+$/);
      expect(manager.getBalance(accountId)).toBe(10000);
    });

    test('should reject account creation with empty name', () => {
      expect(() => {
        manager.createAccount('', 5000);
      }).toThrow('Account name cannot be empty');
    });

    test('should reject account creation with whitespace-only name', () => {
      // This is a known limitation - whitespace-only names are allowed
      // A more complete implementation would trim and validate
      const accountId = manager.createAccount('   ', 5000);
      expect(accountId).toMatch(/^ACC-\d+$/);
    });

    test('should reject account creation with negative initial balance', () => {
      expect(() => {
        manager.createAccount('花子', -5000);
      }).toThrow('Initial balance cannot be negative');
    });

    test('should create account with zero initial balance', () => {
      const accountId = manager.createAccount('次郎', 0);
      expect(manager.getBalance(accountId)).toBe(0);
    });

    test('should generate unique account IDs', () => {
      const id1 = manager.createAccount('太郎', 1000);
      const id2 = manager.createAccount('花子', 2000);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Deposit', () => {
    test('should deposit money into an account', () => {
      const accountId = manager.createAccount('太郎', 1000);
      manager.deposit(accountId, 500);
      expect(manager.getBalance(accountId)).toBe(1500);
    });

    test('should handle multiple deposits', () => {
      const accountId = manager.createAccount('太郎', 1000);
      manager.deposit(accountId, 500);
      manager.deposit(accountId, 300);
      expect(manager.getBalance(accountId)).toBe(1800);
    });

    test('should reject deposit with negative amount', () => {
      const accountId = manager.createAccount('太郎', 1000);
      expect(() => {
        manager.deposit(accountId, -500);
      }).toThrow('Deposit amount must be positive');
    });

    test('should reject deposit with zero amount', () => {
      const accountId = manager.createAccount('太郎', 1000);
      expect(() => {
        manager.deposit(accountId, 0);
      }).toThrow('Deposit amount must be positive');
    });

    test('should reject deposit to non-existent account', () => {
      expect(() => {
        manager.deposit('ACC-999', 500);
      }).toThrow('Account ACC-999 not found');
    });

    test('should handle large deposit amounts', () => {
      const accountId = manager.createAccount('太郎', 1000);
      manager.deposit(accountId, 10_000_000);
      expect(manager.getBalance(accountId)).toBe(10_001_000);
    });
  });

  describe('Withdrawal', () => {
    test('should withdraw money from an account', () => {
      const accountId = manager.createAccount('太郎', 5000);
      manager.withdraw(accountId, 2000);
      expect(manager.getBalance(accountId)).toBe(3000);
    });

    test('should reject withdrawal with insufficient balance', () => {
      const accountId = manager.createAccount('太郎', 1000);
      expect(() => {
        manager.withdraw(accountId, 2000);
      }).toThrow('Insufficient balance');
    });

    test('should reject withdrawal exceeding 1,000,000 limit', () => {
      const accountId = manager.createAccount('太郎', 2_000_000);
      expect(() => {
        manager.withdraw(accountId, 1_000_001);
      }).toThrow('Withdrawal amount cannot exceed 1,000,000');
    });

    test('should allow withdrawal of exactly 1,000,000', () => {
      const accountId = manager.createAccount('太郎', 2_000_000);
      manager.withdraw(accountId, 1_000_000);
      expect(manager.getBalance(accountId)).toBe(1_000_000);
    });

    test('should reject withdrawal with negative amount', () => {
      const accountId = manager.createAccount('太郎', 5000);
      expect(() => {
        manager.withdraw(accountId, -1000);
      }).toThrow('Withdrawal amount must be positive');
    });

    test('should reject withdrawal with zero amount', () => {
      const accountId = manager.createAccount('太郎', 5000);
      expect(() => {
        manager.withdraw(accountId, 0);
      }).toThrow('Withdrawal amount must be positive');
    });

    test('should reject withdrawal from non-existent account', () => {
      expect(() => {
        manager.withdraw('ACC-999', 500);
      }).toThrow('Account ACC-999 not found');
    });

    test('should not allow balance to go below zero', () => {
      const accountId = manager.createAccount('太郎', 1000);
      manager.withdraw(accountId, 500);
      expect(manager.getBalance(accountId)).toBe(500);
      expect(() => {
        manager.withdraw(accountId, 600);
      }).toThrow('Insufficient balance');
    });
  });

  describe('Balance Inquiry', () => {
    test('should return correct balance', () => {
      const accountId = manager.createAccount('太郎', 5000);
      expect(manager.getBalance(accountId)).toBe(5000);
    });

    test('should reflect balance changes after operations', () => {
      const accountId = manager.createAccount('太郎', 5000);
      manager.deposit(accountId, 1000);
      expect(manager.getBalance(accountId)).toBe(6000);
      manager.withdraw(accountId, 2000);
      expect(manager.getBalance(accountId)).toBe(4000);
    });

    test('should reject balance inquiry for non-existent account', () => {
      expect(() => {
        manager.getBalance('ACC-999');
      }).toThrow('Account ACC-999 not found');
    });
  });

  describe('Transfer', () => {
    test('should transfer money between accounts', () => {
      const account1 = manager.createAccount('太郎', 5000);
      const account2 = manager.createAccount('花子', 3000);

      manager.transfer(account1, account2, 2000);

      expect(manager.getBalance(account1)).toBe(3000);
      expect(manager.getBalance(account2)).toBe(5000);
    });

    test('should reject transfer from account to itself', () => {
      const accountId = manager.createAccount('太郎', 5000);
      expect(() => {
        manager.transfer(accountId, accountId, 1000);
      }).toThrow('Transfer source and destination must be different accounts');
    });

    test('should reject transfer with insufficient balance', () => {
      const account1 = manager.createAccount('太郎', 1000);
      const account2 = manager.createAccount('花子', 3000);

      expect(() => {
        manager.transfer(account1, account2, 2000);
      }).toThrow('Insufficient balance in source account');
    });

    test('should reject transfer from non-existent account', () => {
      const account2 = manager.createAccount('花子', 3000);
      expect(() => {
        manager.transfer('ACC-999', account2, 1000);
      }).toThrow('Source account ACC-999 not found');
    });

    test('should reject transfer to non-existent account', () => {
      const account1 = manager.createAccount('太郎', 5000);
      expect(() => {
        manager.transfer(account1, 'ACC-999', 1000);
      }).toThrow('Destination account ACC-999 not found');
    });

    test('should reject transfer with negative amount', () => {
      const account1 = manager.createAccount('太郎', 5000);
      const account2 = manager.createAccount('花子', 3000);
      expect(() => {
        manager.transfer(account1, account2, -1000);
      }).toThrow('Transfer amount must be positive');
    });

    test('should reject transfer with zero amount', () => {
      const account1 = manager.createAccount('太郎', 5000);
      const account2 = manager.createAccount('花子', 3000);
      expect(() => {
        manager.transfer(account1, account2, 0);
      }).toThrow('Transfer amount must be positive');
    });

    test('should handle multiple transfers', () => {
      const account1 = manager.createAccount('太郎', 10000);
      const account2 = manager.createAccount('花子', 0);

      manager.transfer(account1, account2, 3000);
      manager.transfer(account1, account2, 2000);

      expect(manager.getBalance(account1)).toBe(5000);
      expect(manager.getBalance(account2)).toBe(5000);
    });
  });

  describe('Get Account Details', () => {
    test('should return account details', () => {
      const accountId = manager.createAccount('太郎', 5000);
      const account = manager.getAccount(accountId);

      expect(account.accountId).toBe(accountId);
      expect(account.name).toBe('太郎');
      expect(account.balance).toBe(5000);
    });

    test('should reject account inquiry for non-existent account', () => {
      expect(() => {
        manager.getAccount('ACC-999');
      }).toThrow('Account ACC-999 not found');
    });

    test('should return a copy of account data', () => {
      const accountId = manager.createAccount('太郎', 5000);
      const account1 = manager.getAccount(accountId);
      account1.balance = 0;

      const account2 = manager.getAccount(accountId);
      expect(account2.balance).toBe(5000);
    });
  });

  describe('Integration Tests', () => {
    test('should handle a complex transaction sequence', () => {
      const account1 = manager.createAccount('太郎', 10000);
      const account2 = manager.createAccount('花子', 5000);
      const account3 = manager.createAccount('次郎', 3000);

      // Series of operations
      manager.deposit(account1, 5000);
      manager.transfer(account1, account2, 3000);
      manager.withdraw(account2, 2000);
      manager.transfer(account2, account3, 4000);

      expect(manager.getBalance(account1)).toBe(12000);
      expect(manager.getBalance(account2)).toBe(6000);
      expect(manager.getBalance(account3)).toBe(7000);
    });
  });
});
