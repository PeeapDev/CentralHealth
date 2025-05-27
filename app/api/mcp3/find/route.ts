import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { database, collection, filter, limit = 100, projection = {}, sort = {} } = body;

    const response = await fetch('http://localhost:3000/api/mongodb/find', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collection,
        database,
        filter,
        limit,
        projection,
        sort
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from MongoDB');
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('MongoDB find error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
