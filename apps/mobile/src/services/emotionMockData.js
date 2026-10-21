/**
 * emotionMockData.js
 * Local mock data for Naadha Sinhala Song Emotion Analysis Prototype.
 * 
 * IMPORTANT: This mock data is strictly separated from the UI components
 * so that it can later be seamlessly replaced with real AI/ML backend API endpoints.
 * All percentage breakdowns sum to exactly 100%.
 */

export const DEMO_SONGS = [
  {
    id: 'song-001',
    title: 'නිහඬ රැයේ සිහින',
    englishTitle: 'Nihanda Raye Sihina',
    artist: 'පණ්ඩිත් ඩබ්.ඩී. අමරදේව',
    englishArtist: 'Pandit W.D. Amaradeva',
    category: 'සම්භාව්‍ය ගීත (Classical)',
    duration: '03:45',
    audioFile: 'S001.mp3',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditative-flute-112284.mp3',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    tags: ['මධ්‍යම මට්ටම', 'ගායනය සහ සිතාරය'],
    currentlyLearning: true,
    progress: 42,
    
    // Emotion breakdown strictly sums to 100%
    emotions: {
      calmness: { label: 'ශාන්තිය / සන්සුන් බව', english: 'Calmness', percentage: 35, color: '#00e5ff', icon: '🍃' },
      sadness: { label: 'ශෝකය / විරහව', english: 'Sadness', percentage: 25, color: '#5b7fff', icon: '💧' },
      love: { label: 'ආදරය / ප්‍රේමය', english: 'Love', percentage: 20, color: '#ff66a3', icon: '🌸' },
      happiness: { label: 'සතුට / ප්‍රීතිය', english: 'Happiness', percentage: 10, color: '#ffd166', icon: '☀️' },
      fear: { label: 'භය / චකිතය', english: 'Fear', percentage: 6, color: '#a259ff', icon: '⚡' },
      anger: { label: 'ක්‍රෝධය / කෝපය', english: 'Anger', percentage: 4, color: '#ff5c5c', icon: '🔥' }
    },
    dominantEmotion: 'ශාන්තිය / සන්සුන් බව (35%)',
    dominantEmotionSummary: 'ගීතයේ වැඩිපුරම ප්‍රකාශ වන්නේ හුදකලා රාත්‍රියේ සිතට දැනෙන ශාන්ත හා සන්සුන් භාවයයි.',

    difficulty: {
      level: 'මධ්‍යම මට්ටම (Intermediate)',
      levelCode: 'L2',
      badgeColor: '#00e5ff',
      explanation: 'මන්දගාමී තාල රටාව සහ සාහිත්‍යමය උපමා අඩංගු බැවින් නවක සිසුන්ට පද උච්චාරණය මධ්‍යස්ථව පහසුය.'
    },

    lyricsSample: [
      'නිහඬ රැයේ සිත අතීත මතක අතර සැරිසරයි',
      'දුර ඈත අහසේ තරු එළිය නිවුණු සඳවත සොයයි',
      'සුසුම් පවනේ මුසු වූ ගී රාවය ඔබේ නම මුමුණයි',
      'සිත නිවාලන නිසල රාත්‍රිය මට තනිකම කියාදෙයි'
    ],

    simplifiedLyrics: [
      {
        lineNo: 1,
        original: 'නිහඬ රැයේ සිත අතීත මතක අතර සැරිසරයි',
        simplified: 'නිශ්ශබ්ද රාත්‍රියේ මගේ සිත පරණ මතකයන් ගැන කල්පනා කරමින් ඇවිදියි',
        glossary: [
          { word: 'නිහඬ', meaning: 'කිසිදු ශබ්දයක් නැති නිසල බව' },
          { word: 'සැරිසරයි', meaning: 'එහා මෙහා ගමන් කරයි / මනසින් කල්පනා කරයි' }
        ]
      },
      {
        lineNo: 2,
        original: 'දුර ඈත අහසේ තරු එළිය නිවුණු සඳවත සොයයි',
        simplified: 'ඈත අහසේ තිබෙන තරු එළිය නොපෙනී ගිය සඳ සෙවීමට උත්සාහ කරයි',
        glossary: [
          { word: 'සඳවත', meaning: 'සඳ මණ්ඩලය / සඳුගේ මුහුණ' },
          { word: 'නිවුණු', meaning: 'නොපෙනී ගිය / අඳුරු වූ' }
        ]
      },
      {
        lineNo: 3,
        original: 'සුසුම් පවනේ මුසු වූ ගී රාවය ඔබේ නම මුමුණයි',
        simplified: 'හුළඟට එකතු වූ මගේ සුසුම් සහ ගීතයේ හඬ ඔබේ නම රහසින් කියයි',
        glossary: [
          { word: 'මුසු වූ', meaning: 'එකට මිශ්‍ර වූ' },
          { word: 'මුමුණයි', meaning: 'රහසින් මෙන් මෘදුව පවසයි' }
        ]
      }
    ],

    tutorKnowledge: [
      {
        question: 'මේ ගීතයේ ප්‍රධාන හැඟීම සන්සුන් බව වන්නේ ඇයි?',
        answer: 'ආයුබෝවන්! මෙම ගීතයේ සිතාරයේ මන්දගාමී නාද රටාව සහ තාලයේ නිවුණු ස්වභාවය නිසා සිතට වැඩිපුරම දැනෙන්නේ ශාන්තිය හා සන්සුන් බවයි (35%).'
      },
      {
        question: 'මෙම ගීතය ගායනා කිරීමට ආරම්භකයෙකුට පහසුද?',
        answer: 'ඔව්, මෙය මධ්‍යම මට්ටමේ (Intermediate) ගීතයකි. ස්වර පරාසය ඉතා පුළුල් නොවන බැවින් හඬ පාලනය පුහුණු වන සිසුවෙකුට මෙය ඉතා යෝග්‍ය වේ.'
      },
      {
        question: '“සැරිසරයි” යන්නෙන් කවියා අදහස් කළේ කුමක්ද?',
        answer: '“සැරිසරයි” යනු එක් තැනක නොරැඳී එහා මෙහා ඇවිදීමයි. මෙහිදී කවියා පවසන්නේ රාත්‍රියේ නිහඬතාවය තුළ සිත එක් අතීත මතකයකින් තවත් මතකයකට සංචාරය කරන බවයි.'
      }
    ]
  },
  {
    id: 'song-002',
    title: 'නින්දා නේන රාත්‍රියේ',
    englishTitle: 'Ninda Nena Rathriye',
    artist: 'ආචාර්ය පණ්ඩිත් ඩබ්.ඩී. අමරදේව',
    englishArtist: 'Dr. W.D. Amaradeva',
    category: 'සම්භාව්‍ය යුගය (Classical Golden Era)',
    duration: '04:12',
    audioFile: 'S002.mp3',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditative-flute-112284.mp3',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    tags: ['මධ්‍යම මට්ටම', 'රාගධාරී සංගීතය'],
    currentlyLearning: false,
    progress: 80,
    
    emotions: {
      sadness: { label: 'ශෝකය / විරහව', english: 'Sadness', percentage: 40, color: '#5b7fff', icon: '💧' },
      calmness: { label: 'ශාන්තිය / සන්සුන් බව', english: 'Calmness', percentage: 30, color: '#00e5ff', icon: '🍃' },
      love: { label: 'ආදරය / ප්‍රේමය', english: 'Love', percentage: 18, color: '#ff66a3', icon: '🌸' },
      fear: { label: 'භය / චකිතය', english: 'Fear', percentage: 6, color: '#a259ff', icon: '⚡' },
      happiness: { label: 'සතුට / ප්‍රීතිය', english: 'Happiness', percentage: 4, color: '#ffd166', icon: '☀️' },
      anger: { label: 'ක්‍රෝධය / කෝපය', english: 'Anger', percentage: 2, color: '#ff5c5c', icon: '🔥' }
    },
    dominantEmotion: 'ශෝකය / විරහව (40%)',
    dominantEmotionSummary: 'නින්ද නොඑන රාත්‍රියක දැනෙන හුදකලාව හා ආදරණීය මතකයන් නිසා ශෝකය ප්‍රමුඛ වේ.',
    difficulty: {
      level: 'මධ්‍යම - උසස් මට්ටම (Upper Intermediate)',
      levelCode: 'L3',
      badgeColor: '#c074ff',
      explanation: 'සූක්ෂ්ම මීර්ඩ් සහ ගමක ස්වර භාවිත වන බැවින් නිවැරදි ස්වර ස්ථාන පිළිබඳ අවධානය අවශ්‍ය වේ.'
    },
    lyricsSample: [
      'නින්දා නේන රාත්‍රියේ මේ පාළු මාවතේ',
      'පෙම් සිතුවිලි සසල වෙයි සීත සුළඟේ',
      'ඔබේ මතකය පමණි මා ළඟ රැඳී ඇත්තේ',
      'කවදාද යළි අප හමුවන්නේ සොඳුරේ'
    ],
    simplifiedLyrics: [
      {
        lineNo: 1,
        original: 'නින්දා නේන රාත්‍රියේ මේ පාළු මාවතේ',
        simplified: 'නින්ද නොඑන මේ රාත්‍රියේ තනිවූ පාරේ',
        glossary: [{ word: 'නේන', meaning: 'නොඑන / නොපැමිණෙන' }]
      }
    ],
    tutorKnowledge: [
      {
        question: 'මෙම ගීතයේ තාලය කුමක්ද?',
        answer: 'මෙය ප්‍රධාන වශයෙන් දද්රා (Dadra - මාත්‍රා 6) තාලයට අනුගතව නිමැවුණු මනරම් සංගීත නිර්මාණයකි.'
      }
    ]
  }
];

export const MOCK_USER_PROFILE = {
  name: 'ආශා පෙරේරා',
  englishName: 'Asha Perera',
  level: '7 වන මට්ටම - මධ්‍යම ශිෂ්‍ය',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  stats: {
    analyzedSongs: 12,
    quizzesPassed: 45,
    streakDays: 14,
    avgScore: '82%'
  }
};

export const SINHALA_LABELS = {
  appName: 'නාදය',
  tagline: 'සිංහල ගීත රසවින්දනය සහ ඉගෙනුම් සහායකයා',
  welcomeTitle: 'නාදයට සාදරයෙන් පිළිගනිමු',
  welcomeSubtitle: 'සිංහල සම්භාව්‍ය ගීතවල රිද්මය හා හැඟීම් හඳුනා ගැනීමට ඔබ සූදානම්ද?',
  chooseSong: 'ගීතයක් තෝරන්න',
  orUpload: 'හෝ ඔබේ ශ්‍රව්‍ය ගොනුවක් (MP3/WAV) එක් කරන්න',
  currentlyLearning: 'දැනට තෝරාගත් ගීතය',
  startAnalysis: 'විශ්ලේෂණය ආරම්භ කරන්න',
  analyzingProgress: 'ගීතයේ හැඟීම් සහ පද විශ්ලේෂණය කරමින් පවතී...',
  demoDisclaimer: '✦ මෙය පූර්වදර්ශන ආදර්ශනයකි (Demo Prototype). විශ්ලේෂණ ප්‍රතිඵල නියැදි දත්ත මත පදනම් වේ.',
  resultsTitle: 'ගීත හැඟීම් සහ පද විශ්ලේෂණ ප්‍රතිඵල',
  resultsSubtitle: 'නියැදි ගීත විශ්ලේෂණ පූර්වදර්ශනය',
  emotionBreakdown: 'හැඟීම් 6 හි ප්‍රතිශත බෙදීයාම',
  simplifiedLyrics: 'පද සරල කිරීම (පැහැදිලි සිංහලට)',
  fullLyrics: 'සම්පූර්ණ පද රචනය',
  difficultyGuidance: 'ඉගෙනුම් අපහසුතා මට්ටම',
  askTutor: 'නාද AI ගුරුතුමාගෙන් විමසන්න',
  tutorTitle: 'නාද සංගීත AI ගුරුතුමා',
  analyzeAnother: 'වෙනත් ගීතයක් විශ්ලේෂණය කරන්න',
  tabs: {
    home: 'මුල් පිටුව',
    search: 'සොයන්න',
    library: 'පුස්තකාලය',
    profile: 'පැතිකඩ'
  }
};
