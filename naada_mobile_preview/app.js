/**
 * NAADHA (නාදය) - Mobile Prototype JavaScript
 * High-fidelity interactive prototype for Sinhala song emotion analysis and lyrics normalization.
 * 
 * NOTE: All backend connections and model inferences are simulated with realistic mock data.
 */

// Mock Dataset for Sinhala Songs
const MOCK_DATA = [
  {
    id: 'song-001',
    title: 'නිහඬ රැයේ සිහින',
    artist: 'පණ්ඩිත් ඩබ්.ඩී. අමරදේව සහ වාද්‍ය මණ්ඩලය',
    category: 'සම්භාව්‍ය ගීත (Sinhala Classical)',
    duration: '03:45',
    durationSec: 225,
    fileName: 'S001_Nihanda_Raye.mp3',
    fileSize: '3.8 MB',
    coverImg: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    tags: ['මධ්‍යම මට්ටම', 'ගායනය සහ සිතාරය'],
    
    // Emotion percentages STRICTLY add up to 100%
    emotions: [
      { key: 'calmness', label: 'ශාන්තිය / සන්සුන් බව', english: 'Calmness', percentage: 35, color: '#00e5ff', icon: '🍃' },
      { key: 'sadness', label: 'ශෝකය / විරහව', english: 'Sadness', percentage: 25, color: '#5b7fff', icon: '💧' },
      { key: 'love', label: 'ආදරය / ප්‍රේමය', english: 'Love', percentage: 20, color: '#ff66a3', icon: '🌸' },
      { key: 'happiness', label: 'සතුට / ප්‍රීතිය', english: 'Happiness', percentage: 10, color: '#ffd166', icon: '☀️' },
      { key: 'fear', label: 'භය / චකිතය', english: 'Fear', percentage: 6, color: '#a259ff', icon: '⚡' },
      { key: 'anger', label: 'ක්‍රෝධය / කෝපය', english: 'Anger', percentage: 4, color: '#ff5c5c', icon: '🔥' }
    ],
    dominantEmotionSummary: 'ගීතයේ වැඩිපුරම ප්‍රකාශ වන්නේ හුදකලා රාත්‍රියේ සිතට දැනෙන ශාන්ත හා සන්සුන් භාවයයි (35%).',

    difficulty: {
      level: 'මධ්‍යම මට්ටම (L2)',
      explanation: 'මන්දගාමී තාල රටාව සහ සාහිත්‍යමය උපමා අඩංගු බැවින් නවක සිසුන්ට පද උච්චාරණය මධ්‍යස්ථව පහසුය.'
    },

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

    lyricsSample: [
      'නිහඬ රැයේ සිත අතීත මතක අතර සැරිසරයි',
      'දුර ඈත අහසේ තරු එළිය නිවුණු සඳවත සොයයි',
      'සුසුම් පවනේ මුසු වූ ගී රාවය ඔබේ නම මුමුණයි',
      'සිත නිවාලන නිසල රාත්‍රිය මට තනිකම කියාදෙයි',
      'පාළු මාවතේ සඳ එළිය මතක සිතුවම් අඳියි...'
    ],

    tutorQnA: [
      {
        q: 'මේ ගීතයේ ප්‍රධාන හැඟීම සන්සුන් බව වන්නේ ඇයි?',
        a: 'ආයුබෝවන්! මෙම ගීතයේ සිතාරයේ මන්දගාමී නාද රටාව සහ තාලයේ නිවුණු ස්වභාවය නිසා සිතට වැඩිපුරම දැනෙන්නේ ශාන්තිය හා සන්සුන් බවයි (35%).'
      },
      {
        q: 'මෙම ගීතය ගායනා කිරීමට ආරම්භකයෙකුට පහසුද?',
        a: 'ඔව්, මෙය මධ්‍යම මට්ටමේ (L2) නිර්මාණයකි. ස්වර පරාසය ඉතා පුළුල් නොවන බැවින් හඬ පාලනය පුහුණු වන සිසුවෙකුට මෙය ඉතා යෝග්‍ය වේ.'
      },
      {
        q: '“සැරිසරයි” යන්නෙන් කවියා අදහස් කළේ කුමක්ද?',
        a: '“සැරිසරයි” යනු එක් තැනක නොරැඳී එහා මෙහා ඇවිදීමයි. මෙහිදී කවියා පවසන්නේ රාත්‍රියේ නිහඬතාවය තුළ සිත එක් අතීත මතකයකින් තවත් මතකයකට සංචාරය කරන බවයි.'
      }
    ]
  },
  {
    id: 'song-002',
    title: 'නින්දා නේන රාත්‍රියේ',
    artist: 'ආචාර්ය පණ්ඩිත් ඩබ්.ඩී. අමරදේව',
    category: 'සම්භාව්‍ය යුගය (Classical Golden Era)',
    duration: '04:12',
    durationSec: 252,
    fileName: 'S002_Ninda_Nena.mp3',
    fileSize: '4.2 MB',
    coverImg: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    tags: ['මධ්‍යම මට්ටම', 'රාගධාරී සංගීතය'],

    // Sum is exactly 100%
    emotions: [
      { key: 'sadness', label: 'ශෝකය / විරහව', english: 'Sadness', percentage: 40, color: '#5b7fff', icon: '💧' },
      { key: 'calmness', label: 'ශාන්තිය / සන්සුන් බව', english: 'Calmness', percentage: 30, color: '#00e5ff', icon: '🍃' },
      { key: 'love', label: 'ආදරය / ප්‍රේමය', english: 'Love', percentage: 18, color: '#ff66a3', icon: '🌸' },
      { key: 'fear', label: 'භය / චකිතය', english: 'Fear', percentage: 6, color: '#a259ff', icon: '⚡' },
      { key: 'happiness', label: 'සතුට / ප්‍රීතිය', english: 'Happiness', percentage: 4, color: '#ffd166', icon: '☀️' },
      { key: 'anger', label: 'ක්‍රෝධය / කෝපය', english: 'Anger', percentage: 2, color: '#ff5c5c', icon: '🔥' }
    ],
    dominantEmotionSummary: 'නින්ද නොඑන රාත්‍රියක දැනෙන හුදකලාව හා ආදරණීය මතකයන් නිසා ශෝකය ප්‍රමුඛ වේ (40%).',

    difficulty: {
      level: 'මධ්‍යම - උසස් මට්ටම (L3)',
      explanation: 'සූක්ෂ්ම මීර්ඩ් සහ ගමක ස්වර භාවිත වන බැවින් නිවැරදි ස්වර ස්ථාන පිළිබඳ අවධානය අවශ්‍ය වේ.'
    },

    simplifiedLyrics: [
      {
        lineNo: 1,
        original: 'නින්දා නේන රාත්‍රියේ මේ පාළු මාවතේ',
        simplified: 'නින්ද නොඑන මේ රාත්‍රියේ තනිවූ පාරේ මා තනිවී සිටියි',
        glossary: [{ word: 'නේන', meaning: 'නොඑන / නොපැමිණෙන' }]
      },
      {
        lineNo: 2,
        original: 'පෙම් සිතුවිලි සසල වෙයි සීත සුළඟේ',
        simplified: 'සීතල සුළඟ හමන විට ආදරණීය සිතුවිලි සිත තුළ කැළඹෙයි',
        glossary: [{ word: 'සසල', meaning: 'සෙලවෙන / කැළඹෙන' }]
      }
    ],

    lyricsSample: [
      'නින්දා නේන රාත්‍රියේ මේ පාළු මාවතේ',
      'පෙම් සිතුවිලි සසල වෙයි සීත සුළඟේ',
      'ඔබේ මතකය පමණි මා ළඟ රැඳී ඇත්තේ',
      'කවදාද යළි අප හමුවන්නේ සොඳුරේ...'
    ],

    tutorQnA: [
      {
        q: 'මෙම ගීතයේ තාලය කුමක්ද?',
        a: 'මෙය ප්‍රධාන වශයෙන් දද්රා (Dadra - මාත්‍රා 6) තාලයට අනුගතව නිමැවුණු මනරම් සම්භාව්‍ය සංගීත නිර්මාණයකි.'
      }
    ]
  },
  {
    id: 'song-003',
    title: 'මහ වැස්සක පෙරනිමිති',
    artist: 'විශාරද සනත් නන්දසිරි',
    category: 'සම්භාව්‍ය ගීත (Classical)',
    duration: '03:58',
    durationSec: 238,
    fileName: 'S003_Maha_Wessaka.mp3',
    fileSize: '3.9 MB',
    coverImg: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    tags: ['උසස් මට්ටම', 'තබ්ලා සහ වයලීනය'],

    emotions: [
      { key: 'fear', label: 'භය / චකිතය', english: 'Fear', percentage: 32, color: '#a259ff', icon: '⚡' },
      { key: 'sadness', label: 'ශෝකය / විරහව', english: 'Sadness', percentage: 28, color: '#5b7fff', icon: '💧' },
      { key: 'calmness', label: 'ශාන්තිය / සන්සුන් බව', english: 'Calmness', percentage: 20, color: '#00e5ff', icon: '🍃' },
      { key: 'anger', label: 'ක්‍රෝධය / කෝපය', english: 'Anger', percentage: 10, color: '#ff5c5c', icon: '🔥' },
      { key: 'happiness', label: 'සතුට / ප්‍රීතිය', english: 'Happiness', percentage: 6, color: '#ffd166', icon: '☀️' },
      { key: 'love', label: 'ආදරය / ප්‍රේමය', english: 'Love', percentage: 4, color: '#ff66a3', icon: '🌸' }
    ],
    dominantEmotionSummary: 'අහස කළුවර වී මහ වැස්සක් ළඟා වන විට දැනෙන අද්භූත චකිතය හා භීතිය ප්‍රකාශ වේ (32%).',

    difficulty: {
      level: 'උසස් මට්ටම (Advanced - L4)',
      explanation: 'තීව්‍ර ස්වර හා වේගවත් රාග සංචාර අඩංගු බැවින් ඉහළ ගායන අභ්‍යාසයක් අවශ්‍ය වේ.'
    },

    simplifiedLyrics: [
      {
        lineNo: 1,
        original: 'මහ වැස්සක පෙරනිමිති දුටු විහඟුන් කැදලි සොයයි',
        simplified: 'විශාල වැස්සක් එන බව දැනගත් කුරුල්ලන් තම කූඩු සොයා පියාසර කරයි',
        glossary: [{ word: 'විහඟුන්', meaning: 'කුරුල්ලන්' }, { word: 'කැදලි', meaning: 'කූඩු' }]
      }
    ],

    lyricsSample: [
      'මහ වැස්සක පෙරනිමිති දුටු විහඟුන් කැදලි සොයයි',
      'ගිගුරුම් හඬ අහස් කුස දෙදරවා හඬනගයි',
      'සීත සුළං රැළි ගත සලිත කරවයි...'
    ],

    tutorQnA: [
      {
        q: 'මෙම ගීතයේ භය හා චකිතය වැඩිවීමට හේතුව කුමක්ද?',
        a: 'අකුණු සහ ගිගුරුම් අනුකරණය කරන තබ්ලා හා බෙර වාදන ශෛලිය සහ මීඝ රාගයේ ස්වර ආශ්‍රයෙන් ගීතයේ තේමාව නිර්මාණය කර තිබීමයි.'
      }
    ]
  }
];

// App State
let currentSong = MOCK_DATA[0];
let isPlaying = false;
let playbackSeconds = 84; // 01:24
let playbackTimer = null;
let currentScreen = 'selection'; // 'selection' | 'results'
let currentResultsTab = 'emotions'; // 'emotions' | 'simplified' | 'lyrics'
let uploadedFile = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  renderSongSelectionDetails();
  renderSuggestedSongs();
  renderResultsScreen();
  setupDragAndDrop();
  updateClock();
  setInterval(updateClock, 30000);
});

// Update Simulated Mobile Status Bar Clock
function updateClock() {
  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const clockEl = document.getElementById('statusTime');
  if (clockEl) clockEl.textContent = `${hrs}:${mins}`;
}

// -----------------------------------------------------------------------------
// SCREEN 1: SONG SELECTION & AUDIO UPLOAD
// -----------------------------------------------------------------------------

function renderSongSelectionDetails() {
  document.getElementById('selectedSongTitle').textContent = currentSong.title;
  document.getElementById('selectedSongArtist').textContent = currentSong.artist;
  document.getElementById('durationLabel').textContent = currentSong.duration;
  document.getElementById('currentTimeLabel').textContent = formatTime(playbackSeconds);

  // Update Hero Card Tags
  const tagsContainer = document.getElementById('selectedSongTags');
  tagsContainer.innerHTML = currentSong.tags
    .map(t => `<span class="hero-tag">${t}</span>`)
    .join('');

  // Update Hero Background image
  const heroOverlay = document.querySelector('.hero-bg-overlay');
  if (heroOverlay) {
    heroOverlay.style.backgroundImage = `url('${currentSong.coverImg}')`;
  }

  // Update File Status Card
  const fileCard = document.getElementById('fileStatusCard');
  const fileNameEl = document.getElementById('displayFileName');
  const fileMetaEl = document.getElementById('displayFileMeta');
  
  if (uploadedFile) {
    fileCard.style.display = 'flex';
    fileNameEl.textContent = uploadedFile.name;
    fileMetaEl.textContent = `${uploadedFile.sizeStr} • පරිශීලක ශ්‍රව්‍ය ගොනුව තෝරාගන්නා ලදී`;
  } else {
    fileCard.style.display = 'flex';
    fileNameEl.textContent = currentSong.fileName;
    fileMetaEl.textContent = `${currentSong.fileSize} • ශ්‍රව්‍ය ගොනුව සුදානම්`;
  }

  // Clear any existing alert
  document.getElementById('unsupportedFileAlert').style.display = 'none';
}

function renderSuggestedSongs() {
  const container = document.getElementById('suggestedSongsList');
  if (!container) return;

  container.innerHTML = MOCK_DATA.map(song => `
    <div class="song-card-item ${song.id === currentSong.id ? 'selected' : ''}" onclick="selectSongById('${song.id}')">
      <img src="${song.coverImg}" alt="${song.title}" class="song-card-img">
      <h4 class="song-card-title">${song.title}</h4>
      <p class="song-card-artist">${song.artist}</p>
    </div>
  `).join('');
}

function selectSongById(songId) {
  const found = MOCK_DATA.find(s => s.id === songId);
  if (!found) return;
  currentSong = found;
  uploadedFile = null;
  playbackSeconds = 0;
  pauseAudio();
  renderSongSelectionDetails();
  renderSuggestedSongs();
  renderResultsScreen();
  openToast(`තෝරාගත් ගීතය: ${currentSong.title}`);
}

// File Drag & Drop + Input
function setupDragAndDrop() {
  const dropzone = document.getElementById('uploadDropzone');
  if (!dropzone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-over');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processSelectedFile(files[0]);
    }
  });
}

function triggerFileInput() {
  const fileInput = document.getElementById('realAudioInput');
  if (fileInput) fileInput.click();
}

function handleFileSelected(event) {
  const files = event.target.files;
  if (files && files.length > 0) {
    processSelectedFile(files[0]);
  }
}

function processSelectedFile(file) {
  const errorAlert = document.getElementById('unsupportedFileAlert');
  const validExtensions = ['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg'];
  const ext = file.name.split('.').pop().toLowerCase();

  // Validate Audio File Format
  if (!file.type.startsWith('audio/') && !validExtensions.includes(ext)) {
    // Show error state
    errorAlert.style.display = 'flex';
    openToast('අනුමත නොකරන ලද ගොනුවකි!');
    return;
  }

  // Format size
  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
  uploadedFile = {
    name: file.name,
    sizeStr: `${sizeMB} MB`,
    rawFile: file
  };

  errorAlert.style.display = 'none';
  renderSongSelectionDetails();
  openToast(`ශ්‍රව්‍ය ගොනුව එක් කරන ලදී: ${file.name}`);
}

function clearSelectedFile() {
  uploadedFile = null;
  document.getElementById('realAudioInput').value = '';
  document.getElementById('unsupportedFileAlert').style.display = 'none';
  renderSongSelectionDetails();
  openToast('තෝරාගත් ගොනුව ඉවත් කරන ලදී');
}

// Audio Playback Simulation
function toggleAudioPlayback() {
  if (isPlaying) {
    pauseAudio();
  } else {
    playAudio();
  }
}

function playAudio() {
  isPlaying = true;
  document.getElementById('heroPlayBtn')?.classList.add('playing');
  const playIcon = document.getElementById('heroPlayIcon');
  if (playIcon) playIcon.textContent = '❚❚';

  const miniPlayIcon = document.getElementById('resultsMiniPlayIcon');
  if (miniPlayIcon) miniPlayIcon.textContent = '❚❚';

  document.getElementById('soundWaves')?.classList.add('active');

  clearInterval(playbackTimer);
  playbackTimer = setInterval(() => {
    playbackSeconds++;
    if (playbackSeconds > currentSong.durationSec) {
      playbackSeconds = 0;
      pauseAudio();
    }
    updatePlaybackUI();
  }, 1000);
  updatePlaybackUI();
}

function pauseAudio() {
  isPlaying = false;
  document.getElementById('heroPlayBtn')?.classList.remove('playing');
  const playIcon = document.getElementById('heroPlayIcon');
  if (playIcon) playIcon.textContent = '▶';

  const miniPlayIcon = document.getElementById('resultsMiniPlayIcon');
  if (miniPlayIcon) miniPlayIcon.textContent = '▶';

  document.getElementById('soundWaves')?.classList.remove('active');
  clearInterval(playbackTimer);
}

function scrubAudio(e) {
  const track = e.currentTarget;
  const rect = track.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
  playbackSeconds = Math.floor(ratio * currentSong.durationSec);
  updatePlaybackUI();
}

function updatePlaybackUI() {
  const ratio = (playbackSeconds / currentSong.durationSec) * 100;
  const formatted = formatTime(playbackSeconds);

  // Screen 1 UI
  const fill1 = document.getElementById('audioProgressFill');
  if (fill1) fill1.style.width = `${ratio}%`;
  const time1 = document.getElementById('currentTimeLabel');
  if (time1) time1.textContent = formatted;

  // Screen 2 UI
  const fill2 = document.getElementById('resultsProgressFill');
  if (fill2) fill2.style.width = `${ratio}%`;
  const time2 = document.getElementById('resultsCurrentTime');
  if (time2) time2.textContent = formatted;
}

function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// -----------------------------------------------------------------------------
// ANALYSIS TRIGGER & TRANSITION TO SCREEN 2
// -----------------------------------------------------------------------------

function startSongAnalysis() {
  const btn = document.getElementById('btnStartAnalysis');
  const btnText = document.getElementById('btnStartAnalysisText');
  const loadingBox = document.getElementById('analysisLoadingBox');

  btn.style.opacity = '0.5';
  btn.style.pointerEvents = 'none';
  btnText.textContent = 'විශ්ලේෂණය වෙමින් පවතී...';
  loadingBox.style.display = 'flex';
  loadingBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Simulate analysis pipeline (~1.2s)
  setTimeout(() => {
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'all';
    btnText.textContent = 'විශ්ලේෂණය ආරම්භ කරන්න';
    loadingBox.style.display = 'none';

    renderResultsScreen();
    navigateToScreen('results');
    openToast('විශ්ලේෂණය සාර්ථකයි! (Mock Results)');
  }, 1200);
}

function goToResultsWithTab(tabKey) {
  currentResultsTab = tabKey;
  renderResultsScreen();
  navigateToScreen('results');
}

// -----------------------------------------------------------------------------
// SCREEN 2: EMOTION ANALYSIS RESULTS & LYRICS
// -----------------------------------------------------------------------------

function renderResultsScreen() {
  document.getElementById('resultsSongTitle').textContent = currentSong.title;
  document.getElementById('resultsArtist').textContent = currentSong.artist;
  document.getElementById('resultsCoverImg').src = currentSong.coverImg;
  document.getElementById('resultsDuration').textContent = currentSong.duration;
  document.getElementById('resultsCurrentTime').textContent = formatTime(playbackSeconds);

  // Top stats
  const domEmotion = currentSong.emotions[0];
  document.getElementById('statDominantEmotion').textContent = `${domEmotion.percentage}%`;
  document.getElementById('statDifficultyLevel').textContent = currentSong.difficulty.level.split(' ')[0];

  // Summary & Difficulty
  document.getElementById('emotionDominantSummary').textContent = currentSong.dominantEmotionSummary;
  document.getElementById('diffBadgeText').textContent = currentSong.difficulty.level;
  document.getElementById('diffExplanationText').textContent = currentSong.difficulty.explanation;

  // 1. Render 6 Emotion Bars (Sum to 100%)
  const emotionsList = document.getElementById('emotionsBarList');
  let totalPercent = 0;
  emotionsList.innerHTML = currentSong.emotions.map(item => {
    totalPercent += item.percentage;
    return `
      <div class="emotion-bar-item">
        <div class="emotion-label-row">
          <div class="emotion-label-left">
            <span class="emotion-icon">${item.icon}</span>
            <span class="emotion-si-name">${item.label}</span>
            <span class="emotion-en-name">(${item.english})</span>
          </div>
          <span class="emotion-pct-val" style="color: ${item.color}">${item.percentage}%</span>
        </div>
        <div class="emotion-progress-track">
          <div class="emotion-progress-bar" style="width: ${item.percentage}%; background-color: ${item.color};"></div>
        </div>
      </div>
    `;
  }).join('');

  // 2. Render Simplified Lyrics (Normalization)
  const lyricsCompList = document.getElementById('lyricsComparisonList');
  lyricsCompList.innerHTML = currentSong.simplifiedLyrics.map(line => `
    <div class="lyric-compare-box">
      <span class="line-no-badge">පද පේළිය 0${line.lineNo}</span>
      <div class="compare-block original">
        <span class="block-tag">සම්භාව්‍ය පද රචනය:</span>
        <p class="block-text">${line.original}</p>
      </div>
      <div class="compare-arrow">↓ පැහැදිලි සිංහලට</div>
      <div class="compare-block simplified">
        <span class="block-tag">සරල කළ පදමාලාව:</span>
        <p class="block-text">${line.simplified}</p>
      </div>
      ${line.glossary ? `
        <div class="vocab-chips-section">
          <span class="vocab-title">වචන අරුත් (Vocabulary):</span>
          <div class="vocab-pills-row">
            ${line.glossary.map(v => `
              <div class="vocab-chip">
                <span class="word">${v.word}</span>
                <span class="meaning">: ${v.meaning}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `).join('');

  // 3. Render Readable Full Lyrics
  const lyricsSheet = document.getElementById('readableLyricsSheet');
  lyricsSheet.innerHTML = currentSong.lyricsSample.map(line => `
    <p class="lyric-sheet-line">${line}</p>
  `).join('');

  // Setup Tutor Prompts
  renderTutorPrompts();

  // Switch to current active tab
  switchResultsTab(currentResultsTab);
}

function switchResultsTab(tabKey) {
  currentResultsTab = tabKey;
  
  // Segmented Buttons
  document.getElementById('tabBtnEmotions')?.classList.toggle('active', tabKey === 'emotions');
  document.getElementById('tabBtnSimplified')?.classList.toggle('active', tabKey === 'simplified');
  document.getElementById('tabBtnLyrics')?.classList.toggle('active', tabKey === 'lyrics');

  // Panels
  document.getElementById('panelEmotions')?.classList.toggle('active', tabKey === 'emotions');
  document.getElementById('panelSimplified')?.classList.toggle('active', tabKey === 'simplified');
  document.getElementById('panelLyrics')?.classList.toggle('active', tabKey === 'lyrics');
}

function goBackToSelection() {
  navigateToScreen('selection');
}

// -----------------------------------------------------------------------------
// NAVIGATION & SCREEN SWITCHING
// -----------------------------------------------------------------------------

function navigateToScreen(screenName) {
  currentScreen = screenName;
  const screenSelection = document.getElementById('screenSelection');
  const screenResults = document.getElementById('screenResults');

  if (screenName === 'results') {
    screenSelection.classList.remove('active');
    screenResults.classList.add('active');
    screenResults.querySelector('.scrollable-body')?.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    screenResults.classList.remove('active');
    screenSelection.classList.add('active');
    screenSelection.querySelector('.scrollable-body')?.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function switchMainTab(tab) {
  if (tab === 'home') {
    navigateToScreen('selection');
  } else if (tab === 'results') {
    renderResultsScreen();
    navigateToScreen('results');
  } else if (tab === 'profile') {
    openToast('පැතිකඩ (Profile) - ආශා පෙරේරා (Level 7)');
  }
}

function toggleScreenDirect() {
  if (currentScreen === 'selection') {
    renderResultsScreen();
    navigateToScreen('results');
  } else {
    navigateToScreen('selection');
  }
}

// -----------------------------------------------------------------------------
// AI MUSIC TUTOR CONVERSATION
// -----------------------------------------------------------------------------

function openTutorModal() {
  const overlay = document.getElementById('tutorModalOverlay');
  overlay.classList.add('active');
}

function closeTutorModal() {
  const overlay = document.getElementById('tutorModalOverlay');
  overlay.classList.remove('active');
}

function closeTutorModalOnBg(e) {
  if (e.target.id === 'tutorModalOverlay') {
    closeTutorModal();
  }
}

function renderTutorPrompts() {
  const container = document.getElementById('tutorQuickPrompts');
  if (!container) return;

  container.innerHTML = currentSong.tutorQnA.map((item, idx) => `
    <button class="prompt-btn" onclick="selectTutorPrompt(${idx})">
      ❓ ${item.q}
    </button>
  `).join('');
}

function selectTutorPrompt(idx) {
  const item = currentSong.tutorQnA[idx];
  if (!item) return;

  appendUserMessage(item.q);
  setTimeout(() => {
    appendTutorMessage(item.a);
  }, 400);
}

function handleTutorKey(e) {
  if (e.key === 'Enter') {
    sendTutorQuestion();
  }
}

function sendTutorQuestion() {
  const input = document.getElementById('tutorTextInput');
  const text = input.value.trim();
  if (!text) return;

  appendUserMessage(text);
  input.value = '';

  setTimeout(() => {
    // Generate realistic Sinhala music response
    let answer = `“${currentSong.title}” ගීතය සම්බන්ධ ඔබේ ප්‍රශ්නය ඉතා වැදගත්ය. මෙම ගීතයේ තාලය, රාග ලක්ෂණ සහ භාවයන් සංගීත සිසුවෙකුට ඉගෙනුමට ඉතා යෝග්‍ය වේ. (ආදර්ශන පිළිතුර)`;
    if (text.includes('රාග') || text.includes('තාල')) {
      answer = `මෙම නිර්මාණයේ දද්රා තාලය සහ සාම්ප්‍රදායික උතුරු ඉන්දීය රාගධාරී ආභාෂය කැපී පෙනේ.`;
    } else if (text.includes('හැඟීම්') || text.includes('භාවය')) {
      answer = `ගීතයේ වැඩිපුරම ඇත්තේ ${currentSong.emotions[0].label} (${currentSong.emotions[0].percentage}%) වන අතර විරහ ශෝකයද ප්‍රබලව දැනේ.`;
    }
    appendTutorMessage(answer);
  }, 600);
}

function appendUserMessage(text) {
  const body = document.getElementById('tutorMessagesContainer');
  const div = document.createElement('div');
  div.className = 'tutor-msg user-bubble';
  div.textContent = text;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function appendTutorMessage(text) {
  const body = document.getElementById('tutorMessagesContainer');
  const div = document.createElement('div');
  div.className = 'tutor-msg tutor-bubble';
  div.innerHTML = `<p>${text}</p>`;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

// -----------------------------------------------------------------------------
// UTILITIES & VIEWPORT SWITCHER
// -----------------------------------------------------------------------------

function setDeviceView(mode) {
  const wrapper = document.getElementById('deviceWrapper');
  const btnPhone = document.getElementById('btnPhoneView');
  const btnResponsive = document.getElementById('btnResponsiveView');

  if (mode === 'responsive') {
    wrapper.classList.add('responsive-mode');
    btnResponsive.classList.add('active');
    btnPhone.classList.remove('active');
  } else {
    wrapper.classList.remove('responsive-mode');
    btnPhone.classList.add('active');
    btnResponsive.classList.remove('active');
  }
}

function openToast(message) {
  const toast = document.getElementById('toastMessage');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}
