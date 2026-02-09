import { NextRequest, NextResponse } from 'next/server';
import { getOverviewStats, getAlerts, getActivityLog, getDailyMetrics } from '@/lib/queries';

export async function GET(req: NextRequest) {
  const real = req.nextUrl.searchParams.get('real') === 'true';
  const stats = getOverviewStats({ excludeSeed: real });
  const alerts = getAlerts({ excludeSeed: real });
  const recentActivity = getActivityLog({ limit: 20, excludeSeed: real });
  const metrics = getDailyMetrics(84, { excludeSeed: real }); // 12 weeks

  return NextResponse.json({ stats, alerts, recentActivity, metrics });
}
