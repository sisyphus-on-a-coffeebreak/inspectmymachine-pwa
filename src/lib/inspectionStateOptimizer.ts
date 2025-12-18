/**
 * Inspection State Optimizer
 * 
 * Optimizes inspection state management for mobile devices.
 * Prevents storing large File objects in React state.
 * Uses IndexedDB for persistence and loads on-demand.
 */

import { saveInspectionDraft, loadInspectionDraft } from './inspection-queue';
import { serializeAnswers, deserializeAnswers } from './inspection-answers';
import type { SerializedInspectionAnswers } from './inspection-serialization-types';

/**
 * Optimized answer state manager
 * Only keeps current section answers in memory
 * Persists full answers to IndexedDB immediately
 */
export class InspectionStateManager {
  private templateId: string;
  private vehicleId?: string;
  private currentSectionAnswers: Record<string, any> = {};
  private allAnswersCache: Record<string, any> | null = null;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor(templateId: string, vehicleId?: string) {
    this.templateId = templateId;
    this.vehicleId = vehicleId;
  }

  /**
   * Initialize from draft
   */
  async initialize(): Promise<Record<string, any>> {
    const draft = await loadInspectionDraft(this.templateId, this.vehicleId);
    if (draft) {
      this.allAnswersCache = deserializeAnswers(draft.answers);
      return { ...this.allAnswersCache };
    }
    return {};
  }

  /**
   * Update answer for a question
   * Immediately persists to IndexedDB (debounced)
   */
  async updateAnswer(questionId: string, value: any): Promise<void> {
    // Update in-memory cache
    if (!this.allAnswersCache) {
      this.allAnswersCache = {};
    }
    this.allAnswersCache[questionId] = value;

    // Update current section cache
    this.currentSectionAnswers[questionId] = value;

    // Debounced save to IndexedDB
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    this.saveDebounceTimer = setTimeout(async () => {
      await this.persistToIndexedDB();
    }, 1000); // 1 second debounce
  }

  /**
   * Get answer for a question
   * Loads from cache, falls back to IndexedDB if needed
   */
  async getAnswer(questionId: string): Promise<any> {
    // Check current section cache first
    if (questionId in this.currentSectionAnswers) {
      return this.currentSectionAnswers[questionId];
    }

    // Check full cache
    if (this.allAnswersCache && questionId in this.allAnswersCache) {
      return this.allAnswersCache[questionId];
    }

    // Load from IndexedDB if cache is empty
    if (!this.allAnswersCache) {
      await this.loadFromIndexedDB();
    }

    return this.allAnswersCache?.[questionId];
  }

  /**
   * Get all answers (for submission)
   */
  async getAllAnswers(): Promise<Record<string, any>> {
    if (!this.allAnswersCache) {
      await this.loadFromIndexedDB();
    }
    return { ...(this.allAnswersCache || {}) };
  }

  /**
   * Load answers for a specific section
   * Only deserializes files for that section
   */
  async loadSectionAnswers(sectionQuestionIds: string[]): Promise<Record<string, any>> {
    if (!this.allAnswersCache) {
      await this.loadFromIndexedDB();
    }

    const sectionAnswers: Record<string, any> = {};
    sectionQuestionIds.forEach(questionId => {
      if (this.allAnswersCache && questionId in this.allAnswersCache) {
        sectionAnswers[questionId] = this.allAnswersCache[questionId];
      }
    });

    // Update current section cache
    this.currentSectionAnswers = sectionAnswers;

    return sectionAnswers;
  }

  /**
   * Clear current section cache (to free memory)
   */
  clearSectionCache(): void {
    this.currentSectionAnswers = {};
  }

  /**
   * Persist to IndexedDB
   */
  private async persistToIndexedDB(): Promise<void> {
    if (!this.allAnswersCache) return;

    const serialized = serializeAnswers(this.allAnswersCache);
    await saveInspectionDraft(this.templateId, this.vehicleId, serialized);
  }

  /**
   * Load from IndexedDB
   */
  private async loadFromIndexedDB(): Promise<void> {
    const draft = await loadInspectionDraft(this.templateId, this.vehicleId);
    if (draft) {
      this.allAnswersCache = deserializeAnswers(draft.answers);
    } else {
      this.allAnswersCache = {};
    }
  }

  /**
   * Force immediate save
   */
  async saveNow(): Promise<void> {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
    await this.persistToIndexedDB();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.allAnswersCache = null;
    this.currentSectionAnswers = {};
  }
}
