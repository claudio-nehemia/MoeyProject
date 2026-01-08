<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'nama_project',
        'company_name',
        'customer_name',
        'customer_additional_info',
        'nomor_unit',
        'phone_number',
        'tanggal_masuk_customer',
        'project_status',
        'priority_level',
        'jenis_interior_id',
        'mom_file',
        'tanggal_survey',
        'payment_status',
        'tahapan_proyek',
        'alamat',
    ];

    public function jenisInterior()
    {
        return $this->belongsTo(JenisInterior::class, 'jenis_interior_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'order_teams')
            ->withTimestamps();
    }

    public function surveyResults()
    {
        return $this->hasOne(SurveyResults::class, 'order_id');
    }

    public function moodboard()
    {
        return $this->hasOne(Moodboard::class, 'order_id');
    }

    public function itemPekerjaans()
    {
        return $this->hasManyThrough(
            ItemPekerjaan::class,
            Moodboard::class,
            'order_id', // Foreign key on moodboard table
            'moodboard_id', // Foreign key on item_pekerjaans table
            'id', // Local key on orders table
            'id' // Local key on moodboard table
        );
    }

    public function getProgressAttribute()
    {
        $items = $this->itemPekerjaans;
        if ($items->count() === 0)
            return 0;


        return round($items->avg->progress, 2);
    }

    public function surveyUlang()
    {
        return $this->hasOne(SurveyUlang::class);
    }

    public function surveyScheduleUsers()
    {
        return $this->hasMany(SurveyScheduleUser::class);
    }

    public function surveyUsers()
    {
        return $this->belongsToMany(
            \App\Models\User::class,
            'survey_schedule_users'
        );
    }

    public function gambarKerja()
    {
        return $this->hasOne(GambarKerja::class);
    }

    /**
     * Scope untuk filter order berdasarkan role dan team
     */
    public function scopeVisibleToUser($query, $user = null)
    {
        // Jika tidak ada user, return query kosong
        if (!$user) {
            return $query->whereRaw('1 = 0');
        }

        // Roles yang hanya bisa melihat order dimana mereka adalah team member
        $restrictedRoles = ['Surveyor', 'Drafter', 'Desainer'];
        
        // Load role jika belum di-load
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }
        
        // Cek apakah user memiliki role yang dibatasi
        if ($user->role && in_array($user->role->nama_role, $restrictedRoles)) {
            // Filter hanya order dimana user adalah team member
            return $query->whereHas('users', function($q) use ($user) {
                $q->where('users.id', $user->id);
            });
        }
        
        // Role lain bisa melihat semua order
        return $query;
    }

    /**
     * Scope untuk filter order berdasarkan survey schedule users
     * Untuk menu: Survey Ulang, Gambar Kerja, Approval Material, Workplan, Project Management, Defect Management
     */
    public function scopeVisibleToSurveyUser($query, $user = null)
    {
        // Jika tidak ada user, return query kosong
        if (!$user) {
            return $query->whereRaw('1 = 0');
        }

        // Roles yang hanya bisa melihat order dimana mereka masuk survey schedule
        $restrictedRoles = ['Surveyor', 'Drafter', 'Desainer', 'Project Manager', 'Supervisor'];
        
        // Load role jika belum di-load
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }
        
        // Cek apakah user memiliki role yang dibatasi
        if ($user->role && in_array($user->role->nama_role, $restrictedRoles)) {
            // Filter hanya order dimana user masuk dalam survey schedule users
            return $query->whereHas('surveyUsers', function($q) use ($user) {
                $q->where('users.id', $user->id);
            });
        }
        
        // Role lain bisa melihat semua order
        return $query;
    }
}
