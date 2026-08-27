// Stellar & Soroban helper utilities

export function formatAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 2) return address || '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatStroopsToXlm(stroops: number | string): string {
  const num = typeof stroops === 'string' ? parseFloat(stroops) : stroops;
  if (isNaN(num)) return '0.00';
  return (num / 10000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export function formatXlmToStroops(xlm: number | string): string {
  const num = typeof xlm === 'string' ? parseFloat(xlm) : xlm;
  if (isNaN(num)) return '0';
  return Math.floor(num * 10000000).toString();
}

export function generateMockTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function generateMockXdr(contract: string, method: string, args: Record<string, unknown>): string {
  return `AAAAAgAAAAC...[Soroban_HostFunction_InvokeContract:${contract.slice(0, 6)}_${method}]...${btoa(JSON.stringify(args)).slice(0, 24)}==`;
}
