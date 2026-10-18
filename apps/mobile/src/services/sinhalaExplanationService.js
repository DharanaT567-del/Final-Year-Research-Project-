import { getSongById } from './songLibraryService';

export function personalizeExplanation(explanation, learnerLevel) {
  const level = ['Beginner', 'Intermediate', 'Advanced'].includes(learnerLevel)
    ? learnerLevel
    : 'Beginner';
  const wordLimit = level === 'Beginner' ? explanation.words.length : 1;

  return {
    level,
    simple: explanation.simpleByLevel[level],
    words: explanation.words.slice(0, wordLimit),
    figurative: level === 'Advanced' ? explanation.figurative : null,
    context: explanation.context,
    source: 'synthetic-rehearsal',
  };
}

export async function generateSinhalaExplanation(songId, lineId, learnerLevel) {
  const song = await getSongById(songId);
  const line = song?.lines.find((item) => item.id === lineId);

  if (!line?.explanation) {
    throw new Error('Sinhala explanation is unavailable for this lyric line.');
  }

  return {
    original: line.text,
    ...personalizeExplanation(line.explanation, learnerLevel),
  };
}