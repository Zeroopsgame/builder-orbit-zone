import { getStore } from '@netlify/blobs';
import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      },
    });
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  };

  try {
    const store = getStore('crew-status');
    
    if (req.method === 'GET') {
      // Get crew data
      const data = await store.get('crew-members');
      
      // If no data exists, return sample data
      if (!data) {
        const sampleData = [
          {
            id: "1",
            name: "OT Sample User",
            isIn: true,
            lastUpdate: new Date().toISOString(),
            location: "",
            notes: ""
          }
        ];
        
        // Initialize with sample data
        await store.set('crew-members', JSON.stringify(sampleData));
        
        return new Response(JSON.stringify(sampleData), {
          status: 200,
          headers,
        });
      }
      
      return new Response(typeof data === 'string' ? data : JSON.stringify(data), {
        status: 200,
        headers,
      });
    }
    
    if (req.method === 'POST') {
      // Save crew data
      const body = await req.text();
      const { crewMembers } = JSON.parse(body);
      await store.set('crew-members', JSON.stringify(crewMembers));
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers,
      });
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
    
  } catch (error) {
    console.error('Netlify Function Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers,
    });
  }
};

export const config: Config = {
  path: "/api/crew-data"
};
