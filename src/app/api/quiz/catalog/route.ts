import { getQuizCatalog } from '@/lib/quiz-parser';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const catalog = getQuizCatalog();
    return NextResponse.json(catalog);
  } catch {
    return NextResponse.json(
      { error: 'Failed to load quiz catalog' },
      { status: 500 }
    );
  }
}