/**
 * Tasks Hook
 * 
 * Hook for fetching and managing tasks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, fetchTask, updateTaskStatus, assignTask, addTaskComment, createTask } from '../lib/services/TaskService';
import type { Task, TaskStatus, TaskPriority } from '../lib/workflow/types';
import { queryKeys } from '../lib/queries';

export interface UseTasksOptions {
  assignedTo?: string;
  createdBy?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  enabled?: boolean;
}

/**
 * Hook for fetching tasks
 */
export function useTasks(options: UseTasksOptions = {}) {
  const {
    assignedTo,
    createdBy,
    status,
    priority,
    type,
    relatedEntityType,
    relatedEntityId,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: ['tasks', assignedTo, createdBy, status, priority, type, relatedEntityType, relatedEntityId],
    queryFn: () => fetchTasks({
      assignedTo,
      createdBy,
      status,
      priority,
      type,
      relatedEntityType,
      relatedEntityId,
    }),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching a single task
 */
export function useTask(taskId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskId ? fetchTask(taskId) : null,
    enabled: enabled && !!taskId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for updating task status
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status, userId }: { taskId: string; status: TaskStatus; userId?: string }) =>
      updateTaskStatus(taskId, status, userId),
    onSuccess: (task) => {
      if (task) {
        // Invalidate task queries
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      }
    },
  });
}

/**
 * Hook for assigning a task
 */
export function useAssignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, assignedTo, assignedBy, reason }: {
      taskId: string;
      assignedTo: string;
      assignedBy: string;
      reason?: string;
    }) => assignTask(taskId, assignedTo, assignedBy, reason),
    onSuccess: (assignment, variables) => {
      if (assignment) {
        // Invalidate task queries
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      }
    },
  });
}

/**
 * Hook for adding a task comment
 */
export function useAddTaskComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, userId, userName, content }: {
      taskId: string;
      userId: string;
      userName: string;
      content: string;
    }) => addTaskComment(taskId, userId, userName, content),
    onSuccess: (comment, variables) => {
      if (comment) {
        // Invalidate task queries to refresh comments
        queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      }
    },
  });
}

/**
 * Hook for creating a task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => createTask(task),
    onSuccess: (task) => {
      if (task) {
        // Invalidate task queries
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    },
  });
}



