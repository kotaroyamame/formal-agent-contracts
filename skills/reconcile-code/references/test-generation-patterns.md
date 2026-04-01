# Test Generation Patterns for Reconcile-Code Skill

## Overview / 概要

This document provides reusable test generation patterns for creating comprehensive tests based on VDM-SL specifications. These patterns cover pre-conditions, post-conditions, invariants, and Finding-based regression tests.

このドキュメントは、VDM-SL仕様に基づいて包括的なテストを作成するための再利用可能なテスト生成パターンを提供します。これらのパターンは、前提条件、後提条件、不変式、および調査結果ベースの回帰テストをカバーしています。

---

## Part 1: Pre-condition Test Patterns / 第1部: 前提条件テストパターン

### Pattern PC1: Basic Pre-condition Success Test

**Template:**

```
Test Name: test_<operation>_with_valid_inputs_succeeds
Purpose: Verify operation succeeds when all pre-conditions are satisfied
Expected: No exception thrown, return value present
```

**Jest/TypeScript:**

```typescript
describe('User.createUser pre-conditions', () => {
  test('with_valid_inputs_succeeds', () => {
    const validUser = {
      email: 'user@example.com',
      name: 'John Doe',
      age: 25
    };

    const result = User.createUser(validUser);
    expect(result).toBeDefined();
    expect(result.email).toBe('user@example.com');
    expect(result.name).toBe('John Doe');
    expect(result.age).toBe(25);
  });
});
```

**Pytest/Python:**

```python
class TestUserCreatePreConditions:
    def test_with_valid_inputs_succeeds(self):
        valid_user = {
            'email': 'user@example.com',
            'name': 'John Doe',
            'age': 25
        }

        result = User.create_user(valid_user)
        assert result is not None
        assert result.email == 'user@example.com'
        assert result.name == 'John Doe'
        assert result.age == 25
```

**JP:** 基本的な前提条件成功テスト

### Pattern PC2: Individual Pre-condition Violation Tests

**Template:**

```
For each VDM-SL pre-condition C:
  Test Name: test_<operation>_violates_<condition>_throws_<ErrorType>
  Purpose: Verify specific pre-condition check works
  Expected: <ErrorType> thrown with descriptive message
```

**VDM-SL Example:**

```
createUser(email: String, name: String, age: nat)
pre: len email > 0 and len name > 0 and age >= 18
```

**Jest/TypeScript:**

```typescript
describe('User.createUser pre-condition violations', () => {
  // Condition 1: len email > 0
  test('violates_email_non_empty_throws_ValidationError', () => {
    expect(() => User.createUser({ email: '', name: 'John', age: 25 }))
      .toThrow(ValidationError);
  });

  test('violates_email_whitespace_only_throws_ValidationError', () => {
    expect(() => User.createUser({ email: '   ', name: 'John', age: 25 }))
      .toThrow(ValidationError);
  });

  test('violates_email_null_throws_ValidationError', () => {
    expect(() => User.createUser({ email: null, name: 'John', age: 25 }))
      .toThrow(ValidationError);
  });

  // Condition 2: len name > 0
  test('violates_name_non_empty_throws_ValidationError', () => {
    expect(() => User.createUser({ email: 'user@example.com', name: '', age: 25 }))
      .toThrow(ValidationError);
  });

  test('violates_name_null_throws_ValidationError', () => {
    expect(() => User.createUser({ email: 'user@example.com', name: null, age: 25 }))
      .toThrow(ValidationError);
  });

  // Condition 3: age >= 18
  test('violates_age_min_boundary_throws_RangeError', () => {
    expect(() => User.createUser({ email: 'user@example.com', name: 'John', age: 17 }))
      .toThrow(RangeError);
  });

  test('violates_age_negative_throws_RangeError', () => {
    expect(() => User.createUser({ email: 'user@example.com', name: 'John', age: -1 }))
      .toThrow(RangeError);
  });
});
```

**Pytest/Python:**

```python
class TestUserCreatePreConditionViolations:
    def test_violates_email_non_empty_throws_ValidationError(self):
        with pytest.raises(ValidationError):
            User.create_user({'email': '', 'name': 'John', 'age': 25})

    def test_violates_email_whitespace_throws_ValidationError(self):
        with pytest.raises(ValidationError):
            User.create_user({'email': '   ', 'name': 'John', 'age': 25})

    def test_violates_email_null_throws_ValidationError(self):
        with pytest.raises(ValidationError):
            User.create_user({'email': None, 'name': 'John', 'age': 25})

    def test_violates_name_non_empty_throws_ValidationError(self):
        with pytest.raises(ValidationError):
            User.create_user({'email': 'user@example.com', 'name': '', 'age': 25})

    def test_violates_name_null_throws_ValidationError(self):
        with pytest.raises(ValidationError):
            User.create_user({'email': 'user@example.com', 'name': None, 'age': 25})

    def test_violates_age_min_boundary_throws_RangeError(self):
        with pytest.raises(RangeError):
            User.create_user({'email': 'user@example.com', 'name': 'John', 'age': 17})

    def test_violates_age_negative_throws_RangeError(self):
        with pytest.raises(RangeError):
            User.create_user({'email': 'user@example.com', 'name': 'John', 'age': -1})
```

**JP:** 個別の前提条件違反テスト

### Pattern PC3: Boundary Value Tests

**Template:**

```
For each numeric pre-condition:
  Test at: min, min+1, max-1, max
  Test just outside: min-1, max+1
```

**Example (age >= 18):**

```typescript
describe('User.createUser age boundary tests', () => {
  test('age_at_boundary_17_violates', () => {
    expect(() => User.createUser({ email: 'u@e.com', name: 'J', age: 17 }))
      .toThrow(RangeError);
  });

  test('age_at_boundary_18_succeeds', () => {
    expect(() => User.createUser({ email: 'u@e.com', name: 'J', age: 18 }))
      .not.toThrow();
  });

  test('age_at_boundary_119_succeeds', () => {
    // Assuming reasonable upper bound of 119
    expect(() => User.createUser({ email: 'u@e.com', name: 'J', age: 119 }))
      .not.toThrow();
  });

  test('age_at_boundary_120_violates', () => {
    // Assuming age < 120 as implicit upper bound
    expect(() => User.createUser({ email: 'u@e.com', name: 'J', age: 120 }))
      .toThrow(RangeError);
  });
});
```

**Python:**

```python
class TestUserCreateAgeBoundary:
    def test_age_at_boundary_17_violates(self):
        with pytest.raises(RangeError):
            User.create_user({'email': 'u@e.com', 'name': 'J', 'age': 17})

    def test_age_at_boundary_18_succeeds(self):
        result = User.create_user({'email': 'u@e.com', 'name': 'J', 'age': 18})
        assert result is not None

    def test_age_at_boundary_119_succeeds(self):
        result = User.create_user({'email': 'u@e.com', 'name': 'J', 'age': 119})
        assert result is not None

    def test_age_at_boundary_120_violates(self):
        with pytest.raises(RangeError):
            User.create_user({'email': 'u@e.com', 'name': 'J', 'age': 120})
```

**JP:** 境界値テスト

### Pattern PC4: Combined Violation Tests (Optional)

**Purpose:** Test multiple violations simultaneously to verify all conditions are checked

```typescript
describe('User.createUser combined pre-condition violations', () => {
  test('multiple_conditions_violated_throws_appropriate_error', () => {
    expect(() => User.createUser({ email: '', name: '', age: 10 }))
      .toThrow(); // Should throw error (tests implementation order)
  });
});
```

**JP:** 複合違反テスト（オプション）

---

## Part 2: Post-condition Test Patterns / 第2部: 後提条件テストパターン

### Pattern C1: Return Value Structure Tests

**Template:**

```
Test Name: test_<operation>_returns_valid_<ObjectType>
Purpose: Verify return value structure matches post-condition
Expected: All required properties present, correct types
```

**VDM-SL Example:**

```
createUser(...) -> User
post: result.email = email and result.name = name and result.age = age
      and result.id <> nil
```

**Jest/TypeScript:**

```typescript
describe('User.createUser post-conditions', () => {
  test('returns_valid_User_with_all_properties', () => {
    const result = User.createUser({
      email: 'user@example.com',
      name: 'John Doe',
      age: 25
    });

    // Verify structure
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('email');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('age');

    // Verify types
    expect(typeof result.id).toBe('string');
    expect(typeof result.email).toBe('string');
    expect(typeof result.name).toBe('string');
    expect(typeof result.age).toBe('number');
  });

  test('returns_User_with_non_null_id', () => {
    const result = User.createUser({
      email: 'user@example.com',
      name: 'John Doe',
      age: 25
    });

    expect(result.id).not.toBeNull();
    expect(result.id).not.toBeUndefined();
    expect(result.id.length).toBeGreaterThan(0);
  });
});
```

**Python:**

```python
class TestUserCreatePostConditions:
    def test_returns_valid_User_with_all_properties(self):
        result = User.create_user({
            'email': 'user@example.com',
            'name': 'John Doe',
            'age': 25
        })

        # Verify structure
        assert hasattr(result, 'id')
        assert hasattr(result, 'email')
        assert hasattr(result, 'name')
        assert hasattr(result, 'age')

        # Verify types
        assert isinstance(result.id, str)
        assert isinstance(result.email, str)
        assert isinstance(result.name, str)
        assert isinstance(result.age, int)

    def test_returns_User_with_non_null_id(self):
        result = User.create_user({
            'email': 'user@example.com',
            'name': 'John Doe',
            'age': 25
        })

        assert result.id is not None
        assert len(result.id) > 0
```

**JP:** 戻り値の構造テスト

### Pattern C2: Return Value Correspondence Tests

**Template:**

```
Test Name: test_<operation>_returns_correct_<property>
Purpose: Verify return value properties match input parameters
Expected: result.<property> = input.<property>
```

**Jest/TypeScript:**

```typescript
describe('User.createUser post-condition guarantees', () => {
  test('returns_user_with_matching_email', () => {
    const input = 'user@example.com';
    const result = User.createUser({
      email: input,
      name: 'John Doe',
      age: 25
    });

    expect(result.email).toBe(input);
  });

  test('returns_user_with_matching_name', () => {
    const input = 'John Doe';
    const result = User.createUser({
      email: 'user@example.com',
      name: input,
      age: 25
    });

    expect(result.name).toBe(input);
  });

  test('returns_user_with_matching_age', () => {
    const input = 25;
    const result = User.createUser({
      email: 'user@example.com',
      name: 'John Doe',
      age: input
    });

    expect(result.age).toBe(input);
  });
});
```

**Python:**

```python
class TestUserCreatePostConditionValues:
    def test_returns_user_with_matching_email(self):
        input_email = 'user@example.com'
        result = User.create_user({
            'email': input_email,
            'name': 'John Doe',
            'age': 25
        })
        assert result.email == input_email

    def test_returns_user_with_matching_name(self):
        input_name = 'John Doe'
        result = User.create_user({
            'email': 'user@example.com',
            'name': input_name,
            'age': 25
        })
        assert result.name == input_name

    def test_returns_user_with_matching_age(self):
        input_age = 25
        result = User.create_user({
            'email': 'user@example.com',
            'name': 'John Doe',
            'age': input_age
        })
        assert result.age == input_age
```

**JP:** 戻り値対応テスト

### Pattern C3: State Mutation Tests

**Template:**

```
Test Name: test_<operation>_state_mutation_<stateName>
Purpose: Verify state changes match post-condition
Expected: State observable after operation completes
```

**VDM-SL Example:**

```
addUser(user: User) -> ()
post: user in users'  (users' is users after operation)
```

**Jest/TypeScript:**

```typescript
describe('Account.deposit post-conditions', () => {
  test('state_mutation_balance_increases', () => {
    const account = new Account(100);
    const initialBalance = account.getBalance();

    account.deposit(50);

    const newBalance = account.getBalance();
    expect(newBalance).toBe(initialBalance + 50);
  });

  test('state_mutation_persists_after_operation', () => {
    const account = new Account(100);
    account.deposit(50);

    // Balance change persists
    expect(account.getBalance()).toBe(150);

    // Multiple reads return same value
    expect(account.getBalance()).toBe(150);
  });
});

describe('UserRepository.addUser state mutations', () => {
  test('state_mutation_user_in_repository', () => {
    const repo = new UserRepository();
    const user = User.createUser({
      email: 'user@example.com',
      name: 'John',
      age: 25
    });

    repo.addUser(user);

    const found = repo.findById(user.id);
    expect(found).not.toBeNull();
    expect(found?.email).toBe(user.email);
  });

  test('state_mutation_count_increases', () => {
    const repo = new UserRepository();
    const initialCount = repo.count();

    repo.addUser(User.createUser({
      email: 'user1@example.com',
      name: 'John',
      age: 25
    }));

    expect(repo.count()).toBe(initialCount + 1);
  });
});
```

**Python:**

```python
class TestAccountDepositPostConditions:
    def test_state_mutation_balance_increases(self):
        account = Account(100)
        initial_balance = account.get_balance()

        account.deposit(50)

        new_balance = account.get_balance()
        assert new_balance == initial_balance + 50

    def test_state_mutation_persists_after_operation(self):
        account = Account(100)
        account.deposit(50)

        assert account.get_balance() == 150
        assert account.get_balance() == 150  # Persists

class TestUserRepositoryAddUser:
    def test_state_mutation_user_in_repository(self):
        repo = UserRepository()
        user = User.create_user({
            'email': 'user@example.com',
            'name': 'John',
            'age': 25
        })

        repo.add_user(user)

        found = repo.find_by_id(user.id)
        assert found is not None
        assert found.email == user.email

    def test_state_mutation_count_increases(self):
        repo = UserRepository()
        initial_count = repo.count()

        repo.add_user(User.create_user({
            'email': 'user1@example.com',
            'name': 'John',
            'age': 25
        }))

        assert repo.count() == initial_count + 1
```

**JP:** 状態変異テスト

---

## Part 3: Invariant Test Patterns / 第3部: 不変式テストパターン

### Pattern I1: Valid Construction Tests

**Template:**

```
Test Name: test_<ClassName>_valid_construction_succeeds
Purpose: Verify object can be created with valid state
Expected: Object created, all properties accessible, invariant holds
```

**VDM-SL Example:**

```
Account :: balance : rat
inv: balance >= 0
```

**Jest/TypeScript:**

```typescript
describe('Account invariant tests', () => {
  test('valid_construction_succeeds', () => {
    const account = new Account(100);

    expect(account).toBeDefined();
    expect(account.getBalance()).toBe(100);
    expect(account.getBalance()).toBeGreaterThanOrEqual(0);
  });

  test('valid_construction_with_zero_balance', () => {
    const account = new Account(0);

    expect(account.getBalance()).toBe(0);
  });
});
```

**Python:**

```python
class TestAccountInvariants:
    def test_valid_construction_succeeds(self):
        account = Account(100)

        assert account is not None
        assert account.get_balance() == 100
        assert account.get_balance() >= 0

    def test_valid_construction_with_zero_balance(self):
        account = Account(0)
        assert account.get_balance() == 0
```

**JP:** 有効な構築テスト

### Pattern I2: Invariant Violation at Construction Tests

**Template:**

```
Test Name: test_<ClassName>_violates_<InvariantName>_at_construction_fails
Purpose: Verify invalid state cannot be constructed
Expected: Constructor throws appropriate error
```

**Jest/TypeScript:**

```typescript
describe('Account invariant violation at construction', () => {
  test('violates_non_negative_balance_at_construction_throws', () => {
    expect(() => new Account(-100))
      .toThrow('Balance must be non-negative');
  });

  test('violates_null_balance_throws', () => {
    expect(() => new Account(null))
      .toThrow(TypeError);
  });
});
```

**Python:**

```python
class TestAccountInvariantViolationConstruction:
    def test_violates_non_negative_balance_at_construction_throws(self):
        with pytest.raises(ValueError):
            Account(-100)

    def test_violates_null_balance_throws(self):
        with pytest.raises(TypeError):
            Account(None)
```

**JP:** 不変式違反テスト（構築時）

### Pattern I3: Invariant Violation at Mutation Tests

**Template:**

```
Test Name: test_<ClassName>_mutation_violates_<InvariantName>_rejected
Purpose: Verify operations cannot violate invariant
Expected: Mutation rejected (error thrown or value not changed)
```

**Jest/TypeScript:**

```typescript
describe('Account invariant maintenance during mutations', () => {
  test('mutation_violates_non_negative_balance_rejected', () => {
    const account = new Account(50);

    expect(() => account.withdraw(100))
      .toThrow('Insufficient funds');

    expect(account.getBalance()).toBe(50);  // Invariant maintained
  });

  test('mutation_deposit_negative_rejected', () => {
    const account = new Account(50);

    expect(() => account.deposit(-10))
      .toThrow('Amount must be positive');

    expect(account.getBalance()).toBe(50);  // Unchanged
  });

  test('mutation_setBalance_violates_invariant_rejected', () => {
    const account = new Account(50);

    expect(() => { account.balance = -20; })
      .toThrow('Balance must be non-negative');

    expect(account.getBalance()).toBe(50);  // Unchanged
  });
});
```

**Python:**

```python
class TestAccountInvariantMutation:
    def test_mutation_violates_non_negative_balance_rejected(self):
        account = Account(50)

        with pytest.raises(ValueError):
            account.withdraw(100)

        assert account.get_balance() == 50

    def test_mutation_deposit_negative_rejected(self):
        account = Account(50)

        with pytest.raises(ValueError):
            account.deposit(-10)

        assert account.get_balance() == 50

    def test_mutation_set_balance_violates_invariant_rejected(self):
        account = Account(50)

        with pytest.raises(ValueError):
            account.balance = -20

        assert account.get_balance() == 50
```

**JP:** 不変式違反テスト（変異時）

### Pattern I4: Complex Invariant Tests (Multiple Fields)

**Template:**

```
For invariants involving multiple fields:
- Test each field individually
- Test combinations that violate invariant
- Test edge cases where multiple fields interact
```

**Example Invariant:**

```
Order :: items : set of Item
         totalPrice : rat
         discount : rat
inv: totalPrice = sum(items.price) - discount and discount >= 0
```

**Jest/TypeScript:**

```typescript
describe('Order complex invariants', () => {
  test('valid_construction_maintains_price_invariant', () => {
    const items = [{ price: 100 }, { price: 50 }];
    const order = new Order(items, 0);

    expect(order.getTotalPrice()).toBe(150);
  });

  test('violates_negative_discount_invariant_rejected', () => {
    const items = [{ price: 100 }];

    expect(() => new Order(items, -10))
      .toThrow('Discount cannot be negative');
  });

  test('violates_discount_greater_than_total_rejected', () => {
    const items = [{ price: 100 }];

    expect(() => new Order(items, 150))
      .toThrow('Discount cannot exceed total');
  });

  test('mutation_changing_items_updates_total', () => {
    const order = new Order([{ price: 100 }], 0);

    // Add item
    order.addItem({ price: 50 });

    expect(order.getTotalPrice()).toBe(150);
  });
});
```

**Python:**

```python
class TestOrderComplexInvariants:
    def test_valid_construction_maintains_price_invariant(self):
        items = [{'price': 100}, {'price': 50}]
        order = Order(items, 0)

        assert order.get_total_price() == 150

    def test_violates_negative_discount_invariant_rejected(self):
        items = [{'price': 100}]

        with pytest.raises(ValueError):
            Order(items, -10)

    def test_violates_discount_greater_than_total_rejected(self):
        items = [{'price': 100}]

        with pytest.raises(ValueError):
            Order(items, 150)

    def test_mutation_changing_items_updates_total(self):
        order = Order([{'price': 100}], 0)
        order.add_item({'price': 50})

        assert order.get_total_price() == 150
```

**JP:** 複雑な不変式テスト

---

## Part 4: Finding-Based Regression Tests / 第4部: 調査結果ベースの回帰テスト

### Pattern F1: Bug Fix Regression Tests

**Template:**

```
Finding ID: BUG-###
Spec Reference: <location in VDM-SL spec>
Description: <what was wrong>

Test Name(s): test_regression_BUG_###_<scenario>
Purpose: Prevent reintroduction of this bug
Expected: Bug fix behavior verified
```

**Example Bug Finding:**

```
Finding ID: BUG-001
Severity: High
Title: Missing email validation in createUser
Description: createUser() did not validate that email is non-empty,
             allowing empty email to be created, violating the pre-condition
Spec Reference: User :: createUser pre-condition len email > 0
Status: Fixed
```

**Jest/TypeScript Regression Tests:**

```typescript
describe('Regression Test: BUG-001 - Missing email validation', () => {
  test('regression_BUG_001_empty_email_now_rejected', () => {
    expect(() => User.createUser({
      email: '',
      name: 'John',
      age: 25
    })).toThrow(ValidationError);
  });

  test('regression_BUG_001_whitespace_email_now_rejected', () => {
    expect(() => User.createUser({
      email: '   ',
      name: 'John',
      age: 25
    })).toThrow(ValidationError);
  });

  test('regression_BUG_001_null_email_now_rejected', () => {
    expect(() => User.createUser({
      email: null,
      name: 'John',
      age: 25
    })).toThrow(ValidationError);
  });

  test('regression_BUG_001_valid_email_still_accepted', () => {
    const result = User.createUser({
      email: 'john@example.com',
      name: 'John',
      age: 25
    });
    expect(result.email).toBe('john@example.com');
  });
});
```

**Python Regression Tests:**

```python
class TestRegressionBUG001:
    def test_regression_BUG_001_empty_email_now_rejected(self):
        with pytest.raises(ValidationError):
            User.create_user({
                'email': '',
                'name': 'John',
                'age': 25
            })

    def test_regression_BUG_001_whitespace_email_now_rejected(self):
        with pytest.raises(ValidationError):
            User.create_user({
                'email': '   ',
                'name': 'John',
                'age': 25
            })

    def test_regression_BUG_001_null_email_now_rejected(self):
        with pytest.raises(ValidationError):
            User.create_user({
                'email': None,
                'name': 'John',
                'age': 25
            })

    def test_regression_BUG_001_valid_email_still_accepted(self):
        result = User.create_user({
            'email': 'john@example.com',
            'name': 'John',
            'age': 25
        })
        assert result.email == 'john@example.com'
```

**JP:** バグ修正回帰テスト

### Pattern F2: Spec Gap Fill Tests

**Template:**

```
Finding ID: SPEC-GAP-###
Spec Reference: <location in VDM-SL spec>
Description: <what was missing from code>

Test Name(s): test_spec_gap_SPEC_GAP_###_<scenario>
Purpose: Verify newly implemented feature
Expected: Feature works as specified
```

**Example Spec Gap Finding:**

```
Finding ID: SPEC-GAP-001
Severity: Medium
Title: Password validation not implemented
Description: Spec defines password validation rules but code has no validation
Spec Reference: User :: createUser post-condition, password field
Status: Implemented
```

**Jest/TypeScript Spec Gap Tests:**

```typescript
describe('Spec Gap Fill: SPEC-GAP-001 - Password validation', () => {
  test('spec_gap_SPEC_GAP_001_password_must_be_at_least_8_chars', () => {
    expect(() => User.createUser({
      email: 'john@example.com',
      name: 'John',
      age: 25,
      password: 'short'  // < 8 characters
    })).toThrow(ValidationError);
  });

  test('spec_gap_SPEC_GAP_001_password_with_8_chars_accepted', () => {
    const result = User.createUser({
      email: 'john@example.com',
      name: 'John',
      age: 25,
      password: '12345678'  // exactly 8 characters
    });
    expect(result).toBeDefined();
  });

  test('spec_gap_SPEC_GAP_001_password_must_contain_uppercase', () => {
    expect(() => User.createUser({
      email: 'john@example.com',
      name: 'John',
      age: 25,
      password: 'lowercase12'  // no uppercase
    })).toThrow(ValidationError);
  });

  test('spec_gap_SPEC_GAP_001_password_with_mixed_case_accepted', () => {
    const result = User.createUser({
      email: 'john@example.com',
      name: 'John',
      age: 25,
      password: 'Password12'  // has uppercase
    });
    expect(result).toBeDefined();
  });
});
```

**Python Spec Gap Tests:**

```python
class TestSpecGapSPEC_GAP_001:
    def test_spec_gap_SPEC_GAP_001_password_must_be_at_least_8_chars(self):
        with pytest.raises(ValidationError):
            User.create_user({
                'email': 'john@example.com',
                'name': 'John',
                'age': 25,
                'password': 'short'
            })

    def test_spec_gap_SPEC_GAP_001_password_with_8_chars_accepted(self):
        result = User.create_user({
            'email': 'john@example.com',
            'name': 'John',
            'age': 25,
            'password': '12345678'
        })
        assert result is not None

    def test_spec_gap_SPEC_GAP_001_password_must_contain_uppercase(self):
        with pytest.raises(ValidationError):
            User.create_user({
                'email': 'john@example.com',
                'name': 'John',
                'age': 25,
                'password': 'lowercase12'
            })

    def test_spec_gap_SPEC_GAP_001_password_with_mixed_case_accepted(self):
        result = User.create_user({
            'email': 'john@example.com',
            'name': 'John',
            'age': 25,
            'password': 'Password12'
        })
        assert result is not None
```

**JP:** 仕様ギャップ埋めテスト

---

## Part 5: Test Organization & Integration / 第5部: テスト組織と統合

### Framework Detection Algorithm

```
1. Check package.json or requirements.txt for test framework
2. Scan test directory for existing test files
3. Check for test config files (jest.config.js, pytest.ini, etc.)
4. Examine existing test imports/patterns
5. Default to project convention if multiple frameworks found
```

### File Organization Pattern

**TypeScript/JavaScript:**

```
src/
  User.ts
test/
  User.test.ts              (existing tests)
  User.reconciliation.test.ts  (new reconciliation tests)
    - Pre-condition tests
    - Post-condition tests
    - Invariant tests
    - Regression tests
```

**Python:**

```
src/
  user.py
test/
  test_user.py              (existing tests)
  test_user_reconciliation.py  (new reconciliation tests)
    - Pre-condition tests
    - Post-condition tests
    - Invariant tests
    - Regression tests
```

**Java:**

```
src/main/java/
  User.java
src/test/java/
  UserTest.java             (existing tests)
  UserReconciliationTest.java  (new reconciliation tests)
```

### Test Class/Suite Organization

**Jest/TypeScript Structure:**

```typescript
describe('User Pre-conditions', () => {
  // Pre-condition tests
});

describe('User Post-conditions', () => {
  // Post-condition tests
});

describe('User Invariants', () => {
  // Invariant tests
});

describe('User Regression Tests', () => {
  // Finding-based tests
});
```

**Pytest/Python Structure:**

```python
class TestUserPreConditions:
    # Pre-condition tests

class TestUserPostConditions:
    # Post-condition tests

class TestUserInvariants:
    # Invariant tests

class TestUserRegressionTests:
    # Finding-based tests
```

### Test Fixtures and Setup

**Jest/TypeScript:**

```typescript
describe('User operations', () => {
  let testUser: User;

  beforeEach(() => {
    testUser = {
      email: 'test@example.com',
      name: 'Test User',
      age: 25
    };
  });

  test('...', () => {
    // Use testUser fixture
  });
});
```

**Pytest/Python:**

```python
class TestUserOperations:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.test_user = {
            'email': 'test@example.com',
            'name': 'Test User',
            'age': 25
        }
        yield
        # Cleanup if needed

    def test_...(self):
        # Use self.test_user fixture
```

### Integration with Existing Tests

**Rules:**
1. **Preserve existing tests** — Never delete or modify existing tests
2. **Use same framework** — Match existing test framework conventions
3. **Same import paths** — Use same import style as existing tests
4. **Same assertions** — Use same assertion library as existing tests
5. **Complementary naming** — Name new tests distinctly from existing ones

**Example:**

```
Existing test file imports:
  import { expect } from '@jest/globals';

New reconciliation tests should use same:
  import { expect } from '@jest/globals';
```

### Test Documentation Pattern

```typescript
describe('User.createUser - Reconciliation Tests', () => {
  describe('Pre-conditions', () => {
    describe('email field validation (spec item: createUser.pre.1)', () => {
      test('email must be non-empty (spec: len email > 0)', () => {
        // Test implementation
      });
    });
  });
});
```

**JP:** コメント化: テスト ドキュメンテーション パターン

---

## Part 6: Test Naming Conventions / 第6部: テスト命名規則

### Naming Formula

```
test_<operation>_<scenario>_<expected_result>

Examples:
- test_createUser_with_valid_inputs_succeeds
- test_createUser_violates_email_empty_throws_ValidationError
- test_createUser_returns_user_with_matching_email
- test_Account_mutation_violates_balance_invariant_rejected
- test_regression_BUG_001_empty_email_now_rejected
- test_spec_gap_SPEC_GAP_001_password_validation_works
```

### Framework-Specific Naming

**Jest/TypeScript:** `test_` or `it_` prefix

```typescript
test('description', () => { });
it('description', () => { });
```

**Pytest/Python:** `test_` prefix required

```python
def test_description(self):
```

**Mocha:** `it()` or `test()` syntax

```javascript
it('description', () => { });
```

---

## Example: Complete Test Suite / 例: 完全なテストスイート

### VDM-SL Spec:

```
User :: email : String
        name : String
        age : nat

createUser(email: String, name: String, age: nat) -> User
pre: len email > 0 and len name > 0 and age >= 18
post: result.email = email and result.name = name and result.age = age
      and result.id <> nil

inv User :: email <> "" and len name > 0 and age >= 0
```

### Complete Jest Test Suite:

```typescript
import { User, createUser, ValidationError } from '../src/User';

describe('User - Complete Reconciliation Test Suite', () => {

  describe('Pre-conditions', () => {
    describe('email validation (createUser.pre.1: len email > 0)', () => {
      test('with_valid_inputs_succeeds', () => {
        const result = createUser('user@example.com', 'John', 25);
        expect(result).toBeDefined();
      });

      test('violates_email_empty_throws_ValidationError', () => {
        expect(() => createUser('', 'John', 25))
          .toThrow(ValidationError);
      });

      test('violates_email_whitespace_throws_ValidationError', () => {
        expect(() => createUser('   ', 'John', 25))
          .toThrow(ValidationError);
      });

      test('violates_email_null_throws_ValidationError', () => {
        expect(() => createUser(null as any, 'John', 25))
          .toThrow(ValidationError);
      });
    });

    describe('name validation (createUser.pre.2: len name > 0)', () => {
      test('violates_name_empty_throws_ValidationError', () => {
        expect(() => createUser('user@example.com', '', 25))
          .toThrow(ValidationError);
      });

      test('violates_name_null_throws_ValidationError', () => {
        expect(() => createUser('user@example.com', null as any, 25))
          .toThrow(ValidationError);
      });
    });

    describe('age validation (createUser.pre.3: age >= 18)', () => {
      test('violates_age_17_throws_RangeError', () => {
        expect(() => createUser('user@example.com', 'John', 17))
          .toThrow(RangeError);
      });

      test('violates_age_negative_throws_RangeError', () => {
        expect(() => createUser('user@example.com', 'John', -1))
          .toThrow(RangeError);
      });

      test('age_at_boundary_18_succeeds', () => {
        expect(() => createUser('user@example.com', 'John', 18))
          .not.toThrow();
      });
    });
  });

  describe('Post-conditions', () => {
    describe('return value structure', () => {
      test('returns_valid_User_with_all_properties', () => {
        const result = createUser('user@example.com', 'John', 25);
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('email');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('age');
      });

      test('returns_User_with_non_null_id', () => {
        const result = createUser('user@example.com', 'John', 25);
        expect(result.id).not.toBeNull();
        expect(result.id.length).toBeGreaterThan(0);
      });
    });

    describe('return value correspondence', () => {
      test('returns_user_with_matching_email', () => {
        const input = 'user@example.com';
        const result = createUser(input, 'John', 25);
        expect(result.email).toBe(input);
      });

      test('returns_user_with_matching_name', () => {
        const input = 'John';
        const result = createUser('user@example.com', input, 25);
        expect(result.name).toBe(input);
      });

      test('returns_user_with_matching_age', () => {
        const input = 25;
        const result = createUser('user@example.com', 'John', input);
        expect(result.age).toBe(input);
      });
    });
  });

  describe('Invariants (inv User)', () => {
    test('valid_construction_succeeds', () => {
      const result = createUser('user@example.com', 'John', 25);
      expect(result.email).not.toBe('');
      expect(result.name.length).toBeGreaterThan(0);
      expect(result.age).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Regression Tests', () => {
    describe('BUG-001: Missing email validation', () => {
      test('regression_BUG_001_empty_email_now_rejected', () => {
        expect(() => createUser('', 'John', 25))
          .toThrow(ValidationError);
      });
    });
  });
});
```

---

## End of Test Generation Patterns

