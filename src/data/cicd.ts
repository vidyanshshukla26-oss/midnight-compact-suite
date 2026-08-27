import { CiCdStage } from '../types';

export const GITHUB_WORKFLOW_YAML = `name: Stellar Soroban Production CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  CARGO_TERM_COLOR: always
  RUST_BACKTRACE: 1
  SOROBAN_VERSION: "v21.0.0"
  STELLAR_NETWORK: "testnet"

jobs:
  lint-and-format:
    name: 🔍 Format & Static Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: wasm32-unknown-unknown
          components: clippy, rustfmt
      - name: Rustfmt Check
        run: cargo fmt --all -- --check
      - name: Clippy Linter
        run: cargo clippy --all-targets -- -D warnings

  test-contracts:
    name: 🧪 Rust Soroban SDK Tests
    needs: lint-and-format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: wasm32-unknown-unknown
      - name: Run Unit & Cross-Contract Test Matrix
        run: cargo test --workspace -- --nocapture
      - name: Generate Test Coverage
        run: cargo tarpaulin --out Xml --output-dir coverage/

  build-wasm-optimized:
    name: 📦 Optimize Soroban WASM Binaries
    needs: test-contracts
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Soroban CLI
        run: cargo install --locked soroban-cli --version 21.0.0
      - name: Build Contracts
        run: soroban contract build --optimize
      - name: Archive WASM Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: soroban-optimized-wasm
          path: target/wasm32-unknown-unknown/release/*.wasm

  deploy-testnet:
    name: 🚀 Automated Testnet Deployment
    needs: build-wasm-optimized
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: soroban-optimized-wasm
      - name: Deploy Vault Contract
        env:
          SOROBAN_SECRET_KEY: \${{ secrets.STELLAR_DEPLOYER_SECRET }}
        run: |
          stellar contract deploy \\
            --wasm target/wasm32-unknown-unknown/release/stellar_vault_contract.wasm \\
            --source-account deployer \\
            --network testnet

  frontend-e2e-build:
    name: 🌐 Frontend E2E & Production Build
    needs: deploy-testnet
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test:e2e
      - run: npm run build
`;

export const CICD_STAGES: CiCdStage[] = [
  {
    id: 'stage-lint',
    name: 'Lint & Rustfmt Analysis',
    runner: 'ubuntu-latest (GitHub Actions)',
    status: 'success',
    durationSeconds: 14,
    commands: [
      'cargo fmt --all -- --check',
      'cargo clippy --all-targets -- -D warnings'
    ],
    logs: [
      '[cargo fmt] Checking formatting across 8 Rust source files...',
      '[cargo fmt] All files formatted according to Rust style guide (0 diffs).',
      '[cargo clippy] Compiling contracts/vault v3.2.0',
      '[cargo clippy] Compiling contracts/oracle v2.1.0',
      '[cargo clippy] Compiling contracts/token v1.4.0',
      '[cargo clippy] Compiling contracts/yield v2.0.0',
      '[cargo clippy] Finished dev [unoptimized + debuginfo] in 3.42s',
      '✓ 0 warnings, 0 errors found.'
    ]
  },
  {
    id: 'stage-test',
    name: 'Rust Soroban SDK Test Suite (8/8 Passed)',
    runner: 'ubuntu-latest (GitHub Actions)',
    status: 'success',
    durationSeconds: 26,
    commands: [
      'cargo test --workspace -- --nocapture',
      'cargo tarpaulin --ignore-tests --out Html'
    ],
    logs: [
      'running 8 tests',
      'test test_cross_contract_liquidity_deposit ... ok (42ms)',
      'test test_cross_call_token_swap_atomic ... ok (38ms)',
      'test test_cross_contract_harvest_yield ... ok (29ms)',
      'test test_unauthorized_rebalance_rejection ... ok (21ms)',
      'test test_slippage_protection_revert ... ok (26ms)',
      'test test_instance_and_persistent_ttl_bump ... ok (34ms)',
      'test test_oracle_price_staleness_guard ... ok (19ms)',
      'test test_sep41_token_transfers_with_auth ... ok (22ms)',
      'test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out',
      'Coverage: 98.4% of Soroban smart contract logic covered.'
    ]
  },
  {
    id: 'stage-build',
    name: 'Optimized WASM Compilation',
    runner: 'ubuntu-latest (GitHub Actions)',
    status: 'success',
    durationSeconds: 31,
    commands: [
      'soroban contract build --optimize',
      'ls -la target/wasm32-unknown-unknown/release/*.wasm'
    ],
    logs: [
      'Building workspace with release optimizations...',
      'Optimizing target/wasm32-unknown-unknown/release/stellar_vault_contract.wasm (31.4 KB)',
      'Optimizing target/wasm32-unknown-unknown/release/soroban_price_oracle.wasm (14.2 KB)',
      'Optimizing target/wasm32-unknown-unknown/release/stellar_token_engine.wasm (18.6 KB)',
      'Optimizing target/wasm32-unknown-unknown/release/yield_distributor.wasm (12.1 KB)',
      'WASM checksum: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      '✓ Artifacts packaged and ready for network deployment.'
    ]
  },
  {
    id: 'stage-deploy',
    name: 'Stellar Testnet Deployment & Verification',
    runner: 'ubuntu-latest (GitHub Actions)',
    status: 'success',
    durationSeconds: 18,
    commands: [
      'stellar contract deploy --wasm stellar_vault_contract.wasm --source deployer --network testnet',
      'stellar contract invoke --id CDLZFC... -- initialize --admin GD4... --oracle CA76...'
    ],
    logs: [
      'Submitting deployment transaction to Stellar Testnet RPC (https://soroban-testnet.stellar.org)...',
      'Transaction Hash: 7c8f9b4e1d9b3a7c4e1d9b3a7c4e1d9b3a7c4e1d (Ledger 5129401)',
      'Contract Address deployed: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCVI5',
      'Invoking initialize() with cross-contract bindings...',
      'Instance storage TTL initialized with 100,000 ledgers expiration buffer.',
      '✓ Contract verification complete on Stellar Expert.'
    ]
  },
  {
    id: 'stage-frontend',
    name: 'Vite Frontend Build & Smoke Test',
    runner: 'ubuntu-latest (GitHub Actions)',
    status: 'success',
    durationSeconds: 12,
    commands: [
      'npm run test:e2e',
      'npm run build'
    ],
    logs: [
      '✓ Running 2 dApp E2E integration specs (Freighter sign + Event streaming)',
      '✓ All UI tests passed (86ms)',
      'vite v6.2.3 building for production...',
      'dist/index.html                   1.42 kB',
      'dist/assets/index-D7h2q5w.js    342.18 kB │ gzip: 98.42 kB',
      'dist/assets/index-B1k2m9x.css    28.14 kB │ gzip:  6.10 kB',
      '✓ Build succeeded in 1.48s.'
    ]
  }
];
