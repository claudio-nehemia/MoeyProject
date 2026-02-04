<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>403 - {{ config('app.name', 'Moey Admin') }}</title>

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    @vite(['resources/css/app.css'])
</head>
<body class="min-h-screen bg-gradient-to-br from-stone-50 via-violet-50 to-stone-50 text-stone-800">
    <div class="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div class="absolute inset-0 overflow-hidden">
            <div class="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl"></div>
            <div class="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-red-200/30 blur-3xl"></div>
        </div>

        <div class="relative w-full max-w-2xl rounded-2xl border border-stone-200 bg-white/80 p-8 shadow-xl backdrop-blur">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M17 9V7a5 5 0 00-10 0v2m-2 0h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z" />
                    </svg>
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-amber-600">403</p>
                    <h1 class="text-2xl font-semibold text-stone-900">Akses ditolak</h1>
                </div>
            </div>

            <p class="mt-4 text-sm text-stone-600">
                Kamu tidak memiliki izin untuk mengakses halaman ini. Jika ini terjadi karena kesalahan,
                hubungi admin atau kembali ke halaman yang aman.
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
                        class="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-amber-600 hover:to-rose-700"
                    >
                        Ke Dashboard
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                @else
                    <a
                        href="{{ route('login') }}"
                        class="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-amber-600 hover:to-rose-700"
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
                    Kode error: <span class="font-semibold text-stone-700">403</span>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
