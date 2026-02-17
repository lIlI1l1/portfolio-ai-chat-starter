import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  // 1. Définition des headers de sécurité (CORS)
  const headers = {
    'Access-Control-Allow-Origin': '*', // Autorise Framer et les autres domaines
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // 2. Gestion de la requête "OPTIONS" (Vérification automatique du navigateur)
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { headers, status: 204 });
  }

  try {
    const { message, conversationHistory } = await req.json();

    // Récupération du contexte Supabase
    const { data: documents } = await supabase
      .from('portfolio_knowledge')
      .select('content')
      .limit(5);

    const context = documents?.map(d => d.content).join('\n') || '';

    // Appel à Groq
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: 'system', content: `You are a UX portfolio assistant. Answer in 2-4 sentences. Context: ${context}` },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    // 3. On renvoie la réponse avec les headers inclus
    return NextResponse.json(
      { answer: aiMessage, response: aiMessage }, 
      { headers }
    );
    
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500, headers }
    );
  }
}
