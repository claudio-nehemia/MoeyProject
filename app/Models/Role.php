<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['nama_role', 'divisi_id'];

    public function divisi()
    {
        return $this->belongsTo(Divisi::class, 'divisi_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'role_id');
    }

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permission');
    }

    /**
     * Sync permissions for this role
     */
    public function syncPermissions(array $permissions)
    {
        $permissionIds = Permission::whereIn('name', $permissions)->pluck('id')->toArray();
        $this->permissions()->sync($permissionIds);
    }

    /**
     * Check if role has permission
     */
    public function hasPermission(string $permission): bool
    {
        return $this->permissions()->where('name', $permission)->exists();
    }

    /**
     * Get all permission names for this role
     */
    /**
     * Get ID of Kepala Marketing role (by ID, robust against name changes)
     */
    public static function getKepalaMarketingRoleId(): int
    {
        static $cachedId = null;
        if ($cachedId !== null) {
            return $cachedId;
        }
        $role = static::where('nama_role', 'Kepala Marketing')->first();
        $cachedId = $role ? (int) $role->id : 11;
        return $cachedId;
    }
}
