import { NextRequest, NextResponse } from 'next/server';
import { getExperiments, getLearnings } from '@/lib/queries';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const real = searchParams.get('real') === 'true';
  const view = searchParams.get('view');

  if (view === 'learnings') {
    return NextResponse.json(getLearnings({ excludeSeed: real }));
  }

  const experiments = getExperiments({
    status: searchParams.get('status') || undefined,
    excludeSeed: real,
  });
  const learnings = getLearnings({ excludeSeed: real });

  return NextResponse.json({ experiments, learnings });
}
