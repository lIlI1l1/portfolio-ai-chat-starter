import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { message, conversationHistory } = await req.json();

    // Récupère les infos de ton portfolio dans Supabase
    const { data: documents } = await supabase
      .from('portfolio_knowledge')
      .select('content')
      .limit(5);

    const context = documents?.map(d => d.content).join('\n') || '';

    // Appel à Groq avec le modèle mentionné dans son guide
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Le modèle de son guide
        messages: [
          { role: 'system', content: `You are a UX portfolio assistant. Use this context: ${context}` },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return NextResponse.json({ answer: data.choices[0].message.content });
    
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
