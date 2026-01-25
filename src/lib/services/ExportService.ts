/**
 * Unified Export Service
 * 
 * Centralized export functionality across all modules
 * Supports CSV, Excel, JSON formats with templates and scheduling
 */

import { exportData, exportFromAPI, type ExportFormat, type ExportOptions } from '../exportUtils';
import { apiClient } from '../apiClient';

export interface ExportTemplate {
  id: string;
  name: string;
  module: 'gate_pass' | 'expense' | 'inspection' | 'user' | 'all';
  format: ExportFormat;
  fields: string[]; // Fields to include
  filters?: Record<string, any>; // Default filters
  description?: string;
}

export interface ScheduledExport {
  id: string;
  template_id: string;
  schedule: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:mm format
  recipients?: string[]; // Email addresses
  enabled: boolean;
}

class ExportService {
  private templates: ExportTemplate[] = [];
  private scheduledExports: ScheduledExport[] = [];

  /**
   * Export data with template
   */
  async exportWithTemplate(
    templateId: string,
    data?: Record<string, any>[],
    apiEndpoint?: string,
    apiParams?: Record<string, any>
  ): Promise<void> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Apply template filters to params
    const params = { ...template.filters, ...apiParams };

    // If template specifies fields, filter data
    let filteredData = data;
    if (data && template.fields.length > 0) {
      filteredData = data.map(row => {
        const filtered: Record<string, any> = {};
        template.fields.forEach(field => {
          if (field in row) {
            filtered[field] = row[field];
          }
        });
        return filtered;
      });
    }

    const options: ExportOptions = {
      filename: `${template.name}-${new Date().toISOString().split('T')[0]}.${template.format === 'excel' ? 'xlsx' : template.format}`,
      headers: template.fields.length > 0 ? template.fields : undefined,
    };

    if (apiEndpoint) {
      await exportFromAPI(apiEndpoint, template.format, params, options);
    } else if (filteredData) {
      await exportData(filteredData, template.format, options);
    } else {
      throw new Error('No data or API endpoint provided');
    }
  }

  /**
   * Get all templates for a module
   */
  getTemplates(module?: string): ExportTemplate[] {
    if (!module) return this.templates;
    return this.templates.filter(t => t.module === module || t.module === 'all');
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): ExportTemplate | undefined {
    return this.templates.find(t => t.id === templateId);
  }

  /**
   * Save template (to localStorage for now, can be moved to backend)
   */
  saveTemplate(template: Omit<ExportTemplate, 'id'>): string {
    const id = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTemplate: ExportTemplate = { ...template, id };
    this.templates.push(newTemplate);
    this.persistTemplates();
    return id;
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): boolean {
    const index = this.templates.findIndex(t => t.id === templateId);
    if (index >= 0) {
      this.templates.splice(index, 1);
      this.persistTemplates();
      return true;
    }
    return false;
  }

  /**
   * Get default templates
   */
  getDefaultTemplates(): ExportTemplate[] {
    return [
      {
        id: 'gate-pass-summary',
        name: 'Gate Pass Summary',
        module: 'gate_pass',
        format: 'csv',
        fields: ['pass_number', 'pass_type', 'visitor_name', 'vehicle_registration', 'status', 'created_at'],
        description: 'Basic gate pass information',
      },
      {
        id: 'expense-detailed',
        name: 'Expense Detailed Report',
        module: 'expense',
        format: 'excel',
        fields: ['id', 'amount', 'category', 'description', 'date', 'status', 'payment_method', 'project_name'],
        description: 'Comprehensive expense report with all details',
      },
      {
        id: 'inspection-summary',
        name: 'Inspection Summary',
        module: 'inspection',
        format: 'csv',
        fields: ['id', 'vehicle_registration', 'template_name', 'status', 'created_at'],
        description: 'Basic inspection information',
      },
    ];
  }

  /**
   * Initialize templates from localStorage or defaults
   */
  initializeTemplates(): void {
    try {
      const stored = localStorage.getItem('export_templates');
      if (stored) {
        this.templates = JSON.parse(stored);
      } else {
        this.templates = this.getDefaultTemplates();
        this.persistTemplates();
      }
    } catch {
      this.templates = this.getDefaultTemplates();
    }
  }

  /**
   * Persist templates to localStorage
   */
  private persistTemplates(): void {
    try {
      localStorage.setItem('export_templates', JSON.stringify(this.templates));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Create scheduled export (requires backend support)
   */
  async createScheduledExport(scheduledExport: Omit<ScheduledExport, 'id'>): Promise<string> {
    // TODO: Implement backend API call
    const id = `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.scheduledExports.push({ ...scheduledExport, id });
    return id;
  }

  /**
   * Get scheduled exports
   */
  getScheduledExports(): ScheduledExport[] {
    return this.scheduledExports;
  }
}

// Initialize service
export const exportService = new ExportService();
exportService.initializeTemplates();


