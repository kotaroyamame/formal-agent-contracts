import { BankAccount, BankSystem } from "./bank-account";

describe("BankAccount", () => {
  let system: BankSystem;

  beforeEach(() => {
    system = new BankSystem();
  });

  test("should create an account with initial balance", () => {
    const account = system.openAccount("acc001", "山田太郎", 100000);
    expect(account.getBalance()).toBe(100000);
    expect(account.getHolderName()).toBe("山田太郎");
  });

  test("should reject empty account holder name", () => {
    expect(() => {
      system.openAccount("acc002", "", 50000);
    }).toThrow("Account holder name cannot be empty");
  });

  test("should deposit money correctly", () => {
    const account = system.openAccount("acc003", "佐藤花子", 100000);
    account.deposit(50000);
    expect(account.getBalance()).toBe(150000);
  });

  test("should withdraw money when balance is sufficient", () => {
    const account = system.openAccount("acc004", "鈴木一郎", 200000);
    account.withdraw(50000);
    expect(account.getBalance()).toBe(150000);
  });

  test("should reject withdrawal exceeding limit of 1,000,000 yen", () => {
    const account = system.openAccount("acc005", "高橋美咲", 2000000);
    expect(() => {
      account.withdraw(1500000);
    }).toThrow("Withdrawal amount exceeds maximum limit of 1,000,000 yen");
  });

  test("should reject withdrawal when balance is insufficient", () => {
    const account = system.openAccount("acc006", "田中次郎", 50000);
    expect(() => {
      account.withdraw(100000);
    }).toThrow("Insufficient balance");
  });

  test("should transfer money between different accounts", () => {
    const account1 = system.openAccount("acc007", "渡辺三郎", 100000);
    const account2 = system.openAccount("acc008", "中村四郎", 50000);

    account1.transfer(account2, 30000);

    expect(account1.getBalance()).toBe(70000);
    expect(account2.getBalance()).toBe(80000);
  });

  test("should reject transfer to the same account", () => {
    const account = system.openAccount("acc009", "小林五郎", 100000);
    expect(() => {
      account.transfer(account, 50000);
    }).toThrow("Transfer source and destination must be different");
  });

  test("should reject transfer with insufficient balance", () => {
    const account1 = system.openAccount("acc010", "加藤六郎", 30000);
    const account2 = system.openAccount("acc011", "松本七郎", 50000);

    expect(() => {
      account1.transfer(account2, 50000);
    }).toThrow("Insufficient balance");
  });

  test("should return correct balance inquiry", () => {
    const account = system.openAccount("acc012", "岡田八郎", 250000);
    expect(account.getBalance()).toBe(250000);
  });
});
