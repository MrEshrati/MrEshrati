import { getLanguages } from '../lib/github.mjs';
import { languagesCard } from '../lib/cards.mjs';
import { serveCard } from '../lib/response.mjs';

export function GET(request) {
  return serveCard(request, 'GITHUB_LANGUAGES_TOKEN', getLanguages, languagesCard);
}
