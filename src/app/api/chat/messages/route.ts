import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = req.nextUrl;

    const conversation_id = searchParams.get('conversation_id');
    const from_agent = searchParams.get('from_agent');
    const to_agent = searchParams.get('to_agent');
    const limit = parseInt(searchParams.get('limit') || '50');
    const since = searchParams.get('since');

    let sql = 'SELECT * FROM messages WHERE 1=1';
    const params: unknown[] = [];

    if (conversation_id) {
      sql += ' AND conversation_id = ?';
      params.push(conversation_id);
    }
    if (from_agent) {
      sql += ' AND from_agent = ?';
      params.push(from_agent);
    }
    if (to_agent) {
      sql += ' AND to_agent = ?';
      params.push(to_agent);
    }
    if (since) {
      sql += ' AND created_at > ?';
      params.push(parseInt(since));
    }

    sql += ' ORDER BY created_at ASC LIMIT ?';
    params.push(limit);

    const rows = db.prepare(sql).all(...params) as any[];
    const messages = rows.map(m => ({
      ...m,
      metadata: m.metadata ? JSON.parse(m.metadata) : null,
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('GET /api/chat/messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const from = (body.from || '').trim();
    const to = body.to ? (body.to as string).trim() : null;
    const content = (body.content || '').trim();
    const message_type = body.message_type || 'text';
    const conversation_id = body.conversation_id || `conv_${Date.now()}`;
    const metadata = body.metadata || null;

    if (!from || !content) {
      return NextResponse.json(
        { error: '"from" and "content" are required' },
        { status: 400 },
      );
    }

    const stmt = db.prepare(`
      INSERT INTO messages (conversation_id, from_agent, to_agent, content, message_type, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      conversation_id,
      from,
      to,
      content,
      message_type,
      metadata ? JSON.stringify(metadata) : null,
    );

    const messageId = result.lastInsertRowid as number;
    const created = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId) as any;

    return NextResponse.json({
      message: {
        ...created,
        metadata: created.metadata ? JSON.parse(created.metadata) : null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/chat/messages error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
