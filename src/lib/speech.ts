/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Native Web Speech API wrapper for speech-to-text and text-to-speech
// Designed to run reliably on basic Android phones & desktop browsers without external paid APIs

export interface SpeechRecognitionResultState {
  transcript: string;
  isFinal: boolean;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}

export function createSpeechRecognizer(
  onResult: (text: string, isFinal: boolean) => void,
  onError: (error: string) => void,
  onEnd: () => void
) {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition is not supported in this browser. Please use typed input.');
    return null;
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Optimized for Edify School Tirupati Indian English accents

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      const isFinal = Boolean(finalTranscript);
      onResult(text, isFinal);
    };

    recognition.onerror = (event: any) => {
      const err = event.error;
      if (err === 'no-speech') {
        onError('No speech was detected. Tap and speak clearly.');
      } else if (err === 'not-allowed') {
        onError('Microphone access was denied. You can still type your task anytime.');
      } else {
        onError(`Microphone: ${err}`);
      }
    };

    recognition.onend = () => {
      onEnd();
    };

    return recognition;
  } catch (err) {
    onError('Unable to initialize speech recognizer.');
    return null;
  }
}

// Text-to-Speech: "Read my plan aloud"
export function readAloud(text: string, onEnd?: () => void): () => void {
  if (!isSpeechSynthesisSupported()) {
    return () => {};
  }

  try {
    window.speechSynthesis.cancel(); // cancel any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Slightly slower, calm cadence for students
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';

    // Find Indian English voice if available in system
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.includes('en-IN') || v.name.includes('India') || v.lang.includes('en-GB')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);

    // Return stopper function
    return () => {
      window.speechSynthesis.cancel();
    };
  } catch (err) {
    console.warn('Speech synthesis failed:', err);
    return () => {};
  }
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
