import { NextRequest, NextResponse } from 'next/server';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/queries';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const notifications = getNotifications({
    unread_only: searchParams.get('unread') === 'true',
    type: searchParams.get('type') || undefined,
    limit: Number(searchParams.get('limit')) || 50,
  });
  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  if (body.mark_all_read) {
    markAllNotificationsRead();
    return NextResponse.json({ ok: true });
  }

  if (body.id) {
    markNotificationRead(body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Provide id or mark_all_read' }, { status: 400 });
}
