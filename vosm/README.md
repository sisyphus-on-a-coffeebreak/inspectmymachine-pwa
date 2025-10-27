# VOMS Backend Setup

This directory contains the Laravel backend for the VOMS PWA application.

## Prerequisites

- PHP 8.1 or higher
- Composer
- MySQL/PostgreSQL database
- Node.js (for frontend development)

## Quick Setup

1. **Install Laravel** (if not already done):
   ```bash
   composer create-project laravel/laravel vosm-backend
   cd vosm-backend
   ```

2. **Copy the files from this directory** to your Laravel project:
   - Copy `app/Http/Controllers/` to `app/Http/Controllers/`
   - Copy `app/Models/` to `app/Models/`
   - Copy `database/migrations/` to `database/migrations/`
   - Copy `routes/api.php` content to your `routes/api.php`

3. **Install dependencies**:
   ```bash
   composer install
   ```

4. **Configure environment**:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Configure database** in `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=voms
   DB_USERNAME=root
   DB_PASSWORD=
   ```

6. **Run migrations**:
   ```bash
   php artisan migrate
   ```

7. **Start the server**:
   ```bash
   php artisan serve
   ```

The API will be available at `http://localhost:8000/api/v1/`

## API Endpoints

### Inspection Module
- `GET /api/v1/inspection-dashboard` - Dashboard statistics
- `GET /api/v1/inspections` - List inspections
- `POST /api/v1/inspections` - Create inspection
- `GET /api/v1/inspections/{id}` - Get inspection details
- `PUT /api/v1/inspections/{id}` - Update inspection
- `DELETE /api/v1/inspections/{id}` - Delete inspection

### Vehicle Management
- `GET /api/v1/vehicles` - List vehicles
- `POST /api/v1/vehicles` - Create vehicle
- `GET /api/v1/vehicles/{id}` - Get vehicle details
- `PUT /api/v1/vehicles/{id}` - Update vehicle
- `DELETE /api/v1/vehicles/{id}` - Delete vehicle

### Inspection Templates
- `GET /api/v1/inspection-templates` - List templates
- `POST /api/v1/inspection-templates` - Create template
- `GET /api/v1/inspection-templates/{id}` - Get template details
- `PUT /api/v1/inspection-templates/{id}` - Update template
- `DELETE /api/v1/inspection-templates/{id}` - Delete template

## Development Notes

- The frontend will automatically fall back to mock data when the backend is not available
- All API endpoints require authentication via Laravel Sanctum
- CORS is configured for `localhost:5173` (Vite dev server)
- The database migrations create all necessary tables for the inspection module

## Troubleshooting

1. **404 errors**: Make sure the Laravel server is running on port 8000
2. **CORS errors**: Check that the frontend URL is allowed in `config/cors.php`
3. **Database errors**: Ensure the database is created and migrations are run
4. **Authentication errors**: Make sure Sanctum is properly configured

## Next Steps

1. Set up the complete Laravel backend
2. Configure authentication
3. Add seeders for sample data
4. Set up proper error handling
5. Add API documentation

