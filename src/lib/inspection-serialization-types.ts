export type SerializedAnswerKind = 'value' | 'media' | 'signature' | 'audio';

export interface SerializedFileData {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  data: Blob;
}

export interface SerializedValueAnswer {
  kind: 'value';
  value: any;
}

export interface SerializedMediaAnswer {
  kind: 'media';
  files: SerializedFileData[];
}

export interface SerializedSignatureAnswer {
  kind: 'signature';
  dataUrl: string;
}

export interface SerializedAudioAnswer {
  kind: 'audio';
  file: SerializedFileData;
  duration?: number;
}

export type SerializedAnswerEntry =
  | SerializedValueAnswer
  | SerializedMediaAnswer
  | SerializedSignatureAnswer
  | SerializedAudioAnswer;

export interface SerializedInspectionAnswers {
  version: number;
  updatedAt: number;
  answers: Record<string, SerializedAnswerEntry>;
}
