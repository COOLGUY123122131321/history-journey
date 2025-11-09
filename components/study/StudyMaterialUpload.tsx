// components/study/StudyMaterialUpload.tsx

import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { uploadFile, uploadTextContent, validateFile, FileType } from '../../services/fileUploadService';
import { analyzeContent, extractTextFromImage, detectIntent } from '../../services/contentAnalyzerService';
import { buildStudyJourney, generateJourneyScenes, generateStudyQuestions } from '../../services/dynamicJourneyBuilder';
import { saveStudyMaterial } from '../../services/contentMemoryService';
import { ContentAnalysis } from '../../services/contentAnalyzerService';

interface StudyMaterialUploadProps {
  onJourneyCreated?: (journeyId: string) => void;
}

const StudyMaterialUpload: React.FC<StudyMaterialUploadProps> = ({ onJourneyCreated }) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [building, setBuilding] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [useTextInput, setUseTextInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user) {
      setError('Please log in to upload materials');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress('Uploading file...');

    try {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      // Upload file
      const uploadedFile = await uploadFile(file, user.uid);
      setProgress('File uploaded! Analyzing content...');
      setAnalyzing(true);

      // Extract text based on file type
      let contentText = '';
      let fileType: FileType = uploadedFile.fileType;

      if (fileType === 'image') {
        setProgress('Extracting text from image...');
        contentText = await extractTextFromImage(uploadedFile.downloadURL, user.uid);
      } else if (fileType === 'audio') {
        setError('Audio transcription not yet implemented. Please use text input.');
        return;
      } else if (fileType === 'pdf' || fileType === 'word') {
        // For PDF/Word, we'd need to extract text server-side or use a library
        // For now, prompt user to paste text
        setError('PDF/Word text extraction not yet implemented. Please paste the text content.');
        return;
      } else {
        // For text files, read content
        const response = await fetch(uploadedFile.downloadURL);
        contentText = await response.text();
      }

      if (!contentText || contentText.trim().length < 50) {
        setError('Could not extract enough text from the file. Please try pasting the text directly.');
        return;
      }

      // Analyze content
      setProgress('Analyzing content with AI...');
      const analysis = await analyzeContent(contentText, fileType, user.uid);

      // Save study material
      const material = await saveStudyMaterial({
        userId: user.uid,
        fileName: uploadedFile.fileName,
        fileType: fileType,
        downloadURL: uploadedFile.downloadURL,
        analysis,
        tags: analysis.topics,
        difficulty: analysis.difficulty,
        subject: analysis.subject,
      });

      // Build journey
      setProgress('Building your learning journey...');
      setBuilding(true);
      const journey = await buildStudyJourney(contentText, analysis, user.uid, material.id);
      
      // Generate scenes and questions
      setProgress('Creating interactive content...');
      await generateJourneyScenes(journey, contentText, user.uid);
      await generateStudyQuestions(journey, contentText, user.uid);

      setProgress('Complete!');
      if (onJourneyCreated) {
        onJourneyCreated(journey.id);
      }

      // Reset form
      setUploading(false);
      setAnalyzing(false);
      setBuilding(false);
      setTextInput('');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to process file');
      setUploading(false);
      setAnalyzing(false);
      setBuilding(false);
    }
  }, [user, onJourneyCreated]);

  const handleTextSubmit = useCallback(async () => {
    if (!user || !textInput.trim()) {
      setError('Please enter some text');
      return;
    }

    setError(null);
    setAnalyzing(true);
    setProgress('Analyzing text content...');

    try {
      // Upload text
      const uploadedFile = await uploadTextContent(textInput, user.uid);
      
      // Analyze content
      setProgress('Analyzing content with AI...');
      const analysis = await analyzeContent(textInput, 'text', user.uid);

      // Detect intent
      const intent = await detectIntent(textInput, user.uid);

      // Save study material
      const material = await saveStudyMaterial({
        userId: user.uid,
        fileName: uploadedFile.fileName,
        fileType: 'text',
        downloadURL: uploadedFile.downloadURL,
        analysis,
        tags: analysis.topics,
        difficulty: analysis.difficulty,
        subject: analysis.subject,
      });

      // Build journey
      setProgress('Building your learning journey...');
      setBuilding(true);
      const journey = await buildStudyJourney(textInput, analysis, user.uid, material.id);
      
      // Generate scenes and questions
      setProgress('Creating interactive content...');
      await generateJourneyScenes(journey, textInput, user.uid);
      await generateStudyQuestions(journey, textInput, user.uid);

      setProgress('Complete!');
      if (onJourneyCreated) {
        onJourneyCreated(journey.id);
      }

      // Reset form
      setAnalyzing(false);
      setBuilding(false);
      setTextInput('');
      setUseTextInput(false);
    } catch (err: any) {
      console.error('Text processing error:', err);
      setError(err.message || 'Failed to process text');
      setAnalyzing(false);
      setBuilding(false);
    }
  }, [user, textInput, onJourneyCreated]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  return (
    <div className="study-material-upload">
      <h2>📚 Upload Study Material</h2>
      <p>Upload PDFs, images, text, or paste content directly</p>

      {error && (
        <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>
          {error}
        </div>
      )}

      {progress && (
        <div className="progress-message" style={{ margin: '10px 0', fontWeight: 'bold' }}>
          {progress}
        </div>
      )}

      {!useTextInput ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: '2px dashed #ccc',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            cursor: 'pointer',
            margin: '20px 0',
          }}
        >
          <input
            type="file"
            id="file-upload"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp3,.wav"
            style={{ display: 'none' }}
            disabled={uploading || analyzing || building}
          />
          <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
            <div>📁 Drag & drop a file here</div>
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              or click to browse
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
              Supports: PDF, Word, Images, Text files
            </div>
          </label>
        </div>
      ) : (
        <div style={{ margin: '20px 0' }}>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your study material here..."
            rows={10}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontFamily: 'inherit',
            }}
            disabled={analyzing || building}
          />
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || analyzing || building}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Analyze & Create Journey
            </button>
            <button
              onClick={() => {
                setUseTextInput(false);
                setTextInput('');
              }}
              disabled={analyzing || building}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ccc',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={() => setUseTextInput(!useTextInput)}
          disabled={uploading || analyzing || building}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {useTextInput ? '📁 Upload File Instead' : '📝 Paste Text Instead'}
        </button>
      </div>

      {(uploading || analyzing || building) && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <div className="spinner" style={{ display: 'inline-block' }}>
            ⏳ Processing...
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMaterialUpload;

