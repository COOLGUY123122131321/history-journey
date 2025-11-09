# 🧠 AI Study Companion System - Implementation Guide

## Overview

המערכת מאפשרת לתלמידים להעלות חומרי לימוד (PDF, תמונות, טקסט, אודיו) והאפליקציה בונה אוטומטית מסע למידה אינטראקטיבי מותאם אישית.

## 📁 Files Created

### Services

1. **`services/fileUploadService.ts`**
   - העלאה של קבצים ל-Firebase Storage
   - תמיכה ב-PDF, Word, תמונות, טקסט, אודיו
   - אימות קבצים לפני העלאה

2. **`services/contentAnalyzerService.ts`**
   - ניתוח תוכן עם AI (Gemini)
   - OCR לתמונות
   - זיהוי כוונה (assignment, essay, etc.)
   - חילוץ נושאים, מילות מפתח, רמת קושי

3. **`services/dynamicJourneyBuilder.ts`**
   - בניית מסע למידה דינמי מהתוכן
   - יצירת סצנות אינטראקטיביות
   - יצירת שאלות קוויז

4. **`services/contentMemoryService.ts`**
   - שמירת חומרי לימוד ב-Firestore
   - מעקב אחר התקדמות למידה
   - הצעות לחזרה ולשיעורים המשך

5. **`services/privateTutorService.ts`**
   - מצב מורה פרטי (Professor Spark, Dr. Nova, Sage)
   - תשובות לשאלות בזמן אמת
   - רמזים ואתגרים יצירתיים

6. **`services/essayAssistantService.ts`**
   - עוזר כתיבת חיבור
   - יצירת תקציר (outline)
   - משוב על חיבורים
   - מצב סיפור לכתיבה

### Components

7. **`components/study/StudyMaterialUpload.tsx`**
   - קומפוננטת העלאה עם drag & drop
   - תמיכה בהעלאת קבצים או הדבקת טקסט
   - תצוגת התקדמות

## 🎯 Features Implemented

### ✅ Input Layer
- העלאה של PDF, Word, תמונות, טקסט
- OCR לתמונות (חילוץ טקסט)
- אימות קבצים לפני העלאה

### ✅ AI Understanding Engine
- ניתוח תוכן עם Gemini
- זיהוי נושאים ומילות מפתח
- קביעת רמת קושי
- זיהוי כוונה (study/assignment/essay)

### ✅ Dynamic Journey Builder
- יצירת מסע למידה מותאם אישית
- סצנות אינטראקטיביות לפי סוג מסע (timeline/map/character/concept)
- שאלות קוויז מותאמות לתוכן

### ✅ Private Tutor Mode
- 3 אישיות מורה: Professor Spark, Dr. Nova, Sage
- תשובות לשאלות בזמן אמת
- רמזים כשהתלמיד תקוע
- אתגרים יצירתיים

### ✅ Essay & Assignment Assistant
- יצירת תקציר (outline)
- הדרכה שלב אחר שלב
- הצעות רעיונות ודוגמאות
- משוב מפורט על חיבורים

### ✅ Smart Content Memory
- שמירת חומרי לימוד ב-Firestore
- מעקב התקדמות
- הצעות לחזרה
- הצעות לשיעורים המשך

## 🚀 Usage Example

```typescript
import StudyMaterialUpload from './components/study/StudyMaterialUpload';

// In your component
<StudyMaterialUpload 
  onJourneyCreated={(journeyId) => {
    // Navigate to the new journey
    console.log('Journey created:', journeyId);
  }}
/>
```

## 📊 Firestore Collections

### `study_materials`
```typescript
{
  id: string;
  userId: string;
  fileName: string;
  fileType: 'pdf' | 'image' | 'text' | 'audio' | 'word';
  downloadURL: string;
  uploadedAt: Timestamp;
  analysis: ContentAnalysis;
  journeyId?: string;
  tags: string[];
  difficulty: string;
  subject: string;
}
```

### `learning_progress`
```typescript
{
  userId: string;
  materialId: string;
  journeyId: string;
  completedScenes: number;
  totalScenes: number;
  score: number;
  timeSpent: number;
  lastAccessed: Timestamp;
  masteryLevel: 'novice' | 'apprentice' | 'expert' | 'master';
  weakPoints: string[];
  strongPoints: string[];
}
```

## 🔧 Integration Points

המערכת משתמשת ב:
- ✅ Firebase Storage - שמירת קבצים
- ✅ Firestore - שמירת מטא-דאטה והתקדמות
- ✅ Gemini API - ניתוח תוכן ויצירת מסעות
- ✅ OpenAI TTS - קריינות (אם מוגדר)
- ✅ Google Cloud TTS - קריינות (אם מוגדר)

## 📝 Next Steps

### To Complete the System:

1. **PDF/Word Text Extraction**
   - הוסף ספרייה לחילוץ טקסט מ-PDF (כמו pdf-parse)
   - הוסף תמיכה ב-Word documents

2. **Audio Transcription**
   - הוסף אינטגרציה עם OpenAI Whisper API
   - או Google Speech-to-Text

3. **UI Components**
   - קומפוננטת מצב מורה פרטי
   - קומפוננטת עוזר חיבור
   - מסך הצגת חומרי לימוד

4. **Gamification**
   - הוסף XP ו-badges
   - leaderboards
   - streaks

5. **Review Mode**
   - מסך חזרה על חומרים ישנים
   - תרגול נקודות חלשות

## 🎨 Example Flow

1. תלמיד מעלה תמונה של דף עבודה
2. המערכת חולצת טקסט עם OCR
3. AI מנתח את התוכן ומזהה נושאים
4. המערכת בונה מסע אינטראקטיבי
5. התלמיד לומד דרך משחק
6. המורה הפרטי עוזר כשצריך
7. המערכת שומרת התקדמות ומציעה חזרה

## ⚠️ Notes

- PDF/Word text extraction עדיין לא מיושם - צריך להוסיף ספרייה
- Audio transcription עדיין לא מיושם - צריך Whisper API
- Storage rules מאפשרים גישה חופשית (זמני לפיתוח)
- יש להגדיר `GEMINI_API_KEY` ב-`.env.local`

## 🔮 Future Enhancements

- תמיכה בשפות נוספות
- מצב שיתוף עם חברים
- יצירת מצגות אוטומטית
- אינטגרציה עם מערכות LMS
- Analytics dashboard

