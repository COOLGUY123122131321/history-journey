# Google Cloud Text-to-Speech Integration

שילוב Google Cloud Text-to-Speech API לאפליקציה עם שמירה אוטומטית ב-Firebase Storage.

## הגדרה

### 1. הפעלת Text-to-Speech API ב-Google Cloud Console

1. היכנס ל-[Google Cloud Console](https://console.cloud.google.com/)
2. בחר את הפרויקט שלך
3. עבור ל-**APIs & Services** > **Library**
4. חפש **Cloud Text-to-Speech API**
5. לחץ על **Enable**

### 2. יצירת API Key

1. עבור ל-**APIs & Services** > **Credentials**
2. לחץ על **Create Credentials** > **API Key**
3. העתק את המפתח שנוצר
4. (מומלץ) הגבל את המפתח לשימוש ב-Text-to-Speech API בלבד:
   - לחץ על המפתח שנוצר
   - ב-**API restrictions**, בחר **Restrict key**
   - בחר **Cloud Text-to-Speech API**

### 3. הוספת המפתח ל-`.env.local`

צור או עדכן את הקובץ `.env.local` בשורש הפרויקט:

```env
GOOGLE_CLOUD_TTS_API_KEY=your_api_key_here
```

## שימוש

השירות משתמש אוטומטית ב-Google Cloud TTS אם המפתח מוגדר, אחרת הוא נופל חזרה ל-Gemini TTS.

```typescript
import { ttsService } from './services/ttsService';

// השימוש זהה לבעבר - השירות בוחר אוטומטית את הספק הטוב ביותר
const audioData = await ttsService.requestTts("Hello, world!", user.uid);
```

## תכונות

✅ **איכות גבוהה** - קול יציב ואיכותי כמו אפליקציות לימוד מקצועיות  
✅ **שמירה אוטומטית** - קבצי אודיו נשמרים ב-Firebase Storage כמו סרטונים  
✅ **Caching** - תוכן זהה נשמר במטמון ונשלף מהר  
✅ **Fallback** - נופל חזרה ל-Gemini TTS אם Google Cloud TTS לא זמין  
✅ **Rate Limiting** - תור עיבוד מונע שגיאות rate limit  

## התאמה אישית

אפשר לשנות את הקול והשפה:

```typescript
import { generateGoogleCloudTTS, GOOGLE_CLOUD_TTS_VOICES } from './services/googleCloudTtsService';

const audioData = await generateGoogleCloudTTS(
  "Hello, world!",
  user.uid,
  {
    languageCode: 'en-US',
    voiceName: 'en-US-Wavenet-A', // קול WaveNet איכותי יותר
    audioEncoding: 'MP3',
    speakingRate: 1.0,
    pitch: 0.0,
  }
);
```

### קולות זמינים

ראה `GOOGLE_CLOUD_TTS_VOICES` ב-`services/googleCloudTtsService.ts` לרשימת כל הקולות הזמינים.

## מבנה קבצים

- `services/googleCloudTtsService.ts` - שירות Google Cloud TTS
- `services/ttsService.ts` - שירות TTS ראשי עם fallback
- `services/cacheService.ts` - מטמון ושמירה ב-Firebase Storage

## הערות

- קבצי האודיו נשמרים ב-Firebase Storage תחת `tts/google-cloud/`
- הקבצים נשמרים בפורמט MP3
- המערכת משתמשת במטמון כדי למנוע יצירת אודיו זהה פעמיים
- ב-localhost, הקבצים לא נשמרים ב-Storage (CORS) אבל האודיו עדיין עובד

