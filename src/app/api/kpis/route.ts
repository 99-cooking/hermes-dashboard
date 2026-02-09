import { NextRequest, NextResponse } from 'next/server';
import { getDailyMetrics, getWeeklyKPIs } from '@/lib/queries';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const weeks = Number(searchParams.get('weeks')) || 12;
  const real = searchParams.get('real') === 'true';

  const daily = getDailyMetrics(weeks * 7, { excludeSeed: real });
  const weekly = getWeeklyKPIs(weeks, { excludeSeed: real });

  return NextResponse.json({ daily, weekly });
}
