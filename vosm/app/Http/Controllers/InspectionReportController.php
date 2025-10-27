<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Barryvdh\DomPDF\Facade\Pdf;

class InspectionReportController extends Controller
{
    public function generate(Request $request, string $id): JsonResponse
    {
        $inspection = Inspection::with([
            'template.sections.questions.options',
            'vehicle',
            'inspector',
            'reviewer',
            'answers.question'
        ])->findOrFail($id);

        $format = $request->input('format', 'detailed');
        
        $pdf = Pdf::loadView('reports.inspection', [
            'inspection' => $inspection,
            'format' => $format,
            'company' => [
                'name' => 'VOMS',
                'logo' => public_path('logo.png'),
                'address' => 'Your Company Address'
            ]
        ]);

        return $pdf->download("VIR-{$inspection->id}.pdf");
    }

    public function email(Request $request, string $id): JsonResponse
    {
        $inspection = Inspection::findOrFail($id);
        
        $request->validate([
            'email' => 'required|email',
            'subject' => 'nullable|string',
            'message' => 'nullable|string'
        ]);

        // Generate PDF
        $pdf = $this->generate($request, $id);
        
        // TODO: Send email with PDF attachment
        // This would require implementing email service
        
        return response()->json(['message' => 'Report sent successfully']);
    }

    public function share(Request $request, string $id): JsonResponse
    {
        $inspection = Inspection::findOrFail($id);
        
        $request->validate([
            'expires_at' => 'nullable|date|after:now'
        ]);

        // TODO: Generate shareable link with expiry
        // This would require implementing a sharing system
        
        return response()->json([
            'share_url' => url("/inspections/{$id}/shared"),
            'expires_at' => $request->expires_at
        ]);
    }
}

