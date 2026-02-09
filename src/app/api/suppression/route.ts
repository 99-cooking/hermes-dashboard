import { NextRequest, NextResponse } from 'next/server';
import { getSuppression } from '@/lib/queries';

export async function GET(req: NextRequest) {
  const real = req.nextUrl.searchParams.get('real') === 'true';
  return NextResponse.json(getSuppression({ excludeSeed: real }));
}
