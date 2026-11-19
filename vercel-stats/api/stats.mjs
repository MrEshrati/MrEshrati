import { getActivity } from '../lib/github.mjs';
import { activityCard } from '../lib/cards.mjs';
import { serveCard } from '../lib/response.mjs';

export function GET(request) {
  return serveCard(request, 'GITHUB_ACTIVITY_TOKEN', getActivity, activityCard);
}
