export async function withBackoff<T>(
    fn: () => Promise<T>,
    { tries = 3, baseMs = 400 }: { tries?: number; baseMs?: number } = {}
  ): Promise<T> {
    let lastErr: unknown;
    for (let i = 0; i < tries; i++) {
      try { return await fn(); } catch (e: any) {
        lastErr = e;
        const msg = String(e?.message || "");
        const retriable = /network|timeout|5\d\d|failed|fetch/i.test(msg);
        if (i === tries - 1 || !retriable) break;
        const delay = baseMs * Math.pow(2, i) + Math.random() * 150;
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw lastErr;
  }
  