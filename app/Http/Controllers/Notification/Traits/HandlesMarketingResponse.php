<?php

namespace App\Http\Controllers\Notification\Traits;

use App\Models\Order;
use App\Models\Notification;
use App\Models\TaskResponse;
use App\Models\WorkplanItem;
use App\Models\SurveyResults;
use App\Models\SurveyUlang;
use App\Models\Moodboard;
use App\Models\Estimasi;
use App\Models\CommitmentFee;
use App\Models\ItemPekerjaan;
use App\Models\RabInternal;
use App\Models\Kontrak;
use App\Models\Invoice;
use App\Models\GambarKerja;
use Illuminate\Support\Facades\DB;

trait HandlesMarketingResponse
{
    /**
     * Authorization: any Kepala Marketing assigned to the order can respond marketing.
     */
    private function ensureOriginalKepalaMarketing(Order $order)
    {
        $user = auth()->user();
        if (!$user || !$user->role || $user->role->nama_role !== 'Kepala Marketing') {
            return redirect()->back()->with('error', 'Unauthorized. Only Kepala Marketing can perform marketing response.');
        }

        $isAssignedKepalaMarketing = $order->users()
            ->whereHas('role', fn($q) => $q->where('nama_role', 'Kepala Marketing'))
            ->where('users.id', $user->id)
            ->exists();

        if (!$isAssignedKepalaMarketing) {
            return redirect()->back()->with('error', 'Unauthorized. Only Kepala Marketing assigned to this order can respond.');
        }

        return null;
    }

    private function markMarketingTaskResponseDone(Order $order, string $tahap): void
    {
        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', $tahap)
            ->where('is_marketing', true)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();

        if ($taskResponse) {
            $taskResponse->update([
                'response_time' => now(),
                'status' => 'selesai',
                'user_id' => auth()->id(),
            ]);
        }
    }

    /**
     * Handle marketing response based on notification type.
     */
    private function handleMarketingResponse(Notification $notification, Order $order)
    {
        switch ($notification->type) {
            case Notification::TYPE_SURVEY_REQUEST: {
                $survey = $order->surveyResults;
                if (!$survey) {
                    $survey = SurveyResults::create([
                        'order_id' => $order->id,
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                        'is_draft' => true,
                    ]);
                } else {
                    $survey->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'survey');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Survey).');
            }

            case Notification::TYPE_SURVEY_SCHEDULE_REQUEST: {
                $order->update([
                    'pm_survey_response_time' => now(),
                    'pm_survey_response_by' => auth()->user()->name ?? 'Admin',
                ]);

                // Marketing task for early stage uses tahap 'survey'
                $this->markMarketingTaskResponseDone($order, 'survey_schedule');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Survey Schedule).');
            }

            case Notification::TYPE_FINAL_DESIGN_REQUEST: {
                // No record creation, just mark task as done
                $order->moodboard->update([
                    'pm_response_final_time' => now(),
                    'pm_response_final_by' => auth()->user()->name ?? 'Admin',
                ]);
                $this->markMarketingTaskResponseDone($order, 'desain_final');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Design Approval).');
            }

            case Notification::TYPE_MOODBOARD_REQUEST: {
                $moodboard = $order->moodboard;
                if (!$moodboard) {
                    $moodboard = Moodboard::create([
                        'order_id' => $order->id,
                        'status' => 'pending',
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                } else {
                    $moodboard->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'moodboard');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Moodboard).');
            }

            case Notification::TYPE_ESTIMASI_REQUEST: {
                if (!$order->moodboard) {
                    return redirect()->route('notifications.index')->with('error', 'Moodboard belum ada untuk order ini.');
                }

                // Create placeholder estimasi if not exists.
                $estimasi = $order->estimasi;
                if (!$estimasi) {
                    Estimasi::create([
                        'moodboard_id' => $order->moodboard->id,
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                } else {
                    $estimasi->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'estimasi');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Estimasi).');
            }

            case Notification::TYPE_COMMITMENT_FEE_REQUEST: {
                if (!$order->moodboard) {
                    return redirect()->route('notifications.index')->with('error', 'Moodboard belum ada untuk order ini.');
                }

                $commitmentFee = $order->moodboard->commitmentFee;
                if (!$commitmentFee) {
                    CommitmentFee::create([
                        'moodboard_id' => $order->moodboard->id,
                        'payment_status' => 'pending',
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                } else {
                    $commitmentFee->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'cm_fee');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Commitment Fee).');
            }

            case Notification::TYPE_SURVEY_ULANG_REQUEST: {
                $surveyUlang = $order->surveyUlang;
                if (!$surveyUlang) {
                    SurveyUlang::create([
                        'order_id' => $order->id,
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                } else {
                    $surveyUlang->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'survey_ulang');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Survey Ulang).');
            }

            case Notification::TYPE_GAMBAR_KERJA_REQUEST: {
                $gambarKerja = $order->gambarKerja;
                if ($gambarKerja) {
                    $gambarKerja->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'gambar_kerja');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Gambar Kerja).');
            }

            case Notification::TYPE_ITEM_PEKERJAAN_REQUEST: {
                if (!$order->moodboard) {
                    return redirect()->route('notifications.index')->with('error', 'Moodboard belum ada untuk order ini.');
                }

                $existingItem = $order->itemPekerjaans->first();
                if (!$existingItem) {
                    ItemPekerjaan::create([
                        'moodboard_id' => $order->moodboard->id,
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                } else {
                    $existingItem->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'item_pekerjaan');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Item Pekerjaan).');
            }

            case Notification::TYPE_RAB_INTERNAL_REQUEST: {
                $itemPekerjaan = $order->itemPekerjaans->first();
                if ($itemPekerjaan) {
                    if ($itemPekerjaan->rabInternal) {
                        $itemPekerjaan->rabInternal->update([
                            'pm_response_time' => now(),
                            'pm_response_by' => auth()->user()->name ?? 'Admin',
                        ]);
                    } else {
                        RabInternal::create([
                            'item_pekerjaan_id' => $itemPekerjaan->id,
                            'pm_response_time' => now(),
                            'pm_response_by' => auth()->user()->name ?? 'Admin',
                        ]);
                    }
                }

                $taskResponse = TaskResponse::where('order_id', $order->id)
                    ->where('tahap', 'rab_internal')
                    ->where('is_marketing', true)
                    ->orderByDesc('extend_time')
                    ->orderByDesc('updated_at')
                    ->orderByDesc('id')
                    ->first();

                if (!$taskResponse) {
                    $taskResponse = TaskResponse::create([
                        'order_id' => $order->id,
                        'user_id' => null,
                        'tahap' => 'rab_internal',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3),
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                        'is_marketing' => true,
                    ]);
                }

                $taskResponse->update([
                    'response_time' => now(),
                    'status' => 'selesai',
                    'user_id' => auth()->id(),
                ]);

                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (RAB Internal).');
            }

            case Notification::TYPE_INVOICE_REQUEST: {
                $itemPekerjaan = $order->itemPekerjaans->first();
                if ($itemPekerjaan) {
                    $invoice = $itemPekerjaan->invoices?->sortBy('termin_step')->first();
                    if ($invoice) {
                        $invoice->update([
                            'pm_response_time' => now(),
                            'pm_response_by' => auth()->user()->name ?? 'Admin',
                        ]);
                    } else {
                        Invoice::create([
                            'item_pekerjaan_id' => $itemPekerjaan->id,
                            'rab_kontrak_id' => $itemPekerjaan->rabKontrak->id,
                            'pm_response_time' => now(),
                            'pm_response_by' => auth()->user()->name ?? 'Admin',
                        ]);
                    }
                }

                $taskResponse = TaskResponse::where('order_id', $order->id)
                    ->where('tahap', 'invoice')
                    ->where('is_marketing', true)
                    ->orderByDesc('extend_time')
                    ->orderByDesc('updated_at')
                    ->orderByDesc('id')
                    ->first();

                if (!$taskResponse) {
                    $taskResponse = TaskResponse::create([
                        'order_id' => $order->id,
                        'user_id' => null,
                        'tahap' => 'invoice',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3),
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                        'is_marketing' => true,
                    ]);
                }

                $taskResponse->update([
                    'response_time' => now(),
                    'status' => 'selesai',
                    'user_id' => auth()->id(),
                ]);

                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Invoice).');
            }

            case Notification::TYPE_KONTRAK_REQUEST: {
                $itemPekerjaan = $order->itemPekerjaans->first();
                if (!$itemPekerjaan) {
                    return redirect()->route('notifications.index')->with('error', 'Item pekerjaan belum ada untuk order ini.');
                }

                if ($itemPekerjaan->kontrak) {
                    $itemPekerjaan->kontrak->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                } else {
                    Kontrak::create([
                        'item_pekerjaan_id' => $itemPekerjaan->id,
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'kontrak');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Kontrak).');
            }

            case Notification::TYPE_WORKPLAN_REQUEST: {
                if ($order->moodboard) {
                    $workplanItems = $order->moodboard
                        ->itemPekerjaans
                        ->flatMap(fn($ip) => $ip->produks)
                        ->flatMap(fn($produk) => $produk->workplanItems);

                    DB::transaction(function () use ($order, $workplanItems) {
                        if ($workplanItems->isEmpty()) {
                            // CREATE new workplan items with PM response tracking
                            foreach ($order->moodboard->itemPekerjaans as $itemPekerjaan) {
                                foreach ($itemPekerjaan->produks as $produk) {
                                    // Create empty workplan items based on default breakdown
                                    $defaultBreakdown = WorkplanItemController::defaultBreakdown();
                                    foreach ($defaultBreakdown as $index => $stage) {
                                        WorkplanItem::create([
                                            'item_pekerjaan_produk_id' => $produk->id,
                                            'nama_tahapan' => $stage['nama_tahapan'],
                                            'start_date' => null,
                                            'end_date' => null,
                                            'duration_days' => null,
                                            'urutan' => $index + 1,
                                            'status' => 'planned',
                                            'catatan' => null,
                                            'pm_response_time' => now(),
                                            'pm_response_by' => auth()->user()->name ?? 'Admin',
                                        ]);
                                    }
                                }
                            }
                        } else {
                            // UPDATE existing workplan items - only pm_response_time & pm_response_by
                            foreach ($workplanItems as $item) {
                                $item->update([
                                    'pm_response_time' => now(),
                                    'pm_response_by' => auth()->user()->name ?? 'Admin',
                                ]);
                            }
                        }
                    });
                }

                $this->markMarketingTaskResponseDone($order, 'workplan');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Workplan).');
            }

            case Notification::TYPE_JADWAL_MEETING_VENDOR_REQUEST: {
                $meeting = $order->meetingVendor;
                if ($meeting) {
                    $meeting->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                } else {
                    \App\Models\MeetingVendor::create([
                        'order_id' => $order->id,
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'meeting_vendor');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Meeting Vendor).');
            }

            case Notification::TYPE_APPROVAL_MATERIAL_REQUEST: {
                $itemPekerjaan = $order->itemPekerjaans->first();
                if ($itemPekerjaan) {
                    $itemPekerjaan->update([
                        'pm_approval_rab_response_time' => now(),
                        'pm_approval_rab_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'approval_material');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Approval Material).');
            }

            default:
                return redirect()->route('notifications.index')
                    ->with('error', 'Notification type tidak mendukung marketing response.');
        }
    }

}
