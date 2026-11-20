// In-app purchase abstraction with mandatory receipt verification before any grant.
import { PRODUCTS, PRODUCT_MAP } from '../../game/config/products';
import { hashString } from '../../game/utils/rng';

export interface StoreProduct {
  id: string;
  title: string;
  price: string;
}

export interface StoreTransaction {
  transactionId: string;
  productId: string;
  receipt: string;
  platform: 'ios' | 'android' | 'web' | 'mock';
}

export type StorePurchaseResult =
  | { status: 'purchased'; transaction: StoreTransaction }
  | { status: 'cancelled' }
  | { status: 'error'; reason: string };

/** Talks to the platform store (StoreKit / Google Play Billing), or a mock. */
export interface StoreClient {
  readonly isTestMode: boolean;
  getProducts(ids: string[]): Promise<StoreProduct[]>;
  purchase(productId: string): Promise<StorePurchaseResult>;
  finishTransaction(tx: StoreTransaction, consumable: boolean): Promise<void>;
  restore(): Promise<StoreTransaction[]>;
}

export interface VerificationResult {
  valid: boolean;
  productId?: string;
  transactionId?: string;
  reason?: string;
}

/** Verifies receipts. In production this MUST be a server call (see RemoteReceiptVerifier). */
export interface ReceiptVerifier {
  verify(tx: StoreTransaction): Promise<VerificationResult>;
}

export type PurchaseOutcome =
  | { status: 'verified'; productId: string; transactionId: string }
  | { status: 'cancelled' }
  | { status: 'failed'; reason: string };

export class PurchaseService {
  constructor(private store: StoreClient, private verifier: ReceiptVerifier) {}

  get isTestMode() {
    return this.store.isTestMode;
  }

  getProducts() {
    return this.store.getProducts(PRODUCTS.map((p) => p.id));
  }

  /**
   * Runs the full purchase flow. The returned outcome is `verified` ONLY when the
   * verifier confirmed the receipt and it matches the requested product. Callers grant
   * items exclusively on `verified`, and the game state dedupes by transaction id.
   */
  async buy(productId: string, onVerified: (o: { productId: string; transactionId: string }) => void): Promise<PurchaseOutcome> {
    const product = PRODUCT_MAP[productId];
    if (!product) return { status: 'failed', reason: 'Unknown product' };
    let result: StorePurchaseResult;
    try {
      result = await this.store.purchase(productId);
    } catch (e) {
      return { status: 'failed', reason: String(e) };
    }
    if (result.status === 'cancelled') return { status: 'cancelled' };
    if (result.status === 'error') return { status: 'failed', reason: result.reason };
    const tx = result.transaction;
    let v: VerificationResult;
    try {
      v = await this.verifier.verify(tx);
    } catch (e) {
      return { status: 'failed', reason: `Verification error: ${String(e)}` };
    }
    if (!v.valid) return { status: 'failed', reason: v.reason ?? 'Receipt rejected' };
    if (v.productId !== productId || v.transactionId !== tx.transactionId) {
      return { status: 'failed', reason: 'Receipt does not match purchase' };
    }
    onVerified({ productId, transactionId: tx.transactionId });
    // Only finish (acknowledge/consume) after the grant has been applied.
    await this.store.finishTransaction(tx, product.kind === 'consumable');
    return { status: 'verified', productId, transactionId: tx.transactionId };
  }

  /** Returns verified non-consumable product ids owned by the user. */
  async restore(): Promise<string[]> {
    const txs = await this.store.restore();
    const owned: string[] = [];
    for (const tx of txs) {
      const v = await this.verifier.verify(tx);
      const p = PRODUCT_MAP[tx.productId];
      if (v.valid && v.productId === tx.productId && p?.kind === 'non_consumable') owned.push(tx.productId);
    }
    return Array.from(new Set(owned));
  }
}

// ---------------- Mock implementations (development / TEST MODE) ----------------

const MOCK_SECRET = 'gym-empire-mock-store';

export function mockSignature(productId: string, transactionId: string): string {
  return hashString(`${MOCK_SECRET}|${productId}|${transactionId}`).toString(16);
}

export interface MockStoreRequest {
  productId: string;
  resolve: (approved: boolean) => void;
}

/**
 * A fake store that asks the UI (<MockStoreHost/>) to show a TEST PURCHASE sheet.
 * No money is ever charged. Approving produces a signed mock receipt.
 */
export class MockStoreClient implements StoreClient {
  readonly isTestMode = true;
  private listener: ((r: MockStoreRequest) => void) | null = null;
  private owned = new Map<string, StoreTransaction>();
  private counter = 0;
  /** test hook: forces the next purchase to produce an invalid receipt */
  public tamperNext = false;
  /** test hook: auto-approve without UI */
  public autoApprove: boolean | null = null;

  setHost(listener: ((r: MockStoreRequest) => void) | null) {
    this.listener = listener;
  }

  async getProducts(ids: string[]): Promise<StoreProduct[]> {
    return ids.map((id) => ({ id, title: PRODUCT_MAP[id]?.name ?? id, price: `${PRODUCT_MAP[id]?.displayPrice ?? ''} (test)` }));
  }

  async purchase(productId: string): Promise<StorePurchaseResult> {
    let approved: boolean;
    if (this.autoApprove !== null) approved = this.autoApprove;
    else if (this.listener) approved = await new Promise<boolean>((resolve) => this.listener!({ productId, resolve }));
    else return { status: 'error', reason: 'Store unavailable' };
    if (!approved) return { status: 'cancelled' };
    this.counter += 1;
    const transactionId = `mock-${Date.now()}-${this.counter}`;
    let sig = mockSignature(productId, transactionId);
    if (this.tamperNext) {
      sig = 'bad';
      this.tamperNext = false;
    }
    const tx: StoreTransaction = { transactionId, productId, receipt: `MOCK|${productId}|${transactionId}|${sig}`, platform: 'mock' };
    return { status: 'purchased', transaction: tx };
  }

  async finishTransaction(tx: StoreTransaction, consumable: boolean): Promise<void> {
    if (!consumable) this.owned.set(tx.productId, tx);
  }

  async restore(): Promise<StoreTransaction[]> {
    return Array.from(this.owned.values());
  }
}

/** Verifies mock receipts locally. Stands in for the server during development only. */
export class MockReceiptVerifier implements ReceiptVerifier {
  async verify(tx: StoreTransaction): Promise<VerificationResult> {
    const parts = tx.receipt.split('|');
    if (parts.length !== 4 || parts[0] !== 'MOCK') return { valid: false, reason: 'Malformed receipt' };
    const [, productId, transactionId, sig] = parts;
    if (sig !== mockSignature(productId, transactionId)) return { valid: false, reason: 'Invalid signature' };
    return { valid: true, productId, transactionId };
  }
}

/**
 * Production verifier: posts the receipt to your backend (e.g. the Supabase edge function
 * in /supabase/functions/verify-purchase) which validates with Apple/Google servers.
 */
export class RemoteReceiptVerifier implements ReceiptVerifier {
  constructor(private endpoint: string, private getAuthToken: () => Promise<string | null>) {}

  async verify(tx: StoreTransaction): Promise<VerificationResult> {
    const token = await this.getAuthToken();
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(tx),
    });
    if (!res.ok) return { valid: false, reason: `Server responded ${res.status}` };
    const body = (await res.json()) as VerificationResult;
    return { valid: !!body.valid, productId: body.productId, transactionId: body.transactionId, reason: body.reason };
  }
}
