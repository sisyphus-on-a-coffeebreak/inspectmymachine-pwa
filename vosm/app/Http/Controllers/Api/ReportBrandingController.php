<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ReportBrandingController extends Controller
{
    /**
     * Get current report branding settings
     * 
     * GET /api/v1/settings/report-branding
     */
    public function show(): JsonResponse
    {
        try {
            // Check if table exists
            if (!DB::getSchemaBuilder()->hasTable('report_branding')) {
                return response()->json([
                    'success' => true,
                    'data' => $this->getDefaultBranding(),
                ], 200);
            }
            
            $branding = DB::table('report_branding')->first();
            
            if (!$branding) {
                return response()->json([
                    'success' => true,
                    'data' => $this->getDefaultBranding(),
                ], 200);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $branding->id,
                    'logoUrl' => $branding->logo_url,
                    'companyName' => $branding->company_name,
                    'tradingAs' => $branding->trading_as,
                    'addressLine1' => $branding->address_line1,
                    'addressLine2' => $branding->address_line2,
                    'phone' => $branding->phone,
                    'email' => $branding->email,
                    'website' => $branding->website,
                    'gstin' => $branding->gstin,
                    'primaryColor' => $branding->primary_color,
                    'secondaryColor' => $branding->secondary_color,
                    'showLogoInHeader' => (bool) $branding->show_logo_in_header,
                    'showAddressInHeader' => (bool) $branding->show_address_in_header,
                    'showContactInFooter' => (bool) $branding->show_contact_in_footer,
                    'addWatermarkToPhotos' => (bool) $branding->add_watermark_to_photos,
                    'includeQRCode' => (bool) $branding->include_qr_code,
                    'footerText' => $branding->footer_text,
                    'createdAt' => $branding->created_at,
                    'updatedAt' => $branding->updated_at,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching report branding', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch branding settings',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create or update report branding settings
     * 
     * POST /api/v1/settings/report-branding
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'companyName' => 'required|string|max:255',
                'tradingAs' => 'nullable|string|max:255',
                'addressLine1' => 'nullable|string|max:255',
                'addressLine2' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:50',
                'email' => 'nullable|email|max:255',
                'website' => 'nullable|url|max:255',
                'gstin' => 'nullable|string|max:50',
                'primaryColor' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
                'secondaryColor' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
                'showLogoInHeader' => 'nullable|boolean',
                'showAddressInHeader' => 'nullable|boolean',
                'showContactInFooter' => 'nullable|boolean',
                'addWatermarkToPhotos' => 'nullable|boolean',
                'includeQRCode' => 'nullable|boolean',
                'footerText' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = $request->user();
            
            // Check if table exists
            if (!DB::getSchemaBuilder()->hasTable('report_branding')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Report branding table does not exist. Please run migrations.',
                ], 503);
            }

            $existing = DB::table('report_branding')->first();
            
            $data = [
                'company_name' => $request->input('companyName'),
                'trading_as' => $request->input('tradingAs'),
                'address_line1' => $request->input('addressLine1'),
                'address_line2' => $request->input('addressLine2'),
                'phone' => $request->input('phone'),
                'email' => $request->input('email'),
                'website' => $request->input('website'),
                'gstin' => $request->input('gstin'),
                'primary_color' => $request->input('primaryColor', '#2563eb'),
                'secondary_color' => $request->input('secondaryColor', '#1e40af'),
                'show_logo_in_header' => $request->input('showLogoInHeader', true),
                'show_address_in_header' => $request->input('showAddressInHeader', true),
                'show_contact_in_footer' => $request->input('showContactInFooter', true),
                'add_watermark_to_photos' => $request->input('addWatermarkToPhotos', false),
                'include_qr_code' => $request->input('includeQRCode', false),
                'footer_text' => $request->input('footerText'),
                'updated_by' => $user->id ?? null,
                'updated_at' => now(),
            ];

            if ($existing) {
                // Update existing
                DB::table('report_branding')
                    ->where('id', $existing->id)
                    ->update($data);
                
                $branding = DB::table('report_branding')->where('id', $existing->id)->first();
            } else {
                // Create new
                $data['created_by'] = $user->id ?? null;
                $data['created_at'] = now();
                $id = DB::table('report_branding')->insertGetId($data);
                $branding = DB::table('report_branding')->where('id', $id)->first();
            }

            return response()->json([
                'success' => true,
                'message' => 'Branding settings saved successfully',
                'data' => [
                    'id' => $branding->id,
                    'logoUrl' => $branding->logo_url,
                    'companyName' => $branding->company_name,
                    'tradingAs' => $branding->trading_as,
                    'addressLine1' => $branding->address_line1,
                    'addressLine2' => $branding->address_line2,
                    'phone' => $branding->phone,
                    'email' => $branding->email,
                    'website' => $branding->website,
                    'gstin' => $branding->gstin,
                    'primaryColor' => $branding->primary_color,
                    'secondaryColor' => $branding->secondary_color,
                    'showLogoInHeader' => (bool) $branding->show_logo_in_header,
                    'showAddressInHeader' => (bool) $branding->show_address_in_header,
                    'showContactInFooter' => (bool) $branding->show_contact_in_footer,
                    'addWatermarkToPhotos' => (bool) $branding->add_watermark_to_photos,
                    'includeQRCode' => (bool) $branding->include_qr_code,
                    'footerText' => $branding->footer_text,
                    'createdAt' => $branding->created_at,
                    'updatedAt' => $branding->updated_at,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error saving report branding', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to save branding settings',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload logo
     * 
     * POST /api/v1/settings/report-branding/logo
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'logo' => 'required|image|mimes:png,jpg,jpeg,svg|max:1024', // 1MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Check if table exists
            if (!DB::getSchemaBuilder()->hasTable('report_branding')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Report branding table does not exist. Please run migrations.',
                ], 503);
            }

            $file = $request->file('logo');
            $extension = $file->getClientOriginalExtension();
            $filename = 'logo.' . $extension;
            $path = $file->storeAs('branding', $filename, 'public');
            
            $publicUrl = Storage::url($path);
            
            // Update or create branding record
            $existing = DB::table('report_branding')->first();
            
            if ($existing) {
                // Delete old logo if exists
                if ($existing->logo_path && Storage::disk('public')->exists($existing->logo_path)) {
                    Storage::disk('public')->delete($existing->logo_path);
                }
                
                DB::table('report_branding')
                    ->where('id', $existing->id)
                    ->update([
                        'logo_url' => $publicUrl,
                        'logo_path' => $path,
                        'updated_at' => now(),
                    ]);
            } else {
                DB::table('report_branding')->insert([
                    'company_name' => 'VOMS',
                    'logo_url' => $publicUrl,
                    'logo_path' => $path,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Logo uploaded successfully',
                'data' => [
                    'logoUrl' => $publicUrl,
                    'logoPath' => $path,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error uploading logo', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload logo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete logo
     * 
     * DELETE /api/v1/settings/report-branding/logo
     */
    public function deleteLogo(): JsonResponse
    {
        try {
            // Check if table exists
            if (!DB::getSchemaBuilder()->hasTable('report_branding')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Report branding table does not exist. Please run migrations.',
                ], 503);
            }

            $branding = DB::table('report_branding')->first();
            
            if (!$branding || !$branding->logo_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'No logo to delete',
                ], 404);
            }

            // Delete file
            if (Storage::disk('public')->exists($branding->logo_path)) {
                Storage::disk('public')->delete($branding->logo_path);
            }

            // Update record
            DB::table('report_branding')
                ->where('id', $branding->id)
                ->update([
                    'logo_url' => null,
                    'logo_path' => null,
                    'updated_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Logo deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error deleting logo', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete logo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get default branding settings
     */
    private function getDefaultBranding(): array
    {
        return [
            'id' => null,
            'logoUrl' => null,
            'companyName' => 'VOMS',
            'tradingAs' => null,
            'addressLine1' => null,
            'addressLine2' => null,
            'phone' => null,
            'email' => null,
            'website' => null,
            'gstin' => null,
            'primaryColor' => '#2563eb',
            'secondaryColor' => '#1e40af',
            'showLogoInHeader' => true,
            'showAddressInHeader' => true,
            'showContactInFooter' => true,
            'addWatermarkToPhotos' => false,
            'includeQRCode' => false,
            'footerText' => null,
            'createdAt' => null,
            'updatedAt' => null,
        ];
    }
}

