// app/googlee3cad0972a90ec0f/route.ts
import { NextResponse } from 'next/server';

export function GET() {
  return new NextResponse('google-site-verification: googlee3cad0972a90ec0f.html', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
