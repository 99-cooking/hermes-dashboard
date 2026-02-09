import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();

    const conversations = db.prepare(`
      SELECT
        m.conversation_id,
        MAX(m.created_at) as last_message_at,
        COUNT(*) as message_count,
        SUM(CASE WHEN m.read_at IS NULL AND m.from_agent != 'nyk' THEN 1 ELSE 0 END) as unread_count
      FROM messages m
      GROUP BY m.conversation_id
      ORDER BY last_message_at DESC
    `).all() as any[];

    const withLastMessage = conversations.map((conv: any) => {
      const lastMsg = db.prepare(`
        SELECT * FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `).get(conv.conversation_id) as any;

      return {
        id: conv.conversation_id,
        ...conv,
        last_message: lastMsg
          ? { ...lastMsg, metadata: lastMsg.metadata ? JSON.parse(lastMsg.metadata) : null }
          : null,
      };
    });

    return NextResponse.json({ conversations: withLastMessage });
  } catch (error) {
    console.error('GET /api/chat/conversations error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
