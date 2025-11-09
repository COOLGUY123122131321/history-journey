# OpenAI TTS Integration

שילוב OpenAI Text-to-Speech API לאפליקציה עם תמיכה בניסוח טקסט עם Gemini.

## הגדרה

### 1. קבלת OpenAI API Key

1. היכנס ל-[OpenAI Platform](https://platform.openai.com/api-keys)
2. צור API key חדש
3. העתק את המפתח

### 2. הוספת המפתח ל-`.env.local`

צור או עדכן את הקובץ `.env.local` בשורש הפרויקט:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## שימוש

### שימוש בסיסי עם OpenAI TTS

```typescript
import { ttsService } from './services/ttsService';

// שימוש רגיל - המערכת תבחר אוטומטית את הספק הטוב ביותר
const audioData = await ttsService.requestTts("Hello, world!", user.uid);

// שימוש מפורש ב-OpenAI TTS
const audioData = await ttsService.requestTts("Hello, world!", user.uid, {
  useOpenAI: true
});
```

### שימוש עם ניסוח Gemini + OpenAI TTS

```typescript
import { ttsService } from './services/ttsService';

// הפונקציה generateAndSpeak משתמשת ב-Gemini לניסוח ואז OpenAI ל-TTS
const audioData = await ttsService.generateAndSpeak(
  "Welcome traveler! Today you'll learn about the Roman Empire.",
  user.uid,
  {
    voice: 'alloy', // אפשר גם: 'echo', 'fable', 'onyx', 'nova', 'shimmer'
    model: 'tts-1', // או 'tts-1-hd' לאיכות גבוהה יותר
    speed: 1.0 // 0.25 עד 4.0
  }
);
```

### שימוש עם ניסוח Gemini דרך options

```typescript
// שימוש ב-refineWithGemini לניסוח אוטומטי לפני TTS
const audioData = await ttsService.requestTts(
  "Welcome traveler! Today you'll learn about the Roman Empire.",
  user.uid,
  {
    refineWithGemini: true,
    useOpenAI: true
  }
);
```

### שימוש ישיר בשירות OpenAI TTS

```typescript
import { generateOpenAITTS, generateAndSpeak } from './services/openaiTtsService';

// TTS ישיר ללא ניסוח
const audioData = await generateOpenAITTS("Hello, world!", user.uid, {
  voice: 'alloy',
  model: 'tts-1',
  speed: 1.0
});

// TTS עם ניסוח Gemini
const audioData = await generateAndSpeak(
  "Welcome traveler!",
  user.uid,
  {
    refineWithGemini: true,
    geminiModel: 'gemini-1.5-pro-latest',
    openaiConfig: {
      voice: 'alloy',
      model: 'tts-1-hd',
      speed: 1.0
    }
  }
);
```

## קולות זמינים

| קול | תיאור |
|-----|-------|
| `alloy` | קול מאוזן וניטרלי |
| `echo` | קול ברור ובטוח |
| `fable` | קול חם ואקספרסיבי |
| `onyx` | קול עמוק וסמכותי |
| `nova` | קול בהיר ואנרגטי |
| `shimmer` | קול רך ועדין |

## מודלים

- `tts-1` - מהיר יותר, איכות טובה
- `tts-1-hd` - איכות גבוהה יותר, איטי יותר

## תכונות

✅ **ניסוח אוטומטי** - Gemini מנסח את הטקסט לפני המרה לקול  
✅ **שמירה אוטומטית** - קבצי אודיו נשמרים ב-Firebase Storage  
✅ **Caching** - תוכן זהה נשמר במטמון ונשלף מהר  
✅ **Fallback** - נופל חזרה לספקים אחרים אם OpenAI לא זמין  
✅ **Rate Limiting** - תור עיבוד מונע שגיאות rate limit  

## סדר עדיפויות

המערכת בוחרת ספק TTS לפי הסדר הבא:

1. **OpenAI TTS** (אם `useOpenAI` או `refineWithGemini` מוגדר)
2. **Google Cloud TTS** (אם המפתח מוגדר)
3. **OpenAI TTS** (אם המפתח מוגדר)
4. **Gemini TTS** (fallback)

## דוגמה בקומפוננטה React

```tsx
import { useState } from 'react';
import { ttsService } from '../services/ttsService';
import { playAudio } from '../services/audioService';
import { useAuth } from '../context/AuthContext';

const NarrationButton = ({ text }: { text: string }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // שימוש עם ניסוח Gemini + OpenAI TTS
      const audioData = await ttsService.generateAndSpeak(
        text,
        user.uid,
        { voice: 'alloy' }
      );
      
      if (audioData) {
        await playAudio(audioData);
      }
    } catch (error) {
      console.error('Failed to play narration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handlePlay} disabled={isLoading}>
      {isLoading ? '⏳ Loading...' : '🔊 Play narration'}
    </button>
  );
};
```

## מבנה קבצים

- `services/openaiTtsService.ts` - שירות OpenAI TTS
- `services/ttsService.ts` - שירות TTS ראשי עם fallback
- `services/cacheService.ts` - מטמון ושמירה ב-Firebase Storage

## הערות

- קבצי האודיו נשמרים ב-Firebase Storage תחת `tts/openai/`
- הקבצים נשמרים בפורמט MP3
- המערכת משתמשת במטמון כדי למנוע יצירת אודיו זהה פעמיים
- ב-localhost, הקבצים לא נשמרים ב-Storage (CORS) אבל האודיו עדיין עובד
- ניסוח עם Gemini דורש גם מפתח Gemini API (`GEMINI_API_KEY`)

