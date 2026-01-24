/**
 * Task Service
 * 
 * Service for managing tasks (clerking sheets, maintenance, etc.)
 * Connects to backend API when available
 * 
 * Note: The tasks API endpoint may not exist yet. All methods gracefully handle
 * 404 errors by returning empty/null values. Browser console may show network
 * errors for 404s, but these are expected and handled silently.
 */

import { apiClient } from '../apiClient';
import type { Task, TaskStatus, TaskPriority, TaskAssignment, TaskComment } from '../workflow/types';

/**
 * Fetch tasks for a user
 */
export async function fetchTasks(filters?: {
  assignedTo?: string;
  createdBy?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}): Promise<Task[]> {
  try {
    const response = await apiClient.get('/v1/tasks', {
      params: filters,
      suppressErrorLog: true,
      suppressPermissionError: true,
      skipRetry: true, // Don't retry 404s - endpoint may not exist yet
    });
    
    // Transform backend response to Task format
    const tasks = Array.isArray(response.data) ? response.data : response.data?.data || [];
    return tasks.map(transformTask);
  } catch (error) {
    // Return empty array if endpoint doesn't exist yet
    return [];
  }
}

/**
 * Fetch a single task by ID
 */
export async function fetchTask(taskId: string): Promise<Task | null> {
  try {
    const response = await apiClient.get(`/v1/tasks/${taskId}`, {
      suppressErrorLog: true,
      suppressPermissionError: true,
      skipRetry: true, // Don't retry 404s - endpoint may not exist yet
    });
    
    return transformTask(response.data);
  } catch (error) {
    return null;
  }
}

/**
 * Create a new task
 */
export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task | null> {
  try {
    const response = await apiClient.post('/v1/tasks', {
      type: task.type,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigned_to_id: task.assignedTo?.id,
      due_date: task.dueDate?.toISOString(),
      metadata: task.metadata,
      related_entity_type: task.relatedEntity?.type,
      related_entity_id: task.relatedEntity?.id,
    }, {
      suppressErrorLog: true,
      suppressPermissionError: true,
    });
    
    return transformTask(response.data);
  } catch (error) {
    return null;
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  userId?: string
): Promise<Task | null> {
  try {
    const response = await apiClient.patch(`/v1/tasks/${taskId}/status`, {
      status,
      updated_by_id: userId,
    }, {
      suppressErrorLog: true,
      suppressPermissionError: true,
    });
    
    return transformTask(response.data);
  } catch (error) {
    return null;
  }
}

/**
 * Assign task to user
 */
export async function assignTask(
  taskId: string,
  assignedTo: string,
  assignedBy: string,
  reason?: string
): Promise<TaskAssignment | null> {
  try {
    const response = await apiClient.post(`/v1/tasks/${taskId}/assign`, {
      assigned_to_id: assignedTo,
      assigned_by_id: assignedBy,
      reason,
    }, {
      suppressErrorLog: true,
      suppressPermissionError: true,
    });
    
    return {
      taskId,
      assignedTo,
      assignedBy,
      assignedAt: new Date(response.data.assigned_at || Date.now()),
      reason: response.data.reason,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Add comment to task
 */
export async function addTaskComment(
  taskId: string,
  userId: string,
  userName: string,
  content: string
): Promise<TaskComment | null> {
  try {
    const response = await apiClient.post(`/v1/tasks/${taskId}/comments`, {
      user_id: userId,
      content,
    }, {
      suppressErrorLog: true,
      suppressPermissionError: true,
    });
    
    return {
      id: response.data.id || `comment-${Date.now()}`,
      taskId,
      userId,
      userName,
      content,
      createdAt: new Date(response.data.created_at || Date.now()),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Transform backend task format to frontend Task format
 */
function transformTask(data: any): Task {
  return {
    id: data.id || data.task_id,
    type: data.type || 'custom',
    title: data.title || 'Untitled Task',
    description: data.description,
    status: data.status || 'pending',
    priority: data.priority || 'medium',
    assignedTo: data.assigned_to ? {
      id: data.assigned_to.id || data.assigned_to_id,
      name: data.assigned_to.name || data.assigned_to_name,
      email: data.assigned_to.email,
    } : undefined,
    createdBy: data.created_by ? {
      id: data.created_by.id || data.created_by_id,
      name: data.created_by.name || data.created_by_name,
    } : undefined,
    createdAt: new Date(data.created_at || data.createdAt || Date.now()),
    updatedAt: new Date(data.updated_at || data.updatedAt || Date.now()),
    dueDate: data.due_date ? new Date(data.due_date) : undefined,
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    metadata: data.metadata || {},
    relatedEntity: data.related_entity_type ? {
      type: data.related_entity_type,
      id: data.related_entity_id,
    } : undefined,
  };
}

