# Backend API Stubs - Tasks Endpoints

This directory contains Laravel backend implementation files for the Tasks API endpoints.

## Files

1. **TaskController.php** - Controller handling all task-related operations
2. **tasks-routes.php** - API routes to add to `routes/api.php`
3. **create_tasks_table.php** - Database migration for tasks tables

## Installation Steps

### 1. Copy Controller

Copy `TaskController.php` to your Laravel backend:
```bash
cp TaskController.php /path/to/your/laravel/app/Http/Controllers/Api/TaskController.php
```

### 2. Add Routes

Add the routes from `tasks-routes.php` to your `routes/api.php` file, or include it:
```php
require __DIR__.'/tasks-routes.php';
```

### 3. Run Migration

Create the migration:
```bash
php artisan make:migration create_tasks_table
```

Then copy the content from `create_tasks_table.php` into the generated migration file and run:
```bash
php artisan migrate
```

## API Endpoints

### GET /api/v1/tasks
List tasks with optional filters:
- `assigned_to` - Filter by assigned user ID
- `created_by` - Filter by creator user ID
- `status` - Filter by status (pending, in_progress, completed, cancelled, overdue)
- `priority` - Filter by priority (low, medium, high, critical)
- `type` - Filter by task type
- `related_entity_type` - Filter by related entity type
- `related_entity_id` - Filter by related entity ID

### GET /api/v1/tasks/{id}
Get a single task by ID

### POST /api/v1/tasks
Create a new task

**Request Body:**
```json
{
  "type": "clerking_sheet",
  "title": "Task Title",
  "description": "Task description",
  "status": "pending",
  "priority": "medium",
  "assigned_to_id": 1,
  "due_date": "2024-12-31T23:59:59Z",
  "metadata": {},
  "related_entity_type": "vehicle",
  "related_entity_id": "123"
}
```

### PATCH /api/v1/tasks/{id}/status
Update task status

**Request Body:**
```json
{
  "status": "completed",
  "updated_by_id": 1
}
```

### POST /api/v1/tasks/{id}/assign
Assign task to a user

**Request Body:**
```json
{
  "assigned_to_id": 2,
  "assigned_by_id": 1,
  "reason": "Reassignment reason"
}
```

### POST /api/v1/tasks/{id}/comments
Add comment to task

**Request Body:**
```json
{
  "user_id": 1,
  "content": "Comment text"
}
```

## Permissions

The routes use permission middleware. Make sure you have:
- `permission:workflow,read` - For viewing tasks
- `permission:workflow,create` - For creating tasks
- `permission:workflow,update` - For updating/assigning tasks

## Database Schema

The migration creates three tables:
1. **tasks** - Main tasks table
2. **task_assignments** - History of task assignments
3. **task_comments** - Comments on tasks

## Notes

- All endpoints require authentication (`auth:sanctum`)
- Tasks are filtered by default to show only tasks assigned to or created by the current user
- The controller uses raw DB queries for simplicity. Consider using Eloquent models for better maintainability.
- Error responses follow the standard API format with `error` and `errors` fields



