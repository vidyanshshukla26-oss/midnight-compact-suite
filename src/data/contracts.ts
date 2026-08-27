import { SorobanContract } from '../types';

export const CONTRACT_ADDRESSES = {
  VAULT: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCVI5',
  ORACLE: 'CA76YOCDMNBGF7M5LDF2GTVKJ4Q5B7N3EWR6TXDPM3O7MKYP6G2R7YTB',
  TOKEN: 'CB6N6H2VTLGZ23Y62JTRT35V7X4YVLPK6NQP7X5MQB9X4L7MN5K6STLR',
  YIELD: 'CCF7B3X9YTR7QW2N8VM5XKP4LT7NV8MQ9WXP2TR7B8YMQ2NW9V4R7QST',
};

export const MOCK_SOROBAN_CONTRACTS: SorobanContract[] = [
  {
    id: 'vault',
    name: 'StellarVaultContract',
    address: CONTRACT_ADDRESSES.VAULT,
    version: 'v3.2.0-prod',
    description: 'Core liquidity vault featuring inter-contract cross-calls to Price Oracle & Yield Distributor with Soroban Auth v2.',
    wasmHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    ttlRemaining: 184520, // ledgers
    deployedAtLedger: 5129401,
    storageType: 'Persistent',
    crossCallsTo: [CONTRACT_ADDRESSES.ORACLE, CONTRACT_ADDRESSES.TOKEN, CONTRACT_ADDRESSES.YIELD],
    methods: [
      {
        name: 'deposit_with_oracle_check',
        description: 'Deposits assets, invokes Price Oracle cross-contract for slippage validation, and issues vault shares.',
        isMutating: true,
        requiresAuth: true,
        crossCallTarget: 'SorobanPriceOracle::get_price',
        inputs: [
          { name: 'depositor', type: 'Address', defaultValue: 'GAA...TESTNET', placeholder: 'Address of depositor' },
          { name: 'amount', type: 'i128', defaultValue: '1000000000', placeholder: 'Amount in stroops (100 XLM)' },
          { name: 'min_shares_out', type: 'i128', defaultValue: '980000000', placeholder: 'Min shares for slippage' }
        ],
        outputType: 'Result<i128, VaultError>'
      },
      {
        name: 'swap_exact_tokens_cross_call',
        description: 'Executes an atomic token swap by dispatching cross-contract calls to token contracts and slippage oracle.',
        isMutating: true,
        requiresAuth: true,
        crossCallTarget: 'StellarTokenEngine::transfer',
        inputs: [
          { name: 'sender', type: 'Address', defaultValue: 'GAA...TESTNET', placeholder: 'Sender address' },
          { name: 'amount_in', type: 'i128', defaultValue: '500000000', placeholder: 'Amount IN (50 XLM)' },
          { name: 'min_amount_out', type: 'i128', defaultValue: '24000000', placeholder: 'Min USDC out (24 USDC)' }
        ],
        outputType: 'Result<i128, VaultError>'
      },
      {
        name: 'harvest_and_reinvest',
        description: 'Cross-invokes YieldDistributor to compound accumulated returns and bumps contract storage TTL.',
        isMutating: true,
        requiresAuth: false,
        crossCallTarget: 'YieldDistributor::claim_rewards',
        inputs: [
          { name: 'caller', type: 'Address', defaultValue: 'GAA...TESTNET', placeholder: 'Keeper address' }
        ],
        outputType: 'Result<u32, VaultError>'
      },
      {
        name: 'get_vault_metrics',
        description: 'Read-only simulation query returning TVL, total shares, and current oracle exchange rate.',
        isMutating: false,
        requiresAuth: false,
        inputs: [],
        outputType: 'VaultMetrics'
      },
      {
        name: 'bump_storage_ttl',
        description: 'Extends instance & persistent storage TTL for another 100,000 ledgers using env.storage().extend_ttl.',
        isMutating: true,
        requiresAuth: false,
        inputs: [
          { name: 'threshold', type: 'u32', defaultValue: '20000', placeholder: 'Ledger threshold' },
          { name: 'extend_by', type: 'u32', defaultValue: '100000', placeholder: 'Ledgers to add' }
        ],
        outputType: '()'
      }
    ],
    codeRust: `//! # Advanced Stellar Soroban Liquidity Vault
//! Production-grade smart contract with Inter-Contract Cross-Calls (ICC),
//! Soroban Auth v2, TTL lifecycle management, and typed event emissions.

#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short,
    Address, BytesN, Env, IntoVal, String, Symbol, Vec, Val
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultError {
    AlreadyInitialized = 1,
    Unauthorized = 2,
    InsufficientBalance = 3,
    SlippageExceeded = 4,
    OraclePriceStale = 5,
    ZeroAmount = 6,
    CrossCallFailed = 7,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaultMetrics {
    pub total_staked_xlm: i128,
    pub total_shares: i128,
    pub last_oracle_price: i128,
    pub active_users: u32,
    pub last_rebalance_ledger: u32,
}

#[contracttype]
pub enum DataKey {
    Admin,
    OracleContract,
    TokenContract,
    YieldContract,
    Metrics,
    UserShares(Address),
    LedgerTTL,
}

#[contract]
pub struct StellarVaultContract;

#[contractimpl]
impl StellarVaultContract {
    /// Initialize the vault with authorized addresses for inter-contract communication.
    pub fn initialize(
        env: Env,
        admin: Address,
        oracle: Address,
        token: Address,
        yield_distributor: Address,
    ) -> Result<(), VaultError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(VaultError::AlreadyInitialized);
        }
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::OracleContract, &oracle);
        env.storage().instance().set(&DataKey::TokenContract, &token);
        env.storage().instance().set(&DataKey::YieldContract, &yield_distributor);

        let initial_metrics = VaultMetrics {
            total_staked_xlm: 0,
            total_shares: 0,
            last_oracle_price: 100_000_000, // 0.10 USD/XLM scaled
            active_users: 0,
            last_rebalance_ledger: env.ledger().sequence(),
        };
        env.storage().instance().set(&DataKey::Metrics, &initial_metrics);

        // Extend Instance TTL by 100,000 ledgers
        env.storage().instance().extend_ttl(50_000, 100_000);

        // Emit typed initialization event
        env.events().publish((symbol_short!("init"), admin), env.ledger().sequence());
        Ok(())
    }

    /// Deposits funds, performs Inter-Contract cross call to Oracle for validation,
    /// then mints LP shares to the depositor.
    pub fn deposit_with_oracle_check(
        env: Env,
        depositor: Address,
        amount: i128,
        min_shares_out: i128,
    ) -> Result<i128, VaultError> {
        if amount <= 0 {
            return Err(VaultError::ZeroAmount);
        }
        // Enforce Soroban Auth
        depositor.require_auth();

        // 1. INTER-CONTRACT COMMUNICATION: Query Price Oracle Contract
        let oracle_addr: Address = env.storage().instance().get(&DataKey::OracleContract).unwrap();
        let oracle_price: i128 = env.invoke_contract(
            &oracle_addr,
            &Symbol::new(&env, "get_latest_price"),
            soroban_sdk::vec![&env, symbol_short!("XLM_USD").into_val(&env)]
        );

        if oracle_price <= 0 {
            return Err(VaultError::OraclePriceStale);
        }

        // 2. Compute shares minted based on current pool & oracle price
        let mut metrics: VaultMetrics = env.storage().instance().get(&DataKey::Metrics).unwrap();
        let shares_minted: i128 = if metrics.total_shares == 0 {
            amount
        } else {
            (amount * metrics.total_shares) / metrics.total_staked_xlm
        };

        if shares_minted < min_shares_out {
            return Err(VaultError::SlippageExceeded);
        }

        // 3. Update User Persistent Storage with TTL extension
        let user_key = DataKey::UserShares(depositor.clone());
        let current_shares: i128 = env.storage().persistent().get(&user_key).unwrap_or(0);
        let new_shares = current_shares + shares_minted;
        env.storage().persistent().set(&user_key, &new_shares);
        env.storage().persistent().extend_ttl(&user_key, 20_000, 50_000);

        // 4. Update Vault Metrics
        if current_shares == 0 {
            metrics.active_users += 1;
        }
        metrics.total_staked_xlm += amount;
        metrics.total_shares += shares_minted;
        metrics.last_oracle_price = oracle_price;
        env.storage().instance().set(&DataKey::Metrics, &metrics);

        // 5. Emit Event for Real-Time RPC Streaming
        env.events().publish(
            (symbol_short!("deposit"), depositor.clone()),
            (amount, shares_minted, oracle_price)
        );

        Ok(shares_minted)
    }

    /// Atomic multi-hop token swap invoking cross-contract SEP-41 token transfers
    pub fn swap_exact_tokens_cross_call(
        env: Env,
        sender: Address,
        amount_in: i128,
        min_amount_out: i128,
    ) -> Result<i128, VaultError> {
        sender.require_auth();

        let token_addr: Address = env.storage().instance().get(&DataKey::TokenContract).unwrap();
        
        // Execute cross-call token transfer from sender to vault
        let transfer_args: Vec<Val> = soroban_sdk::vec![
            &env,
            sender.to_val(),
            env.current_contract_address().to_val(),
            amount_in.into_val(&env)
        ];
        env.invoke_contract::<()>(&token_addr, &Symbol::new(&env, "transfer"), transfer_args);

        // Calculate output based on AMM invariant formula: (x * y = k)
        let amount_out = (amount_in * 997 * 48) / 100000; // 0.3% fee model
        if amount_out < min_amount_out {
            return Err(VaultError::SlippageExceeded);
        }

        // Emit Swap Event
        env.events().publish(
            (symbol_short!("swap"), sender.clone()),
            (amount_in, amount_out)
        );

        Ok(amount_out)
    }

    /// Auto-compounding keeper trigger executing cross-call to YieldDistributor
    pub fn harvest_and_reinvest(env: Env, _caller: Address) -> Result<u32, VaultError> {
        let yield_addr: Address = env.storage().instance().get(&DataKey::YieldContract).unwrap();
        let claimed_rewards: i128 = env.invoke_contract(
            &yield_addr,
            &Symbol::new(&env, "claim_rewards"),
            soroban_sdk::vec![&env, env.current_contract_address().into_val(&env)]
        );

        // Reinvest rewards into total vault staked
        let mut metrics: VaultMetrics = env.storage().instance().get(&DataKey::Metrics).unwrap();
        metrics.total_staked_xlm += claimed_rewards;
        env.storage().instance().set(&DataKey::Metrics, &metrics);

        // Bump TTL
        env.storage().instance().extend_ttl(50_000, 100_000);

        env.events().publish((symbol_short!("harvest"),), claimed_rewards);
        Ok(env.ledger().sequence())
    }

    /// Returns current vault metrics
    pub fn get_vault_metrics(env: Env) -> VaultMetrics {
        env.storage().instance().get(&DataKey::Metrics).unwrap_or(VaultMetrics {
            total_staked_xlm: 0,
            total_shares: 0,
            last_oracle_price: 0,
            active_users: 0,
            last_rebalance_ledger: 0,
        })
    }
}
`
  },
  {
    id: 'oracle',
    name: 'SorobanPriceOracle',
    address: CONTRACT_ADDRESSES.ORACLE,
    version: 'v2.1.0-prod',
    description: 'Decentralized price feed contract supplying verifiable XLM/USDC & XLM/EUR rates with staleness threshold checks.',
    wasmHash: 'b78a9c8498fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b123',
    ttlRemaining: 215300,
    deployedAtLedger: 5129300,
    storageType: 'Persistent',
    methods: [
      {
        name: 'get_latest_price',
        description: 'Returns price in 8-decimal fixed-point precision with ledger timestamp verification.',
        isMutating: false,
        requiresAuth: false,
        inputs: [{ name: 'asset_pair', type: 'Symbol', defaultValue: 'XLM_USD', placeholder: 'e.g. XLM_USD' }],
        outputType: 'i128'
      },
      {
        name: 'update_price_feed',
        description: 'Admin/Relayer method to push signed oracle feed updates.',
        isMutating: true,
        requiresAuth: true,
        inputs: [
          { name: 'asset_pair', type: 'Symbol', defaultValue: 'XLM_USD' },
          { name: 'price', type: 'i128', defaultValue: '104500000', placeholder: '104500000 ($0.1045)' }
        ],
        outputType: '()'
      }
    ],
    codeRust: `//! # Soroban Decentralized Price Oracle Contract
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[contracttype]
pub struct PriceRecord {
    pub price: i128,
    pub updated_at_ledger: u32,
}

#[contract]
pub struct SorobanPriceOracle;

#[contractimpl]
impl SorobanPriceOracle {
    pub fn get_latest_price(env: Env, pair: Symbol) -> i128 {
        let record: PriceRecord = env.storage().instance().get(&pair).unwrap_or(PriceRecord {
            price: 105_000_000, // 0.10500000 USD/XLM
            updated_at_ledger: env.ledger().sequence(),
        });
        record.price
    }

    pub fn update_price_feed(env: Env, admin: Address, pair: Symbol, price: i128) {
        admin.require_auth();
        let record = PriceRecord {
            price,
            updated_at_ledger: env.ledger().sequence(),
        };
        env.storage().instance().set(&pair, &record);
        env.storage().instance().extend_ttl(50_000, 100_000);
        env.events().publish((symbol_short!("oracle"), pair), price);
    }
}
`
  },
  {
    id: 'token',
    name: 'StellarTokenEngine',
    address: CONTRACT_ADDRESSES.TOKEN,
    version: 'v1.4.0-sep41',
    description: 'Full SEP-41 compliant fungible token smart contract with transfer, approve, and Soroban Auth hooks.',
    wasmHash: 'a1b2c3d498fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b777',
    ttlRemaining: 198200,
    deployedAtLedger: 5129200,
    storageType: 'Persistent',
    methods: [
      {
        name: 'balance',
        description: 'Returns the token balance of an address.',
        isMutating: false,
        requiresAuth: false,
        inputs: [{ name: 'id', type: 'Address', defaultValue: 'GAA...TESTNET' }],
        outputType: 'i128'
      },
      {
        name: 'transfer',
        description: 'Transfers token amount from sender to recipient with sender auth.',
        isMutating: true,
        requiresAuth: true,
        inputs: [
          { name: 'from', type: 'Address' },
          { name: 'to', type: 'Address' },
          { name: 'amount', type: 'i128', defaultValue: '100000000' }
        ],
        outputType: '()'
      }
    ],
    codeRust: `//! # SEP-41 Soroban Token Contract
#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, String, symbol_short};

#[contract]
pub struct StellarTokenEngine;

#[contractimpl]
impl StellarTokenEngine {
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        let balance_from: i128 = env.storage().persistent().get(&from).unwrap_or(0);
        assert!(balance_from >= amount, "insufficient balance");
        
        let balance_to: i128 = env.storage().persistent().get(&to).unwrap_or(0);
        env.storage().persistent().set(&from, &(balance_from - amount));
        env.storage().persistent().set(&to, &(balance_to + amount));

        env.events().publish((symbol_short!("transfer"), from, to), amount);
    }
}
`
  },
  {
    id: 'yield',
    name: 'YieldDistributor',
    address: CONTRACT_ADDRESSES.YIELD,
    version: 'v2.0.0-prod',
    description: 'Dynamic yield emission protocol with stake time-weighted multipliers and automated LP reward streaming.',
    wasmHash: 'f4e3d2c198fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852ba88',
    ttlRemaining: 172900,
    deployedAtLedger: 5129350,
    storageType: 'Persistent',
    methods: [
      {
        name: 'claim_rewards',
        description: 'Computes pending rewards for the vault and emits reward claim event.',
        isMutating: true,
        requiresAuth: false,
        inputs: [{ name: 'vault_address', type: 'Address' }],
        outputType: 'i128'
      }
    ],
    codeRust: `//! # Yield Distributor Contract
#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, symbol_short};

#[contract]
pub struct YieldDistributor;

#[contractimpl]
impl YieldDistributor {
    pub fn claim_rewards(env: Env, vault: Address) -> i128 {
        let reward_amount: i128 = 25_000_000; // 2.5 XLM emissions per rebalance cycle
        env.events().publish((symbol_short!("yield"), vault), reward_amount);
        reward_amount
    }
}
`
  }
];
