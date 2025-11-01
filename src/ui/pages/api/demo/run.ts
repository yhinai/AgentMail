import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // In production, this would trigger the demo runner
  // For now, just return success
  res.status(200).json({ success: true, message: 'Demo started' });
}
