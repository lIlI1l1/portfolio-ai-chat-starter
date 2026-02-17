import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { message, conversationHistory } = await req.json();

    const { data: documents } = await supabase
      .from('portfolio_knowledge')
      .select('content')
      .limit(5);

    const context = documents?.map(d => d.content).join('\n') || '';

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

    // IMPORTANT : On ne met PLUS de headers ici, le middleware s'en occupe
    return NextResponse.json({ answer: aiMessage, response: aiMessage });
    
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
