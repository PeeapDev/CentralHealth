import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { database, collection, documents } = body;

    const response = await fetch('http://localhost:3000/api/mongodb/insert-many', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collection,
        database,
        documents
      })
    });

    if (!response.ok) {
      throw new Error('Failed to insert into MongoDB');
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('MongoDB insert error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
