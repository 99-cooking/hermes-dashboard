import { NextRequest, NextResponse } from 'next/server';
import { getSignals } from '@/lib/queries';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const real = searchParams.get('real') === 'true';
  const signals = getSignals({
    type: searchParams.get('type') || undefined,
    relevance: searchParams.get('relevance') || undefined,
    date: searchParams.get('date') || undefined,
    excludeSeed: real,
  });
  return NextResponse.json(signals);
}
