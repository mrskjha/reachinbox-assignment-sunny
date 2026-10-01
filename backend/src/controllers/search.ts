import { esClient } from "../config/elasticsearch.js";

const handleElasticsearch = async (req:any, res:any) => {
  try {
    const { q, userId } = req.query;

    if (!q || !userId) {
      return res.status(400).json({ error: 'Query (q) and userId are required' });
    }

    // Elasticsearch multi-match query 
    const result = await esClient.search({
      index: 'emails',
      body: {
        query: {
          bool: {
            must: [
              { match: { userId: userId as string } }, 
              {
                multi_match: {
                  query: q as string,
                  fields: ['subject', 'body', 'recipient'], 
                  fuzziness: 'AUTO' 
                }
              }
            ]
          }
        }
      }
    });

    // Elasticsearch 
    const hits = result.hits.hits.map((hit: any) => hit._source);
    
    res.status(200).json(hits);
  } catch (error) {
    console.error('Elasticsearch Search Error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
}

export default handleElasticsearch;