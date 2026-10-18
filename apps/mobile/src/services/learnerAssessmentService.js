import AsyncStorage from '@react-native-async-storage/async-storage';

const ASSESSMENT_HISTORY_KEY = 'naada.learnerAssessmentHistory';

export const assessmentQuestions = [
  {
    id: 'vocabulary',
    prompt: '“සැනසීම” යන වචනයට වඩාත් සමීප අර්ථය කුමක්ද?',
    options: ['සිතට ලැබෙන සහනය', 'ඉක්මනින් දිවීම', 'අලුත් ගමනක්'],
    correctIndex: 0,
  },
  {
    id: 'sentence',
    prompt: '“කාලය ගඟක් මෙන් ගලා යයි” යන වාක්‍යයෙන් අදහස් වන්නේ කුමක්ද?',
    options: ['ගඟක් වියළී යයි', 'කාලය අඛණ්ඩව ගෙවී යයි', 'වැස්ස ආරම්භ වෙයි'],
    correctIndex: 1,
  },
  {
    id: 'context',
    prompt: '“වැහි බිඳු පැරණි මතකවල දොරට තට්ටු කරයි” යන කෘතිම පදයෙන් අදහස් වන්නේ කුමක්ද?',
    options: ['වැස්සෙන් පරණ සිදුවීම් සිහිවේ', 'දොරක් කැඩී යයි', 'ගඟක් ඉහළට ගලා යයි'],
    correctIndex: 0,
  },
];

export function getProvisionalLevel(score) {
  if (score <= 1) return 'Beginner';
  if (score === 2) return 'Intermediate';
  return 'Advanced';
}

export function scoreAssessment(answers) {
  const score = assessmentQuestions.reduce(
    (total, question) => total + (answers[question.id] === question.correctIndex ? 1 : 0),
    0,
  );
  return {
    score,
    total: assessmentQuestions.length,
    level: getProvisionalLevel(score),
    takenAt: new Date().toISOString(),
    isProvisional: true,
  };
}

export async function getAssessmentHistory(userId) {
  const key = `${ASSESSMENT_HISTORY_KEY}.${userId || 'guest'}`;
  const stored = await AsyncStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

export async function saveAssessmentResult(result, userId) {
  const key = `${ASSESSMENT_HISTORY_KEY}.${userId || 'guest'}`;
  const history = await getAssessmentHistory(userId);
  const nextHistory = [result, ...history];
  await AsyncStorage.setItem(key, JSON.stringify(nextHistory));
  return result;
}