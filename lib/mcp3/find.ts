export async function mcp3_find({
  database,
  collection,
  filter,
  limit = 100
}: {
  database: string;
  collection: string;
  filter: Record<string, any>;
  limit?: number;
}) {
  try {
    const result = await fetch('/api/mcp3/find', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        database,
        collection,
        filter,
        limit,
        projection: {},
        sort: {}
      })
    });

    if (!result.ok) {
      throw new Error('Failed to fetch data from MongoDB');
    }

    const data = await result.json();
    return data;
  } catch (error) {
    console.error('MongoDB find error:', error);
    throw error;
  }
}
