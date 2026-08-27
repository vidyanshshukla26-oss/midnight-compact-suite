export type NetworkType = 'testnet' | 'futurenet' | 'mainnet';

export interface WalletAccount {
  address: string;
  name: string;
  xlmBalance: number;
  usdcBalance: number;
  strlBalance: number; // Native Starlight Governance token
  connected: boolean;
  network: NetworkType;
  publicKey: string;
  secretKeyMasked: string;
}

export interface SorobanContract {
  id: string;
  name: string;
  address: string;
  version: string;
  description: string;
  wasmHash: string;
  ttlRemaining: number;
  deployedAtLedger: number;
  codeRust: string;
  methods: ContractMethod[];
  crossCallsTo?: string[];
  storageType: 'Instance' | 'Persistent' | 'Temporary';
}

export interface ContractMethod {
  name: string;
  description: string;
  inputs: { name: string; type: string; defaultValue?: string; placeholder?: string }[];
  outputType: string;
  isMutating: boolean;
  requiresAuth: boolean;
  crossCallTarget?: string;
}

export interface SorobanEvent {
  id: string;
  contractId: string;
  contractName: string;
  topic: string[];
  data: Record<string, unknown> | string;
  ledger: number;
  timestamp: string;
  txHash: string;
  type: 'deposit' | 'swap' | 'cross_call' | 'yield_claim' | 'ttl_bump' | 'auth_grant';
}

export interface TransactionRecord {
  id: string;
  txHash: string;
  ledger: number;
  timestamp: string;
  contract: string;
  method: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  fee: number; // in XLM
  cpuInstructions: number;
  memoryBytes: number;
  authAddress: string;
  xdrEnvelope: string;
  returnValue?: string;
  crossCallTrace?: {
    fromContract: string;
    toContract: string;
    method: string;
    status: 'SUCCESS' | 'FAILED';
  }[];
}

export interface TestSuite {
  id: string;
  name: string;
  category: 'Contract Unit Tests' | 'Inter-Contract Tests' | 'Auth & Security' | 'Frontend E2E';
  file: string;
  tests: TestCase[];
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  durationMs: number;
  status: 'passed' | 'failed' | 'running' | 'idle';
  assertionCount: number;
  logs: string[];
  codeSnippet: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: string;
  badge?: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
  category: 'contract' | 'frontend' | 'test' | 'cicd' | 'docs';
}

export interface CiCdStage {
  id: string;
  name: string;
  runner: string;
  status: 'success' | 'running' | 'pending' | 'failed';
  durationSeconds: number;
  commands: string[];
  logs: string[];
}

export interface SubmissionCheckItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  category: 'Required' | 'Proof' | 'Architecture';
  linkOrValue?: string;
  actionLabel?: string;
  actionView?: string;
}
