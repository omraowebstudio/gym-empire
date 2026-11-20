// Supabase Edge Function (Deno). Validates and stores a leaderboard score.
// The validation rules mirror src/services/leaderboard/validation.ts (unit-tested).
// NOT deployed in this release.
import { createClient } from 'npm:@supabase/supabase-js@2';

const LIMITS: Record<string, { max: number; maxGainPerHour: number }> = {
  level: { max: 100, maxGainPerHour: 6 },
  gym: { max: 1_000_000, maxGainPerHour: 5_000 },
  members: { max: 5_000, maxGainPerHour: 400 },
  strength: { max: 20_000, maxGainPerHour: 250 },
  achievements: { max: 39, maxGainPerHour: 10 },
  weekly: { max: 100_000, maxGainPerHour: 2_000 },
};

Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization') ?? '';
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: user } = await admin.auth.getUser(auth.replace('Bearer ', ''));
  if (!user?.user) return new Response('unauthorized', { status: 401 });
  const body = await req.json();
  const lim = LIMITS[body.category];
  const value = Number(body.value);
  if (!lim || !Number.isInteger(value) || value < 0 || value > lim.max) return Response.json({ ok: false, reason: 'invalid_value' }, { status: 400 });
  // TODO before launch: port recomputeStrength() evidence check for the 'strength' category.
  const period = body.category === 'weekly' ? String(body.period) : 'all';
  const { data: prev } = await admin.from('leaderboard_scores').select('value, submitted_at')
    .eq('player_id', user.user.id).eq('category', body.category).eq('period', period).maybeSingle();
  if (prev && body.category !== 'weekly') {
    const hours = Math.max(1 / 60, (Date.now() - new Date(prev.submitted_at).getTime()) / 3_600_000);
    if (value - prev.value > lim.maxGainPerHour * hours + 1) return Response.json({ ok: false, reason: 'implausible_gain' }, { status: 422 });
  }
  await admin.from('leaderboard_scores').upsert({ player_id: user.user.id, category: body.category, period, value, submitted_at: new Date().toISOString() });
  return Response.json({ ok: true });
});
