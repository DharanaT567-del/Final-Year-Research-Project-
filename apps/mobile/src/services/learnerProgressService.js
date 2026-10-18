import { getAssessmentHistory } from './learnerAssessmentService';

export async function getLearnerProgress(userId) {
  const assessmentHistory = await getAssessmentHistory(userId);
  return {
    assessmentHistory,
    latestAssessment: assessmentHistory[0] || null,
    completedSongs: null,
    vocabularyReviewed: null,
    isDemonstration: false,
  };
}