import React, { useState } from 'react';
import {
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { assessmentQuestions, saveAssessmentResult, scoreAssessment } from '../services/learnerAssessmentService';
import { AuthContext } from '../context/AuthContext';
import { lyricsTheme } from '../theme/lyricsTheme';

const c = lyricsTheme.colors;

export default function LearnerAssessmentScreen({ navigation }) {
  const { user } = React.useContext(AuthContext);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [saveError, setSaveError] = useState('');

  const question = assessmentQuestions[questionIndex];
  const finishAssessment = async (finalAnswers) => {
    const scored = scoreAssessment(finalAnswers);
    setResult(scored);
    setSaveError('');
    try {
      await saveAssessmentResult(scored, user?.uid);
    } catch {
      setSaveError('ප්‍රතිඵලය මෙම උපාංගයේ සුරැකිය නොහැකි විය.');
    }
  };

  const chooseAnswer = (optionIndex) => {
    setAnswers((current) => ({ ...current, [question.id]: optionIndex }));
  };

  const continueAssessment = () => {
    if (questionIndex === assessmentQuestions.length - 1) finishAssessment(answers);
    else setQuestionIndex((current) => current + 1);
  };

  const restartAssessment = () => {
    setQuestionIndex(0);
    setAnswers({});
    setResult(null);
    setSaveError('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={c.background} />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.back}>‹  Back</Text>
        </TouchableOpacity>
        <Text style={styles.kicker}>LEARNER CHECK-IN</Text>
        <Text style={styles.title}>Sinhala proficiency</Text>

        {result ? (
          <View style={styles.resultPanel}>
            <Text style={styles.resultLabel}>Provisional estimate</Text>
            <Text style={styles.level}>{result.level}</Text>
            <Text style={styles.score}>{result.score} / {result.total} correct</Text>
            <Text style={styles.description}>This short, synthetic quiz is a learning aid, not a validated proficiency assessment.</Text>
            {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
            <Text style={styles.reviewTitle}>Review answers</Text>
            {assessmentQuestions.map((item, index) => (
              <View key={item.id} style={styles.reviewRow}>
                <Text style={styles.reviewQuestion}>{index + 1}. {item.prompt}</Text>
                <Text style={answers[item.id] === item.correctIndex ? styles.correct : styles.answer}>
                  {answers[item.id] === item.correctIndex ? 'Correct: ' : 'Answer: '}{item.options[item.correctIndex]}
                </Text>
              </View>
            ))}
            <TouchableOpacity style={styles.primaryButton} onPress={restartAssessment} accessibilityRole="button">
              <Text style={styles.primaryText}>Retake assessment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('LearningProgress')} accessibilityRole="button">
              <Text style={styles.secondaryText}>View learning progress</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>Question {questionIndex + 1} of {assessmentQuestions.length}</Text>
              <Text style={styles.progressText}>{Math.round(((questionIndex + 1) / assessmentQuestions.length) * 100)}%</Text>
            </View>
            <View style={styles.track}><View style={[styles.fill, { width: `${((questionIndex + 1) / assessmentQuestions.length) * 100}%` }]} /></View>
            <Text style={styles.note}>මෙය කෘතිම උදාහරණ භාවිත කරන තාවකාලික ඇගයීමකි.</Text>
            <Text style={styles.question}>{question.prompt}</Text>
            {question.options.map((option, index) => {
              const selected = answers[question.id] === index;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => chooseAnswer(index)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View style={[styles.radio, selected && styles.radioSelected]} />
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.primaryButton, answers[question.id] == null && styles.disabled]}
              onPress={continueAssessment}
              disabled={answers[question.id] == null}
              accessibilityRole="button"
            >
              <Text style={styles.primaryText}>{questionIndex === assessmentQuestions.length - 1 ? 'See result' : 'Next question'}</Text>
            </TouchableOpacity>
            <Text style={styles.note}>Scoring: 0–1 Beginner · 2 Intermediate · 3 Advanced. Categories are provisional.</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  content: { padding: 20, paddingBottom: 32 },
  back: { minHeight: 42, color: c.lightBlue, fontSize: 14, fontWeight: '700', textAlignVertical: 'center' },
  kicker: { color: c.lightBlue, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginTop: 15 },
  title: { color: c.text, fontSize: 27, fontWeight: '900', marginTop: 7, marginBottom: 25 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { color: c.secondaryText, fontSize: 12, fontWeight: '700' },
  track: { height: 6, backgroundColor: c.card, borderRadius: 3, overflow: 'hidden', marginTop: 9, marginBottom: 27 },
  fill: { height: '100%', backgroundColor: c.primary },
  question: { color: c.text, fontSize: 20, lineHeight: 31, fontWeight: '800', marginBottom: 17 },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 56, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 8, paddingHorizontal: 14, marginBottom: 9 },
  optionSelected: { borderColor: c.lightBlue, backgroundColor: c.cardSecondary },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: c.secondaryText, marginRight: 12 },
  radioSelected: { borderWidth: 5, borderColor: c.lightBlue },
  optionText: { flex: 1, color: c.text, fontSize: 14, lineHeight: 22 },
  optionTextSelected: { fontWeight: '800' },
  primaryButton: { minHeight: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: c.primary, borderRadius: 8, marginTop: 16 },
  disabled: { opacity: 0.45 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  note: { color: c.secondaryText, fontSize: 11, lineHeight: 17, marginTop: 15, textAlign: 'center' },
  resultPanel: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 9, padding: 17 },
  resultLabel: { color: c.secondaryText, fontSize: 12 },
  level: { color: c.lightBlue, fontSize: 26, fontWeight: '900', marginTop: 4 },
  score: { color: c.text, fontSize: 16, fontWeight: '800', marginTop: 5 },
  description: { color: c.secondaryText, fontSize: 12, lineHeight: 19, marginTop: 12 },
  reviewTitle: { color: c.text, fontSize: 16, fontWeight: '800', marginTop: 22, marginBottom: 8 },
  reviewRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.border },
  reviewQuestion: { color: c.text, fontSize: 13, lineHeight: 21 },
  answer: { color: c.secondaryText, fontSize: 12, lineHeight: 19, marginTop: 5 },
  correct: { color: c.success, fontSize: 12, lineHeight: 19, marginTop: 5 },
  error: { color: c.error, fontSize: 12, marginTop: 8 },
  secondaryButton: { minHeight: 46, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: c.border, borderRadius: 8, marginTop: 9 },
  secondaryText: { color: c.lightBlue, fontSize: 13, fontWeight: '700' },
});