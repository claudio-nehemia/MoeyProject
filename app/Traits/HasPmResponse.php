<?php

namespace App\Traits;

trait HasPmResponse
{
    /**
     * Check if user is Kepala Marketing
     */
    protected function isProjectManager($user): bool
    {
        return $user && ($user->role_id == \App\Models\Role::getKepalaMarketingRoleId());
    }

    /**
     * Record PM response
     */
    protected function recordPmResponse($model): void
    {
        if ($this->isProjectManager(auth()->user())) {
            $model->update([
                'pm_response_time' => now(),
                'pm_response_by' => auth()->user()->name,
            ]);
        }
    }

    /**
     * Check if PM has responded
     */
    protected function hasPmResponse($model): bool
    {
        return $model->pm_response_time !== null;
    }
}
