<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Admin - Full access semua module
        $admin = Role::where('nama_role', 'Admin')->first();
        if ($admin) {
            $allPermissions = Permission::pluck('name')->toArray();
            $admin->syncPermissions($allPermissions);
        }

        // Legal Admin - Commitment Fee, Kontrak, Invoice
        $legalAdmin = Role::where('nama_role', 'Legal Admin')->first();
        if ($legalAdmin) {
            $legalPermissions = Permission::whereIn('group', [
                'Operations - Commitment Fee',
                'Operations - Kontrak',
                'Operations - Invoice'
            ])->pluck('name')->toArray();
            $legalAdmin->syncPermissions($legalPermissions);
        }

        // Customer Service - View Orders only
        $customerService = Role::where('nama_role', 'Customer Service')->first();
        if ($customerService) {
            $csPermissions = Permission::where('group', 'Operations - Order')
                ->whereIn('name', ['order.index', 'order.show'])
                ->pluck('name')->toArray();
            $customerService->syncPermissions($csPermissions);
        }

        // Surveyor - Survey Results (CRUD)
        $surveyor = Role::where('nama_role', 'Surveyor')->first();
        if ($surveyor) {
            $surveyorPermissions = Permission::where('group', 'Operations - Survey')
                ->pluck('name')->toArray();
            $surveyor->syncPermissions($surveyorPermissions);
        }

        // Drafter - Survey Results, Moodboard (partial)
        $drafter = Role::where('nama_role', 'Drafter')->first();
        if ($drafter) {
            $drafterPermissions = Permission::where('group', 'Operations - Survey')
                ->pluck('name')->toArray();
            
            // Add partial moodboard permissions
            $moodboardPartial = Permission::where('group', 'Operations - Moodboard')
                ->whereIn('name', [
                    'moodboard.index',
                    'moodboard.show',
                    'moodboard.upload-kasar',
                    'moodboard.upload-final',
                    'moodboard.edit'
                ])->pluck('name')->toArray();
            
            $drafterPermissions = array_merge($drafterPermissions, $moodboardPartial);
            $drafter->syncPermissions($drafterPermissions);
        }

        // Estimator - Estimasi, RAB (full), PDF Export
        $estimator = Role::where('nama_role', 'Estimator')->first();
        if ($estimator) {
            $estimatorPermissions = Permission::whereIn('group', [
                'Operations - Estimasi',
                'Operations - RAB Internal',
                'Operations - RAB Jasa',
                'Operations - RAB Vendor',
                'Operations - RAB Kontrak',
                'Operations - Item Pekerjaan'
            ])->pluck('name')->toArray();
            
            // Add PDF export permissions
            $pdfExportPermissions = Permission::where('name', 'LIKE', '%.export-pdf')
                ->pluck('name')->toArray();
            
            $estimatorPermissions = array_merge($estimatorPermissions, $pdfExportPermissions);
            $estimator->syncPermissions($estimatorPermissions);
        }

        // Desainer - Moodboard, Desain Final, Item Pekerjaan
        $desainer = Role::where('nama_role', 'Desainer')->first();
        if ($desainer) {
            $desainerPermissions = Permission::whereIn('group', [
                'Operations - Moodboard',
                'Operations - Desain Final',
                'Operations - Item Pekerjaan'
            ])->pluck('name')->toArray();
            $desainer->syncPermissions($desainerPermissions);
        }

        // Owner - View-only semua module
        $owner = Role::where('nama_role', 'Owner')->first();
        if ($owner) {
            $ownerPermissions = Permission::where(function($query) {
                $query->where('name', 'LIKE', '%.index')
                      ->orWhere('name', 'LIKE', '%.show');
            })->pluck('name')->toArray();
            $owner->syncPermissions($ownerPermissions);
        }

        // Supervisor - Project Management (view), Defect (full)
        $supervisor = Role::where('nama_role', 'Supervisor')->first();
        if ($supervisor) {
            // Project Management view only
            $pmViewPermissions = Permission::where('group', 'Operations - Project Management')
                ->whereIn('name', ['project-management.index', 'project-management.show'])
                ->pluck('name')->toArray();
            
            // Defect full access
            $defectPermissions = Permission::where('group', 'Operations - Defect')
                ->pluck('name')->toArray();
            
            $supervisorPermissions = array_merge($pmViewPermissions, $defectPermissions);
            $supervisor->syncPermissions($supervisorPermissions);
        }

        // Project Manager - Project Management (full), Defect (full)
        $projectManager = Role::where('nama_role', 'Project Manager')->first();
        if ($projectManager) {
            $pmPermissions = Permission::whereIn('group', [
                'Operations - Project Management',
                'Operations - Defect'
            ])->pluck('name')->toArray();
            $projectManager->syncPermissions($pmPermissions);
        }

        // Kepala Marketing - RAB (view), Moodboard (approve/revise)
        $kepalaMarketing = Role::where('nama_role', 'Kepala Marketing')->first();
        if ($kepalaMarketing) {
            // RAB view only
            $rabViewPermissions = Permission::where(function($query) {
                $query->where('group', 'LIKE', 'Operations - RAB%');
            })->where(function($query) {
                $query->where('name', 'LIKE', '%.index')
                      ->orWhere('name', 'LIKE', '%.show');
            })->pluck('name')->toArray();
            
            // Moodboard approve/revise
            $moodboardApprovePermissions = Permission::where('group', 'Operations - Moodboard')
                ->whereIn('name', [
                    'moodboard.index',
                    'moodboard.show',
                    'moodboard.response',
                    'moodboard.revise',
                    'moodboard.accept'
                ])->pluck('name')->toArray();
            
            $kepalaMarketingPermissions = array_merge($rabViewPermissions, $moodboardApprovePermissions);
            $kepalaMarketing->syncPermissions($kepalaMarketingPermissions);
        }
    }
}
