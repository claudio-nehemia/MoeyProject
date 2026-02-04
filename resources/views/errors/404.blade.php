<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>404 - {{ config('app.name', 'Moey Admin') }}</title>

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    @vite(['resources/css/app.css'])
</head>
<body class="min-h-screen bg-gradient-to-br from-stone-50 via-violet-50 to-stone-50 text-stone-800">
    <div class="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div class="absolute inset-0 overflow-hidden">
            <div class="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-violet-200/40 blur-3xl"></div>
            <div class="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl"></div>
        </div>

        <div class="relative w-full max-w-2xl rounded-2xl border border-stone-200 bg-white/80 p-8 shadow-xl backdrop-blur">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-violet-600">404</p>
                    <h1 class="text-2xl font-semibold text-stone-900">Halaman tidak ditemukan</h1>
                </div>
            </div>

            <p class="mt-4 text-sm text-stone-600">
                Maaf, halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
                Coba periksa kembali URL atau kembali ke halaman utama.
            </p>

            <div class="mt-6 flex flex-wrap gap-3">
                <a
                    href="{{ url()->previous() }}"
                    class="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
                >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Kembali
                </a>

                @auth
                    <a
                        href="{{ route('dashboard') }}"
                        class="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-violet-600 hover:to-purple-700"
                    >
                        Ke Dashboard
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                @else
                    <a
                        href="{{ route('login') }}"
                        class="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-violet-600 hover:to-purple-700"
                    >
                        Ke Login
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                @endauth
            </div>

            <div class="mt-6 rounded-lg border border-stone-200 bg-stone-50 p-3">
                <p class="text-xs text-stone-500">
                    Kode error: <span class="font-semibold text-stone-700">404</span>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
