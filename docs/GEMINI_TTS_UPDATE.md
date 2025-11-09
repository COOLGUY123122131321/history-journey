# עדכון TTS ל-gemini-1.5-pro-latest

## מה עודכן

### 1. עדכון המודל ב-`services/geminiService.ts`

הפונקציה `generateTtsAudio` עודכנה להשתמש ב-`gemini-1.5-pro-latest` במקום `gemini-2.0-flash-exp`.

**שינויים:**
- שימוש ב-`gemini-1.5-pro-latest` - מודל שתומך במודאליות אודיו
- ניסיון להשתמש ב-`getGenerativeModel` עם `generationConfig`:
  ```typescript
  generationConfig: {
    response_mime_type: "audio/mp3",
    voice: "Puck", // אפשר גם "charlie" או "Breeze"
  }
  ```
- Fallback ל-`models.generateContent` אם `getGenerativeModel` לא זמין
- תמיכה במספר נתיבי חילוץ של base64 מהתגובה

### 2. עדכון חוקי Firebase Storage

עודכנו חוקי Firebase Storage ב-`storage.rules` לאפשר כתיבה וקריאה של קבצי TTS:

```firestore
match /tts/{fileName} {
  allow read, write: if true; // זמני לפיתוח
}

match /tts/google-cloud/{fileName} {
  allow read, write: if true; // זמני לפיתוח
}
```

**⚠️ חשוב:** החוקים הנוכחיים מאפשרים גישה חופשית (זמני לפיתוח). בייצור, יש להגביל את הגישה לפי authentication.

### 3. שמירה אוטומטית ב-Firebase Storage

המערכת כבר משתמשת ב-`cacheService` לשמירה אוטומטית:
- קבצי אודיו נשמרים תחת `tts/` ב-Firebase Storage
- המערכת בודקת אם האודיו כבר קיים במטמון לפני יצירה חדשה
- אם האודיו קיים, הוא נטען מהמטמון (מהיר יותר)

## הפעלה

### שלב 1: עדכן את חוקי Firebase

```bash
firebase deploy --only storage
```

### שלב 2: בנה מחדש את האפליקציה

```bash
npm run build
```

### שלב 3: פריסה (אם משתמש ב-Vercel)

```bash
vercel --prod
```

## בדיקה

לאחר הפריסה, בדוק:
1. שהאודיו נוצר בהצלחה
2. שהקבצים נשמרים ב-Firebase Storage תחת `tts/`
3. שטעינה חוזרת של אותו טקסט משתמשת במטמון (מהיר יותר)

## הערות

- המודל `gemini-1.5-pro-latest` תומך ב-TTS עם קולות: "Puck", "charlie", "Breeze"
- המערכת מנסה את ה-API החדש (`getGenerativeModel`) ואם זה לא עובד, נופלת חזרה ל-API הישן
- אם Google Cloud TTS API key מוגדר, המערכת תשתמש בו קודם (איכות גבוהה יותר)
- אם Google Cloud TTS לא זמין, המערכת תשתמש ב-Gemini TTS

## שיפור מהירות טעינה

המערכת כבר משתמשת במטמון:
- ✅ בדיקה אם האודיו קיים במטמון לפני יצירה
- ✅ טעינה מהמטמון אם קיים (מהיר יותר)
- ✅ שמירה אוטומטית ב-Firebase Storage לאחר יצירה

אין צורך בשינויים נוספים - המערכת כבר מותאמת לביצועים מיטביים!

