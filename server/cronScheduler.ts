import { runCronJob } from './adsTransparencyScraper';

const HOUR_IN_MS = 60 * 60 * 1000;

let cronInterval: ReturnType<typeof setInterval> | null = null;

export function startCronScheduler(): void {
  console.log('[Cron] Starting hourly scheduler...');
  
  runCronJob().catch(err => {
    console.error('[Cron] Initial job error:', err);
  });
  
  cronInterval = setInterval(() => {
    console.log('[Cron] Running scheduled job...');
    runCronJob().catch(err => {
      console.error('[Cron] Scheduled job error:', err);
    });
  }, HOUR_IN_MS);
  
  console.log('[Cron] Scheduler started - running every hour');
}

export function stopCronScheduler(): void {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('[Cron] Scheduler stopped');
  }
}

export async function triggerManualRun(): Promise<void> {
  console.log('[Cron] Manual trigger requested');
  await runCronJob();
}
