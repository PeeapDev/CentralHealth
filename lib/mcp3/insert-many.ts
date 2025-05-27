export async function mcp3_insert_many({
  database,
  collection,
  documents
}: {
  database: string;
  collection: string;
  documents: any[];
}) {
  try {
    const result = await fetch('/api/mcp3/insert-many', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        database,
        collection,
        documents
      })
    });

    if (!result.ok) {
      throw new Error('Failed to insert documents into MongoDB');
    }

    const data = await result.json();
    return data;
  } catch (error) {
    console.error('MongoDB insert error:', error);
    throw error;
  }
}
