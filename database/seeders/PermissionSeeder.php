<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // ==================== MASTER DATA ====================
            
            // Divisi Permissions
            [
                'name' => 'divisi.index',
                'display_name' => 'View Divisi List',
                'group' => 'Master Data - Divisi'
            ],
            [
                'name' => 'divisi.show',
                'display_name' => 'View Divisi Detail',
                'group' => 'Master Data - Divisi'
            ],
            [
                'name' => 'divisi.create',
                'display_name' => 'Create Divisi',
                'group' => 'Master Data - Divisi'
            ],
            [
                'name' => 'divisi.edit',
                'display_name' => 'Edit Divisi',
                'group' => 'Master Data - Divisi'
            ],
            [
                'name' => 'divisi.delete',
                'display_name' => 'Delete Divisi',
                'group' => 'Master Data - Divisi'
            ],
            
            // Role Permissions
            [
                'name' => 'role.index',
                'display_name' => 'View Role List',
                'group' => 'Master Data - Role'
            ],
            [
                'name' => 'role.show',
                'display_name' => 'View Role Detail',
                'group' => 'Master Data - Role'
            ],
            [
                'name' => 'role.create',
                'display_name' => 'Create Role',
                'group' => 'Master Data - Role'
            ],
            [
                'name' => 'role.edit',
                'display_name' => 'Edit Role & Permissions',
                'group' => 'Master Data - Role'
            ],
            [
                'name' => 'role.delete',
                'display_name' => 'Delete Role',
                'group' => 'Master Data - Role'
            ],
            
            // User Permissions
            [
                'name' => 'user.index',
                'display_name' => 'View User List',
                'group' => 'Master Data - User'
            ],
            [
                'name' => 'user.show',
                'display_name' => 'View User Detail',
                'group' => 'Master Data - User'
            ],
            [
                'name' => 'user.create',
                'display_name' => 'Create User',
                'group' => 'Master Data - User'
            ],
            [
                'name' => 'user.edit',
                'display_name' => 'Edit User',
                'group' => 'Master Data - User'
            ],
            [
                'name' => 'user.delete',
                'display_name' => 'Delete User',
                'group' => 'Master Data - User'
            ],
            
            // Jenis Interior Permissions
            [
                'name' => 'jenis-interior.index',
                'display_name' => 'View Interior Type List',
                'group' => 'Master Data - Interior Type'
            ],
            [
                'name' => 'jenis-interior.show',
                'display_name' => 'View Interior Type Detail',
                'group' => 'Master Data - Interior Type'
            ],
            [
                'name' => 'jenis-interior.create',
                'display_name' => 'Create Interior Type',
                'group' => 'Master Data - Interior Type'
            ],
            [
                'name' => 'jenis-interior.edit',
                'display_name' => 'Edit Interior Type',
                'group' => 'Master Data - Interior Type'
            ],
            [
                'name' => 'jenis-interior.delete',
                'display_name' => 'Delete Interior Type',
                'group' => 'Master Data - Interior Type'
            ],
            
            // Jenis Item Permissions
            [
                'name' => 'jenis-item.index',
                'display_name' => 'View Item Type List',
                'group' => 'Master Data - Item Type'
            ],
            [
                'name' => 'jenis-item.show',
                'display_name' => 'View Item Type Detail',
                'group' => 'Master Data - Item Type'
            ],
            [
                'name' => 'jenis-item.create',
                'display_name' => 'Create Item Type',
                'group' => 'Master Data - Item Type'
            ],
            [
                'name' => 'jenis-item.edit',
                'display_name' => 'Edit Item Type',
                'group' => 'Master Data - Item Type'
            ],
            [
                'name' => 'jenis-item.delete',
                'display_name' => 'Delete Item Type',
                'group' => 'Master Data - Item Type'
            ],
            
            // Item Permissions
            [
                'name' => 'item.index',
                'display_name' => 'View Item List',
                'group' => 'Master Data - Item'
            ],
            [
                'name' => 'item.show',
                'display_name' => 'View Item Detail',
                'group' => 'Master Data - Item'
            ],
            [
                'name' => 'item.create',
                'display_name' => 'Create Item',
                'group' => 'Master Data - Item'
            ],
            [
                'name' => 'item.edit',
                'display_name' => 'Edit Item',
                'group' => 'Master Data - Item'
            ],
            [
                'name' => 'item.delete',
                'display_name' => 'Delete Item',
                'group' => 'Master Data - Item'
            ],
            
            // Produk Permissions
            [
                'name' => 'produk.index',
                'display_name' => 'View Product List',
                'group' => 'Master Data - Product'
            ],
            [
                'name' => 'produk.show',
                'display_name' => 'View Product Detail',
                'group' => 'Master Data - Product'
            ],
            [
                'name' => 'produk.create',
                'display_name' => 'Create Product',
                'group' => 'Master Data - Product'
            ],
            [
                'name' => 'produk.edit',
                'display_name' => 'Edit Product',
                'group' => 'Master Data - Product'
            ],
            [
                'name' => 'produk.delete',
                'display_name' => 'Delete Product',
                'group' => 'Master Data - Product'
            ],
            [
                'name' => 'produk.delete-image',
                'display_name' => 'Delete Product Image',
                'group' => 'Master Data - Product'
            ],
            
            // Termin Permissions
            [
                'name' => 'termin.index',
                'display_name' => 'View Termin List',
                'group' => 'Master Data - Termin'
            ],
            [
                'name' => 'termin.show',
                'display_name' => 'View Termin Detail',
                'group' => 'Master Data - Termin'
            ],
            [
                'name' => 'termin.create',
                'display_name' => 'Create Termin',
                'group' => 'Master Data - Termin'
            ],
            [
                'name' => 'termin.edit',
                'display_name' => 'Edit Termin',
                'group' => 'Master Data - Termin'
            ],
            [
                'name' => 'termin.delete',
                'display_name' => 'Delete Termin',
                'group' => 'Master Data - Termin'
            ],

            // Jenis Pengukuran Permissions
            [
                'name' => 'jenis-pengukuran.index',
                'display_name' => 'View Jenis Pengukuran List',
                'group' => 'Master Data - Jenis Pengukuran'
            ],
            [
                'name' => 'jenis-pengukuran.show',
                'display_name' => 'VIew Jenis Pengukuran Detail',
                'group' => 'Master Data - Jenis Pengukuran'
            ],
            [
                'name' => 'jenis-pengukuran.create',
                'display_name' => 'Create Jenis Pengukuran',
                'group' => 'Master Data - Jenis Pengukuran'
            ],
            [
                'name' => 'jenis-pengukuran.edit',
                'display_name' => 'Edit Jenis Pengukuran',
                'group' => 'Master Data - Jenis Pengukuran'
            ],
            [
                'name' => 'jenis-pengukuran.delete',
                'display_name' => 'Delete Jenis Pengukuran',
                'group' => 'Master Data - Jenis Pengukuran'
            ],
            
            // ==================== OPERATIONS ====================
            
            // Order Permissions
            [
                'name' => 'order.index',
                'display_name' => 'View Order List',
                'group' => 'Operations - Order'
            ],
            [
                'name' => 'order.show',
                'display_name' => 'View Order Detail',
                'group' => 'Operations - Order'
            ],
            [
                'name' => 'order.create',
                'display_name' => 'Create Order',
                'group' => 'Operations - Order'
            ],
            [
                'name' => 'order.edit',
                'display_name' => 'Edit Order',
                'group' => 'Operations - Order'
            ],
            [
                'name' => 'order.delete',
                'display_name' => 'Delete Order',
                'group' => 'Operations - Order'
            ],
            
            // Survey Results Permissions
            [
                'name' => 'survey-results.index',
                'display_name' => 'View Survey Results List',
                'group' => 'Operations - Survey'
            ],
            [
                'name' => 'survey-results.show',
                'display_name' => 'View Survey Result Detail',
                'group' => 'Operations - Survey'
            ],
            [
                'name' => 'survey-results.create',
                'display_name' => 'Create Survey Result',
                'group' => 'Operations - Survey'
            ],
            [
                'name' => 'survey-results.edit',
                'display_name' => 'Edit Survey Result',
                'group' => 'Operations - Survey'
            ],
            [
                'name' => 'survey-results.delete',
                'display_name' => 'Delete Survey Result',
                'group' => 'Operations - Survey'
            ],
            
            // Moodboard Permissions
            [
                'name' => 'moodboard.index',
                'display_name' => 'View Moodboard List',
                'group' => 'Operations - Moodboard'
            ],
            [
                'name' => 'moodboard.show',
                'display_name' => 'View Moodboard Detail',
                'group' => 'Operations - Moodboard'
            ],
            [
                'name' => 'moodboard.response',
                'display_name' => 'Response Moodboard',
                'group' => 'Operations - Moodboard'
            ],
            [
                'name' => 'moodboard.upload-kasar',
                'display_name' => 'Upload Desain Kasar',
                'group' => 'Operations - Moodboard'
            ],
            [
                'name' => 'moodboard.upload-final',
                'display_name' => 'Upload Desain Final',
                'group' => 'Operations - Moodboard'
            ],
            [
                'name' => 'moodboard.revise',
                'display_name' => 'Revise Moodboard',
                'group' => 'Operations - Moodboard'
            ],
            [
                'name' => 'moodboard.accept',
                'display_name' => 'Accept Moodboard',
                'group' => 'Operations - Moodboard'
            ],
            [
                'name' => 'moodboard.edit',
                'display_name' => 'Edit Moodboard',
                'group' => 'Operations - Moodboard'
            ],
            [
                'name' => 'moodboard.delete',
                'display_name' => 'Delete Moodboard',
                'group' => 'Operations - Moodboard'
            ],
            
            // Estimasi Permissions
            [
                'name' => 'estimasi.index',
                'display_name' => 'View Estimasi List',
                'group' => 'Operations - Estimasi'
            ],
            [
                'name' => 'estimasi.show',
                'display_name' => 'View Estimasi Detail',
                'group' => 'Operations - Estimasi'
            ],
            [
                'name' => 'estimasi.create',
                'display_name' => 'Create Estimasi',
                'group' => 'Operations - Estimasi'
            ],
            [
                'name' => 'estimasi.edit',
                'display_name' => 'Edit Estimasi',
                'group' => 'Operations - Estimasi'
            ],
            [
                'name' => 'estimasi.delete',
                'display_name' => 'Delete Estimasi',
                'group' => 'Operations - Estimasi'
            ],
            
            // Commitment Fee Permissions
            [
                'name' => 'commitment-fee.index',
                'display_name' => 'View Commitment Fee List',
                'group' => 'Operations - Commitment Fee'
            ],
            [
                'name' => 'commitment-fee.show',
                'display_name' => 'View Commitment Fee Detail',
                'group' => 'Operations - Commitment Fee'
            ],
            [
                'name' => 'commitment-fee.create',
                'display_name' => 'Create Commitment Fee',
                'group' => 'Operations - Commitment Fee'
            ],
            [
                'name' => 'commitment-fee.edit',
                'display_name' => 'Edit Commitment Fee',
                'group' => 'Operations - Commitment Fee'
            ],
            [
                'name' => 'commitment-fee.delete',
                'display_name' => 'Delete Commitment Fee',
                'group' => 'Operations - Commitment Fee'
            ],
            
            // // Desain Final Permissions
            [
                'name' => 'desain-final.index',
                'display_name' => 'View Desain Final List',
                'group' => 'Operations - Desain Final'
            ],
            [
                'name' => 'desain-final.show',
                'display_name' => 'View Desain Final Detail',
                'group' => 'Operations - Desain Final'
            ],
            [
                'name' => 'desain-final.create',
                'display_name' => 'Create Desain Final',
                'group' => 'Operations - Desain Final'
            ],
            [
                'name' => 'desain-final.edit',
                'display_name' => 'Edit Desain Final',
                'group' => 'Operations - Desain Final'
            ],
            [
                'name' => 'desain-final.delete',
                'display_name' => 'Delete Desain Final',
                'group' => 'Operations - Desain Final'
            ],
            
            // // Item Pekerjaan Permissions
            [
                'name' => 'item-pekerjaan.index',
                'display_name' => 'View Item Pekerjaan List',
                'group' => 'Operations - Item Pekerjaan'
            ],
            [
                'name' => 'item-pekerjaan.show',
                'display_name' => 'View Item Pekerjaan Detail',
                'group' => 'Operations - Item Pekerjaan'
            ],
            [
                'name' => 'item-pekerjaan.create',
                'display_name' => 'Create Item Pekerjaan',
                'group' => 'Operations - Item Pekerjaan'
            ],
            [
                'name' => 'item-pekerjaan.edit',
                'display_name' => 'Edit Item Pekerjaan',
                'group' => 'Operations - Item Pekerjaan'
            ],
            [
                'name' => 'item-pekerjaan.delete',
                'display_name' => 'Delete Item Pekerjaan',
                'group' => 'Operations - Item Pekerjaan'
            ],
            
            // // RAB Internal Permissions
            [
                'name' => 'rab-internal.index',
                'display_name' => 'View RAB Internal List',
                'group' => 'Operations - RAB Internal'
            ],
            [
                'name' => 'rab-internal.show',
                'display_name' => 'View RAB Internal Detail',
                'group' => 'Operations - RAB Internal'
            ],
            [
                'name' => 'rab-internal.create',
                'display_name' => 'Create RAB Internal',
                'group' => 'Operations - RAB Internal'
            ],
            [
                'name' => 'rab-internal.edit',
                'display_name' => 'Edit RAB Internal',
                'group' => 'Operations - RAB Internal'
            ],
            [
                'name' => 'rab-internal.delete',
                'display_name' => 'Delete RAB Internal',
                'group' => 'Operations - RAB Internal'
            ],
            
            // RAB Kontrak Permissions
            [
                'name' => 'rab-kontrak.index',
                'display_name' => 'View RAB Kontrak List',
                'group' => 'Operations - RAB Kontrak'
            ],
            [
                'name' => 'rab-kontrak.show',
                'display_name' => 'View RAB Kontrak Detail',
                'group' => 'Operations - RAB Kontrak'
            ],
            [
                'name' => 'rab-kontrak.create',
                'display_name' => 'Generate RAB Kontrak',
                'group' => 'Operations - RAB Kontrak'
            ],
            [
                'name' => 'rab-kontrak.edit',
                'display_name' => 'Regenerate RAB Kontrak',
                'group' => 'Operations - RAB Kontrak'
            ],
            [
                'name' => 'rab-kontrak.delete',
                'display_name' => 'Delete RAB Kontrak',
                'group' => 'Operations - RAB Kontrak'
            ],
            
            // RAB Vendor Permissions
            [
                'name' => 'rab-vendor.index',
                'display_name' => 'View RAB Vendor List',
                'group' => 'Operations - RAB Vendor'
            ],
            [
                'name' => 'rab-vendor.show',
                'display_name' => 'View RAB Vendor Detail',
                'group' => 'Operations - RAB Vendor'
            ],
            [
                'name' => 'rab-vendor.create',
                'display_name' => 'Generate RAB Vendor',
                'group' => 'Operations - RAB Vendor'
            ],
            [
                'name' => 'rab-vendor.edit',
                'display_name' => 'Regenerate RAB Vendor',
                'group' => 'Operations - RAB Vendor'
            ],
            [
                'name' => 'rab-vendor.delete',
                'display_name' => 'Delete RAB Vendor',
                'group' => 'Operations - RAB Vendor'
            ],
            
            // RAB Jasa Permissions
            [
                'name' => 'rab-jasa.index',
                'display_name' => 'View RAB Jasa List',
                'group' => 'Operations - RAB Jasa'
            ],
            [
                'name' => 'rab-jasa.show',
                'display_name' => 'View RAB Jasa Detail',
                'group' => 'Operations - RAB Jasa'
            ],
            [
                'name' => 'rab-jasa.create',
                'display_name' => 'Generate RAB Jasa',
                'group' => 'Operations - RAB Jasa'
            ],
            [
                'name' => 'rab-jasa.edit',
                'display_name' => 'Regenerate RAB Jasa',
                'group' => 'Operations - RAB Jasa'
            ],
            [
                'name' => 'rab-jasa.delete',
                'display_name' => 'Delete RAB Jasa',
                'group' => 'Operations - RAB Jasa'
            ],
            
            // Kontrak Permissions
            [
                'name' => 'kontrak.index',
                'display_name' => 'View Kontrak List',
                'group' => 'Operations - Kontrak'
            ],
            [
                'name' => 'kontrak.show',
                'display_name' => 'View Kontrak Detail',
                'group' => 'Operations - Kontrak'
            ],
            [
                'name' => 'kontrak.create',
                'display_name' => 'Create Kontrak',
                'group' => 'Operations - Kontrak'
            ],
            [
                'name' => 'kontrak.edit',
                'display_name' => 'Edit Kontrak',
                'group' => 'Operations - Kontrak'
            ],
            [
                'name' => 'kontrak.delete',
                'display_name' => 'Delete Kontrak',
                'group' => 'Operations - Kontrak'
            ],
            
            // Invoice Permissions
            [
                'name' => 'invoice.index',
                'display_name' => 'View Invoice List',
                'group' => 'Operations - Invoice'
            ],
            [
                'name' => 'invoice.show',
                'display_name' => 'View Invoice Detail',
                'group' => 'Operations - Invoice'
            ],
            [
                'name' => 'invoice.create',
                'display_name' => 'Create Invoice',
                'group' => 'Operations - Invoice'
            ],
            [
                'name' => 'invoice.edit',
                'display_name' => 'Edit Invoice',
                'group' => 'Operations - Invoice'
            ],
            [
                'name' => 'invoice.delete',
                'display_name' => 'Delete Invoice',
                'group' => 'Operations - Invoice'
            ],
            
            // Project Management Permissions
            [
                'name' => 'project-management.index',
                'display_name' => 'View Project List',
                'group' => 'Operations - Project Management'
            ],
            [
                'name' => 'project-management.show',
                'display_name' => 'View Project Detail',
                'group' => 'Operations - Project Management'
            ],
            [
                'name' => 'project-management.update-stage',
                'display_name' => 'Update Project Stage',
                'group' => 'Operations - Project Management'
            ],
            [
                'name' => 'project-management.bast',
                'display_name' => 'Generate & Download BAST',
                'group' => 'Operations - Project Management'
            ],
            [
                'name' => 'project-management.unlock-payment',
                'display_name' => 'Unlock Next Payment Step',
                'group' => 'Operations - Project Management'
            ],
            [
                'name' => 'project-management.request-perpanjangan',
                'display_name' => 'Request Timeline Extension',
                'group' => 'Operations - Project Management'
            ],
            [
                'name' => 'project-management.response-perpanjangan',
                'display_name' => 'Respond to Timeline Extension',
                'group' => 'Operations - Project Management'
            ],
            
            // Workplan Permissions
            [
                'name' => 'workplan.index',
                'display_name' => 'View Workplan List',
                'group' => 'Operations - Workplan'
            ],
            [
                'name' => 'workplan.show',
                'display_name' => 'View Workplan Detail',
                'group' => 'Operations - Workplan'
            ],
            [
                'name' => 'workplan.create',
                'display_name' => 'Create Workplan',
                'group' => 'Operations - Workplan'
            ],
            [
                'name' => 'workplan.edit',
                'display_name' => 'Edit Workplan',
                'group' => 'Operations - Workplan'
            ],
            [
                'name' => 'workplan.delete',
                'display_name' => 'Delete Workplan',
                'group' => 'Operations - Workplan'
            ],
            
            // Defect Management Permissions
            [
                'name' => 'defect.index',
                'display_name' => 'View Defect List',
                'group' => 'Operations - Defect Management'
            ],
            [
                'name' => 'defect.show',
                'display_name' => 'View Defect Detail',
                'group' => 'Operations - Defect Management'
            ],
            [
                'name' => 'defect.create',
                'display_name' => 'Create Defect',
                'group' => 'Operations - Defect Management'
            ],
            [
                'name' => 'defect.edit',
                'display_name' => 'Edit Defect',
                'group' => 'Operations - Defect Management'
            ],
            [
                'name' => 'defect.delete',
                'display_name' => 'Delete Defect',
                'group' => 'Operations - Defect Management'
            ],
            [
                'name' => 'defect.approve',
                'display_name' => 'Approve Defect Repair',
                'group' => 'Operations - Defect Management'
            ],

            // Survey Ulang
            [
                'name' => 'survey-ulang.index',
                'display_name' => 'View Survey Ulang List',
                'group' => 'Operations - Survey Ulang'
            ],

            [
                'name' => 'survey-ulang.start',
                'display_name' => 'Start Survey Ulang',
                'group' => 'Operations - Survey Ulang'
            ],

            [
                'name' => 'survey-ulang.create',
                'display_name' => 'Create Survey Ulang',
                'group' => 'Operations - Survey Ulang'
            ],

            [
                'name' => 'survey-ulang.store',
                'display_name' => 'Store Survey Ulang',
                'group' => 'Operations - Survey Ulang'
            ],

            [
                'name' => 'survey-ulang.show',
                'display_name' => 'Show Survey Ulang',
                'group' => 'Operations - Survey Ulang'
            ],

            [
                'name' => 'survey-ulang.edit',
                'display_name' => 'Edit Survey Ulang',
                'group' => 'Operations - Survey Ulang'
            ],

            [
                'name' => 'survey-ulang.update',
                'display_name' => 'Update Survey Ulang',
                'group' => 'Operations - Survey Ulang'
            ],
            
            // PDF Export Permissions
            [
                'name' => 'pdf.export',
                'display_name' => 'Export PDF Documents',
                'group' => 'Operations - Reports'
            ],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                [
                    'display_name' => $permission['display_name'],
                    'group' => $permission['group']
                ]
            );
        }

    }
}