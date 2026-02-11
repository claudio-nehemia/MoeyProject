import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm } from '@inertiajs/react';
import { Mail, Lock, Sparkles } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { request as passwordRequest } from '@/routes/password';
import { login as loginRoute } from '@/routes';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({
    status,
    canResetPassword,
}: LoginProps) {
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(loginRoute.definition.url, {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Log in - MOEY" />
            
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes shimmer {
                    0% {
                        background-position: -1000px 0;
                    }
                    100% {
                        background-position: 1000px 0;
                    }
                }

                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                @keyframes gradientShift {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }

                @keyframes accentBar {
                    0% {
                        opacity: 0.5;
                        transform: scaleY(0);
                    }
                    50% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0.5;
                        transform: scaleY(1);
                    }
                }

                @keyframes floatSlow {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-20px);
                    }
                }

                @keyframes rotateSlow {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }

                .animate-fadeInUp {
                    animation: fadeInUp 0.8s ease-out forwards;
                }

                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }

                .animate-float-slow {
                    animation: floatSlow 5s ease-in-out infinite;
                }

                .animate-rotate-slow {
                    animation: rotateSlow 20s linear infinite;
                }

                .shimmer-effect {
                    background: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0%,
                        rgba(255, 255, 255, 0.4) 50%,
                        rgba(255, 255, 255, 0) 100%
                    );
                    background-size: 1000px 100%;
                    animation: shimmer 3s infinite;
                }

                .input-glow {
                    transition: all 0.3s ease;
                }

                .card-entrance {
                    animation: fadeInUp 1s ease-out;
                }

                .logo-float {
                    animation: float 4s ease-in-out infinite;
                }

                .elegant-heading {
                    font-family: 'Playfair Display', serif;
                    font-weight: 600;
                    letter-spacing: -0.02em;
                }

                .gradient-border {
                    position: relative;
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%);
                    border: 1.5px solid;
                    border-image: linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(20, 184, 166, 0.4), rgba(16, 185, 129, 0.2)) 1;
                }

                .accent-bar {
                    position: absolute;
                    left-0 top-0;
                    bottom-0;
                    width: 4px;
                    background: linear-gradient(180deg, #10b981 0%, #14b8a6 100%);
                    border-radius: 20px 0 0 20px;
                    animation: accentBar 3s ease-in-out infinite;
                }

                .card-glow {
                    box-shadow: 
                        0 0 30px rgba(16, 185, 129, 0.15),
                        0 20px 50px rgba(0, 0, 0, 0.4),
                        inset 0 1px 2px rgba(255, 255, 255, 0.1);
                }

                .hover-lift {
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .hover-lift:hover {
                    transform: translateY(-8px);
                    box-shadow: 
                        0 0 40px rgba(16, 185, 129, 0.25),
                        0 30px 70px rgba(0, 0, 0, 0.5),
                        inset 0 1px 2px rgba(255, 255, 255, 0.15) !important;
                }
            `}</style>
            
            <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden">
                {/* Background Image with Cleaner Overlay */}
                <div 
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: 'url(https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-slate-800/40 to-slate-900/60"></div>
                </div>

                {/* Clean Decorative Elements */}
                <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 right-20 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/3 right-10 w-24 h-24 bg-emerald-400/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-1/3 left-1/4 w-28 h-28 bg-teal-400/5 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '3s' }}></div>

                {/* Login Card with Clean Design */}
                <div className="relative z-10 w-full max-w-md mx-4 card-entrance hover-lift">
                    <div 
                        className="relative overflow-hidden rounded-3xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
                            backdropFilter: 'blur(16px)',
                            border: '1.5px solid',
                            borderImage: 'linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(20, 184, 166, 0.4), rgba(16, 185, 129, 0.2)) 1',
                            boxShadow: '0 0 60px rgba(16, 185, 129, 0.15), 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.08)'
                        }}
                    >
                        {/* Accent Bar */}
                        <div className="accent-bar"></div>

                        {/* Subtle Shimmer Effect */}
                        <div className="absolute inset-0 shimmer-effect opacity-10"></div>

                        {/* Clean Corner Accents */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full"></div>
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-teal-500/10 to-transparent rounded-tr-full"></div>

                        {/* Content with padding adjusted for accent bar */}
                        <div className="relative z-10 p-12 pl-16">
                            {/* Logo and Tagline */}
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center gap-3 mb-4 logo-float">
                                    <Sparkles className="w-6 h-6 text-emerald-400" />
                                    <h1 
                                        className="text-5xl font-light tracking-wider text-white"
                                        style={{ 
                                            letterSpacing: '0.25em',
                                            textShadow: '2px 2px 12px rgba(16, 185, 129, 0.2)'
                                        }}
                                    >
                                        MOEY
                                    </h1>
                                    <Sparkles className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-emerald-500 to-transparent mb-4"></div>
                                <p className="text-sm font-light tracking-wide text-emerald-200/70 italic">
                                    Designing Spaces, Managing Visions.
                                </p>
                            </div>

                            {/* Status Message */}
                            {status && (
                                <div className="mb-6 text-center text-sm font-medium px-4 py-3 rounded-xl bg-emerald-900/40 border border-emerald-500/30 text-emerald-200 shadow-sm animate-fadeInUp">
                                    {status}
                                </div>
                            )}

                            {/* Login Form */}
                            <form
                                onSubmit={submit}
                                className="flex flex-col gap-6"
                            >
                                {/* Email Field */}
                                        <div className="space-y-3 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                                            <Label 
                                                htmlFor="email" 
                                                className="text-xs uppercase tracking-wider font-semibold text-emerald-300 flex items-center gap-2"
                                            >
                                                <span className="w-1 h-4 bg-emerald-500 rounded"></span>
                                                Email Address
                                            </Label>
                                            <div className="relative group">
                                                <div className={`absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur transition-all duration-300 ${emailFocused ? 'opacity-100' : 'opacity-0'}`}></div>
                                                <div className="relative bg-slate-900/50 rounded-xl border-2 border-slate-700 transition-all duration-300 hover:border-emerald-500/50 focus-within:border-emerald-500 shadow-lg hover:shadow-emerald-500/20 backdrop-blur-sm">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-all duration-300 group-focus-within:text-emerald-400" />
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        required
                                                        autoFocus
                                                        tabIndex={1}
                                                        value={data.email}
                                                        onChange={(e) => setData('email', e.target.value)}
                                                        autoComplete="email"
                                                        placeholder="email@example.com"
                                                        onFocus={() => setEmailFocused(true)}
                                                        onBlur={() => setEmailFocused(false)}
                                                        className="pl-12 pr-4 py-6 bg-transparent border-0 rounded-xl focus:ring-0 text-slate-100 placeholder:text-slate-500 font-medium input-glow"
                                                    />
                                                </div>
                                            </div>
                                            <InputError message={errors.email} />
                                        </div>

                                        {/* Password Field */}
                                        <div className="space-y-3 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                                            <div className="flex items-center justify-between">
                                                <Label 
                                                    htmlFor="password" 
                                                    className="text-xs uppercase tracking-wider font-semibold text-emerald-300 flex items-center gap-2"
                                                >
                                                    <span className="w-1 h-4 bg-emerald-500 rounded"></span>
                                                    Password
                                                </Label>
                                                {canResetPassword && (
                                                    <TextLink
                                                        href={passwordRequest.definition.url}
                                                        className="text-xs font-medium hover:underline text-emerald-400 transition-all hover:text-emerald-300"
                                                        tabIndex={5}
                                                    >
                                                        Forgot password?
                                                    </TextLink>
                                                )}
                                            </div>
                                            <div className="relative group">
                                                <div className={`absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur transition-all duration-300 ${passwordFocused ? 'opacity-100' : 'opacity-0'}`}></div>
                                                <div className="relative bg-slate-900/50 rounded-xl border-2 border-slate-700 transition-all duration-300 hover:border-emerald-500/50 focus-within:border-emerald-500 shadow-lg hover:shadow-emerald-500/20 backdrop-blur-sm">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-all duration-300 group-focus-within:text-emerald-400" />
                                                    <Input
                                                        id="password"
                                                        value={data.password}
                                                        onChange={(e) => setData('password', e.target.value)}
                                                        type="password"
                                                        name="password"
                                                        required
                                                        tabIndex={2}
                                                        autoComplete="current-password"
                                                        placeholder="Enter your password"
                                                        onFocus={() => setPasswordFocused(true)}
                                                        onBlur={() => setPasswordFocused(false)}
                                                        className="pl-12 pr-4 py-6 bg-transparent border-0 rounded-xl focus:ring-0 text-slate-100 placeholder:text-slate-500 font-medium input-glow"
                                                    />
                                                </div>
                                            </div>
                                            <InputError message={errors.password} />
                                        </div>

                                        {/* Remember Me */}
                                        <div className="flex items-center space-x-3 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                checked={data.remember}
                                                onCheckedChange={(checked) => setData('remember', checked as boolean)}
                                                tabIndex={3}
                                                className="border-2 border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 rounded-md transition-all duration-300"
                                            />
                                            <Label 
                                                htmlFor="remember" 
                                                className="text-sm font-medium cursor-pointer text-slate-600 hover:text-slate-800 transition-colors"
                                            >
                                                Remember me for 30 days
                                            </Label>
                                        </div>

                                        {/* Login Button */}
                                        <Button
                                            type="submit"
                                            className="mt-8 w-full rounded-xl font-semibold tracking-wide transition-all duration-300 hover:shadow-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-6 text-base relative overflow-hidden group animate-fadeInUp transform hover:scale-[1.02] active:scale-[0.98]"
                                            tabIndex={4}
                                            disabled={processing}
                                            data-test="login-button"
                                            style={{ animationDelay: '0.4s' }}
                                        >
                                            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                                            <span className="relative flex items-center justify-center gap-2">
                                                {processing && <Spinner />}
                                                <span className="elegant-heading" style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
                                                    {processing ? 'Logging in...' : 'Sign In'}
                                                </span>
                                            </span>
                                        </Button>
                                    </form>
                        </div>
                    </div>

                    {/* Bottom Shadow Effect */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-gradient-to-b from-black/20 to-transparent blur-2xl rounded-full"></div>
                </div>
            </div>
        </>
    );
}