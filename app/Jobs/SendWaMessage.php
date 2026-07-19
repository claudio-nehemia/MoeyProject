<?php

namespace App\Jobs;

use App\Models\Device;
use App\Models\Pengaturanumum;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendWaMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Jumlah percobaan sebelum job dianggap gagal.
     */
    public int $tries = 3;

    protected string $phoneNumber;
    protected string $message;
    protected bool $birthday;

    public function __construct(string $phoneNumber, string $message, bool $birthday = false)
    {
        $this->phoneNumber = $phoneNumber;
        $this->message = $message;
        $this->birthday = $birthday;
    }

    public function handle(): void
    {
        $generalsetting = Pengaturanumum::where('id', 1)->first();
        if (!$generalsetting) {
            Log::warning('SendWaMessage: Pengaturan umum tidak ditemukan');
            return;
        }

        $apiKey = $generalsetting->wa_api_key;
        $domainWaGateway = $generalsetting->domain_wa_gateway;
        $providerWa = $generalsetting->provider_wa;
        $tujuanNotifikasi = $generalsetting->tujuan_notifikasi_wa;
        Log::info('SendWaMessage: Pengaturan umum', [
            'apiKey' => $apiKey,
            'domainWaGateway' => $domainWaGateway,
            'providerWa' => $providerWa,
            'tujuanNotifikasi' => $tujuanNotifikasi,
            'phoneNumber' => $this->phoneNumber,
        ]);
        if ($this->birthday) {
            $penerima = $this->phoneNumber;
        } else {
            $penerima = $tujuanNotifikasi == 1 ? $generalsetting->id_group_wa : $this->phoneNumber;
        }

        Log::info('SendWaMessage: Penerima', [
            'penerima' => $penerima,
            'tujuanNotifikasi' => $tujuanNotifikasi,
            'id_group_wa' => $generalsetting->id_group_wa,
            'phoneNumber' => $this->phoneNumber,
        ]);
        
        if (empty($penerima)) {
            Log::warning('SendWaMessage: Nomor penerima kosong', [
                'tujuanNotifikasi' => $tujuanNotifikasi,
                'phoneNumber' => $this->phoneNumber,
                'id_group_wa' => $generalsetting->id_group_wa,
            ]);
            return;
        }

        if ($providerWa === 'fe') {
            $curl = curl_init();
            curl_setopt_array($curl, array(
                CURLOPT_URL => 'https://api.fonnte.com/send',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_POSTFIELDS => array(
                    'target' => $penerima,
                    'message' => $this->message,
                    'filename' => 'filename',
                    'schedule' => 0,
                    'typing' => true,
                    'delay' => '2',
                    'countryCode' => '62',
                    'followup' => 0,
                ),
                CURLOPT_HTTPHEADER => array(
                    'Authorization: ' . $apiKey
                ),
            ));

            $response = curl_exec($curl);
            $errno = curl_errno($curl);
            $err = $errno ? curl_error($curl) : null;
            $httpCode = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);

            Log::info('SendWaMessage: Fonnte response', [
                'http' => $httpCode,
                'response' => $response,
                'errno' => $errno,
                'error' => $err,
            ]);

            if ($errno || $httpCode >= 400) {
                throw new \RuntimeException('SendWaMessage Fonnte gagal: ' . ($err ?: ('HTTP ' . $httpCode)));
            }
            return;
        }

        $domain = (string) $domainWaGateway;
        if (!str_starts_with($domain, 'http://') && !str_starts_with($domain, 'https://')) {
            $domain = 'http://' . $domain;
        }
        $url = rtrim($domain, '/') . '/send-message';
        $sender = Device::where('status', 1)->first();
        if (!$sender) {
            Log::warning('SendWaMessage: Device sender aktif tidak ditemukan');
            return;
        }

        $payload = [
            'api_key' => $apiKey,
            'sender' => $sender->number,
            'number' => $penerima,
            'message' => $this->message,
        ];

        $response = Http::timeout(30)
            ->asJson()
            ->post($url, $payload);

        Log::info('SendWaMessage: Gateway response', [
            'http' => $response->status(),
            'response' => $response->body(),
            'payload' => $payload,
            'url' => $url,
            'sender' => $sender->number,
            'penerima' => $penerima,
            'message' => $this->message,
            'api_key' => $apiKey,
            'domain_wa_gateway' => $domainWaGateway,
            'provider_wa' => $providerWa,
            'tujuan_notifikasi' => $tujuanNotifikasi,
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException('SendWaMessage Gateway gagal: HTTP ' . $response->status());
        }
    }
}
