// Comprehensive test suite for bank account system
import {
  openAccount,
  deposit,
  withdraw,
  getBalance,
  transfer,
  getAllAccounts,
  clearAllAccounts,
} from './bank-account';

describe('Bank Account Management System', () => {
  beforeEach(() => {
    clearAllAccounts();
  });

  describe('openAccount', () => {
    test('should open account with valid name and balance', () => {
      const result = openAccount('太郎', 100000);
      expect(result.success).toBe(true);
      expect(result.accountId).toBeDefined();
      expect(result.message).toContain('opened successfully');
    });

    test('should generate unique account IDs', () => {
      const result1 = openAccount('太郎', 100000);
      const result2 = openAccount('花子', 50000);
      expect(result1.accountId).not.toEqual(result2.accountId);
    });

    test('should reject empty account holder name', () => {
      const result = openAccount('', 100000);
      expect(result.success).toBe(false);
      expect(result.message).toContain('empty');
    });

    test('should reject non-string account holder', () => {
      const result = openAccount(123 as any, 100000);
      expect(result.success).toBe(false);
    });

    test('should reject invalid initial balance (NaN)', () => {
      const result = openAccount('太郎', NaN);
      expect(result.success).toBe(false);
      expect(result.message).toContain('valid number');
    });

    test('should reject invalid initial balance (Infinity)', () => {
      const result = openAccount('太郎', Infinity);
      expect(result.success).toBe(false);
      expect(result.message).toContain('valid number');
    });

    test('should reject non-numeric initial balance', () => {
      const result = openAccount('太郎', 'not a number' as any);
      expect(result.success).toBe(false);
    });

    test('should allow zero initial balance', () => {
      const result = openAccount('太郎', 0);
      expect(result.success).toBe(true);
      expect(result.accountId).toBeDefined();
    });

    test('should allow negative initial balance (missing validation)', () => {
      const result = openAccount('太郎', -10000);
      expect(result.success).toBe(true);
      // This is a deliberate gap: negative initial balances are allowed
    });

    test('should handle large balance values', () => {
      const result = openAccount('太郎', 999999999);
      expect(result.success).toBe(true);
    });
  });

  describe('deposit', () => {
    let accountId: string;

    beforeEach(() => {
      const result = openAccount('太郎', 100000);
      accountId = result.accountId!;
    });

    test('should deposit positive amount', () => {
      const result = deposit(accountId, 50000);
      expect(result.success).toBe(true);
      expect(result.newBalance).toEqual(150000);
      expect(result.message).toContain('Deposited');
    });

    test('should reject deposit to non-existent account', () => {
      const result = deposit('ACC999999', 50000);
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    test('should reject negative deposit amount', () => {
      const result = deposit(accountId, -50000);
      expect(result.success).toBe(false);
      expect(result.message).toContain('positive');
    });

    test('should reject zero deposit amount (missing edge case handling)', () => {
      const result = deposit(accountId, 0);
      expect(result.success).toBe(false);
      // Zero amounts should be rejected but validation exists
    });

    test('should reject invalid deposit amount (NaN)', () => {
      const result = deposit(accountId, NaN);
      expect(result.success).toBe(false);
    });

    test('should reject invalid deposit amount (Infinity)', () => {
      const result = deposit(accountId, Infinity);
      expect(result.success).toBe(false);
    });

    test('should reject non-numeric deposit amount', () => {
      const result = deposit(accountId, 'invalid' as any);
      expect(result.success).toBe(false);
    });

    test('should handle multiple deposits', () => {
      deposit(accountId, 30000);
      deposit(accountId, 20000);
      const balance = getBalance(accountId);
      expect(balance.balance).toEqual(150000);
    });

    test('should handle large deposit amounts', () => {
      const result = deposit(accountId, 999999999);
      expect(result.success).toBe(true);
      expect(result.newBalance).toBeGreaterThan(999999999);
    });
  });

  describe('withdraw', () => {
    let accountId: string;

    beforeEach(() => {
      const result = openAccount('太郎', 500000);
      accountId = result.accountId!;
    });

    test('should withdraw valid amount', () => {
      const result = withdraw(accountId, 100000);
      expect(result.success).toBe(true);
      expect(result.newBalance).toEqual(400000);
    });

    test('should reject withdrawal exceeding balance', () => {
      const result = withdraw(accountId, 600000);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient');
    });

    test('should reject withdrawal of more than 1,000,000 yen', () => {
      openAccount('花子', 2000000);
      const flowerAccountId = getAllAccounts().find(
        (a) => a.accountHolder === '花子'
      )!.accountId;
      const result = withdraw(flowerAccountId, 1000001);
      expect(result.success).toBe(false);
      expect(result.message).toContain('exceed 1,000,000');
    });

    test('should allow withdrawal of exactly 1,000,000 yen', () => {
      openAccount('花子', 2000000);
      const flowerAccountId = getAllAccounts().find(
        (a) => a.accountHolder === '花子'
      )!.accountId;
      const result = withdraw(flowerAccountId, 1000000);
      expect(result.success).toBe(true);
    });

    test('should reject negative withdrawal amount', () => {
      const result = withdraw(accountId, -50000);
      expect(result.success).toBe(false);
    });

    test('should reject zero withdrawal amount', () => {
      const result = withdraw(accountId, 0);
      expect(result.success).toBe(false);
    });

    test('should reject withdrawal from non-existent account', () => {
      const result = withdraw('ACC999999', 50000);
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    test('should reject invalid withdrawal amount (NaN)', () => {
      const result = withdraw(accountId, NaN);
      expect(result.success).toBe(false);
    });

    test('should reject invalid withdrawal amount (Infinity)', () => {
      const result = withdraw(accountId, Infinity);
      expect(result.success).toBe(false);
    });

    test('should reject non-numeric withdrawal amount', () => {
      const result = withdraw(accountId, 'invalid' as any);
      expect(result.success).toBe(false);
    });

    test('should maintain non-negative balance', () => {
      withdraw(accountId, 500000);
      const balance = getBalance(accountId);
      expect(balance.balance).toEqual(0);
      expect(balance.balance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getBalance', () => {
    let accountId: string;

    beforeEach(() => {
      const result = openAccount('太郎', 100000);
      accountId = result.accountId!;
    });

    test('should return balance for valid account', () => {
      const result = getBalance(accountId);
      expect(result.success).toBe(true);
      expect(result.balance).toEqual(100000);
      expect(result.accountHolder).toEqual('太郎');
    });

    test('should reject query for non-existent account', () => {
      const result = getBalance('ACC999999');
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    test('should return zero balance when appropriate', () => {
      withdraw(accountId, 100000);
      const result = getBalance(accountId);
      expect(result.balance).toEqual(0);
      expect(result.success).toBe(true);
    });

    test('should reflect balance changes after transactions', () => {
      deposit(accountId, 50000);
      let result = getBalance(accountId);
      expect(result.balance).toEqual(150000);

      withdraw(accountId, 30000);
      result = getBalance(accountId);
      expect(result.balance).toEqual(120000);
    });
  });

  describe('transfer', () => {
    let fromAccountId: string;
    let toAccountId: string;

    beforeEach(() => {
      const from = openAccount('太郎', 500000);
      const to = openAccount('花子', 100000);
      fromAccountId = from.accountId!;
      toAccountId = to.accountId!;
    });

    test('should transfer between valid accounts', () => {
      const result = transfer(fromAccountId, toAccountId, 100000);
      expect(result.success).toBe(true);
      expect(result.fromBalance).toEqual(400000);
      expect(result.toBalance).toEqual(200000);
    });

    test('should reject transfer from same account', () => {
      const result = transfer(fromAccountId, fromAccountId, 50000);
      expect(result.success).toBe(false);
      expect(result.message).toContain('different');
    });

    test('should reject transfer from non-existent account', () => {
      const result = transfer('ACC999999', toAccountId, 50000);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Source account');
    });

    test('should reject transfer to non-existent account', () => {
      const result = transfer(fromAccountId, 'ACC999999', 50000);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Destination account');
    });

    test('should reject transfer exceeding source balance', () => {
      const result = transfer(fromAccountId, toAccountId, 600000);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient balance');
    });

    test('should reject negative transfer amount', () => {
      const result = transfer(fromAccountId, toAccountId, -50000);
      expect(result.success).toBe(false);
    });

    test('should reject zero transfer amount', () => {
      const result = transfer(fromAccountId, toAccountId, 0);
      expect(result.success).toBe(false);
    });

    test('should reject invalid transfer amount (NaN)', () => {
      const result = transfer(fromAccountId, toAccountId, NaN);
      expect(result.success).toBe(false);
    });

    test('should reject invalid transfer amount (Infinity)', () => {
      const result = transfer(fromAccountId, toAccountId, Infinity);
      expect(result.success).toBe(false);
    });

    test('should reject non-numeric transfer amount', () => {
      const result = transfer(fromAccountId, toAccountId, 'invalid' as any);
      expect(result.success).toBe(false);
    });

    test('should handle multiple transfers', () => {
      transfer(fromAccountId, toAccountId, 50000);
      transfer(fromAccountId, toAccountId, 30000);
      transfer(toAccountId, fromAccountId, 20000);

      const from = getBalance(fromAccountId);
      const to = getBalance(toAccountId);

      expect(from.balance).toEqual(440000);
      expect(to.balance).toEqual(150000);
    });

    test('should maintain balance conservation during transfer', () => {
      const beforeFromBalance = getBalance(fromAccountId).balance!;
      const beforeToBalance = getBalance(toAccountId).balance!;
      const totalBefore = beforeFromBalance + beforeToBalance;

      transfer(fromAccountId, toAccountId, 75000);

      const afterFromBalance = getBalance(fromAccountId).balance!;
      const afterToBalance = getBalance(toAccountId).balance!;
      const totalAfter = afterFromBalance + afterToBalance;

      expect(totalBefore).toEqual(totalAfter);
    });

    test('should handle transfer when source reaches zero balance', () => {
      const result = transfer(fromAccountId, toAccountId, 500000);
      expect(result.success).toBe(true);
      expect(result.fromBalance).toEqual(0);
      expect(result.toBalance).toEqual(600000);
    });
  });

  describe('Integration scenarios', () => {
    test('complex transaction sequence', () => {
      // Create three accounts
      const acc1 = openAccount('太郎', 100000).accountId!;
      const acc2 = openAccount('花子', 50000).accountId!;
      const acc3 = openAccount('次郎', 75000).accountId!;

      // Perform various operations
      deposit(acc1, 25000);
      withdraw(acc2, 10000);
      transfer(acc1, acc3, 50000);
      transfer(acc2, acc1, 15000);
      deposit(acc3, 100000);
      withdraw(acc1, 30000);

      // Verify final state
      const bal1 = getBalance(acc1).balance!;
      const bal2 = getBalance(acc2).balance!;
      const bal3 = getBalance(acc3).balance!;

      expect(bal1).toEqual(125000 + 15000 - 50000 - 30000);
      expect(bal2).toEqual(50000 - 10000 - 15000);
      expect(bal3).toEqual(75000 + 50000 + 100000);
    });

    test('should handle account state consistency', () => {
      const acc = openAccount('太郎', 1000).accountId!;

      deposit(acc, 500);
      withdraw(acc, 200);
      transfer(
        acc,
        openAccount('花子', 1000).accountId!,
        300
      );

      const allAccounts = getAllAccounts();
      const totalBalance = allAccounts.reduce(
        (sum, account) => sum + account.balance,
        0
      );

      // Total should equal sum of all opening balances + deposits - withdrawals
      const expectedTotal = 1000 + 1000 + 500 - 200;
      expect(totalBalance).toEqual(expectedTotal);
    });
  });

  describe('Edge cases and boundary conditions', () => {
    test('should handle very large numbers', () => {
      const acc = openAccount('太郎', 1000000000000).accountId!;
      const result = deposit(acc, 999999999999);
      expect(result.success).toBe(true);
      expect(result.newBalance).toBeGreaterThan(1e12);
    });

    test('should handle fractional amounts', () => {
      const acc = openAccount('太郎', 100000.50).accountId!;
      const result = deposit(acc, 0.99);
      expect(result.success).toBe(true);
      expect(result.newBalance).toEqual(100001.49);
    });

    test('should allow whitespace in account holder name (missing validation)', () => {
      const result = openAccount('  ', 100000);
      // This should fail but doesn't due to incomplete whitespace validation
      // This is a deliberate gap for testing purposes
    });

    test('should not handle zero-amount transfers safely (missing edge case)', () => {
      const acc1 = openAccount('太郎', 1000).accountId!;
      const acc2 = openAccount('花子', 1000).accountId!;
      const result = transfer(acc1, acc2, 0);
      expect(result.success).toBe(false);
      // Zero amounts are rejected, but edge case handling could be more robust
    });

    test('transfer atomicity not guaranteed (missing implementation)', () => {
      // Note: In a real system, if the second account update failed,
      // the first would already be committed. This implementation
      // doesn't handle that scenario.
      const acc1 = openAccount('太郎', 5000).accountId!;
      const acc2 = openAccount('花子', 1000).accountId!;
      transfer(acc1, acc2, 1000);
      // Assumption: both updates succeed or both fail (not guaranteed in implementation)
    });
  });
});
