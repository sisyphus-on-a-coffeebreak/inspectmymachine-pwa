# Photo Reorder Backend Implementation

## Overview
Backend endpoint to support photo reordering in inspection answers, enabling the `SortablePhotoGrid` component to persist photo order changes.

## Endpoint

### `PATCH /v1/inspections/{inspectionId}/answers/{answerId}/reorder-photos`

**Request Body:**
```json
{
  "photo_keys": ["key1", "key2", "key3"]
}
```

**Response:**
```json
{
  "message": "Photos reordered successfully",
  "answer": {
    "id": "...",
    "answer_files": [...],
    "question": {...}
  }
}
```

## Implementation Details

### Controller Method
Located in: `vosm/app/Http/Controllers/InspectionController.php`

Method: `reorderPhotos(Request $request, string $inspectionId, string $answerId)`

### Validation
- Validates that `photo_keys` is a required array
- Ensures all provided keys exist in the current `answer_files`
- Ensures all existing photos are included in the new order (no photos are lost)
- Verifies the answer belongs to the specified inspection

### How It Works
1. Finds the inspection and answer
2. Validates all photo keys exist
3. Reorders the `answer_files` JSON array based on the provided order
4. Updates the database record
5. Returns the updated answer

## Frontend Integration

### Using the Helper Function

```typescript
import { reorderInspectionPhotos } from '@/lib/inspectionPhotoReorder';

const handleReorder = async (newOrder: string[]) => {
  try {
    await reorderInspectionPhotos(inspectionId, answerId, newOrder);
    // Refresh the data to show new order
    await refetch();
  } catch (error) {
    // Handle error
    console.error('Failed to reorder photos:', error);
  }
};
```

### With SortablePhotoGrid

```tsx
<SortablePhotoGrid
  photos={photos.map(p => ({ id: p.key, url: p.url }))}
  onReorder={handleReorder}
  onDelete={handleDelete}
/>
```

**Important:** The `photo.id` must match the `key` field in the `answer_files` JSON structure.

## Data Structure

Photos in `answer_files` should have this structure:
```json
[
  {
    "key": "inspections/{id}/{questionKey}/photo1.jpg",
    "type": "image",
    "url": "https://...",
    "size": 1024
  },
  ...
]
```

The `key` field is used to identify and reorder photos.

## Error Handling

The endpoint returns appropriate HTTP status codes:
- `200` - Success
- `404` - Inspection or answer not found
- `422` - Validation errors:
  - Missing photo keys
  - Photo keys don't exist
  - Not all photos included in new order

## Notes

- Photos must be stored in the `answer_files` JSON field (not just as S3 files)
- The order is persisted in the database
- All existing photos must be included in the reorder request
- The endpoint maintains data integrity by validating all operations

