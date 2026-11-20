// Supabase Edge Function (Deno): server-side receipt verification. NOT deployed in this release.
// Production steps:
//  - iOS: verify the StoreKit 2 signed transaction (JWS) with Apple's App Store Server API.
//  - Android: call Google Play Developer API purchases.products.get with a service account.
// Responds { valid, productId, transactionId } and records transaction_id to block replays.
Deno.serve(async (req) => {
  const tx = await req.json();
  // Intentionally fail closed until real verification is implemented.
  return Response.json({ valid: false, reason: 'verification_not_configured', transactionId: tx?.transactionId }, { status: 501 });
});
