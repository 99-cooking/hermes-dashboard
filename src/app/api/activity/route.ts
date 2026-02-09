import { NextRequest, NextResponse } from 'next/server';
import { getActivityLog } from '@/lib/queries';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const real = searchParams.get('real') === 'true';
  const activity = getActivityLog({
    action: searchParams.get('action') || undefined,
    limit: Number(searchParams.get('limit')) || 100,
    excludeSeed: real,
  });
  return NextResponse.json(activity);
}
