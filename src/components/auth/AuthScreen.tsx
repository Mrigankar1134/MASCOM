'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Glass } from '@/components/ui/Glass'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Icon } from '@/components/shell/Icons'
import { Wordmark } from '@/components/shell/Wordmark'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useToast } from '@/components/ui/Toast'
import { api, ApiError } from '@/lib/client/api'
import { portalPoints, site } from '@/content/site'
import { heroShots } from '@/content/gallery'

type Mode = 'signin' | 'signup'

export function AuthScreen({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isSignUp = mode === 'signup'

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setBusy(true)

    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries(
      [...form.entries()].filter(([, v]) => String(v).trim() !== ''),
    )

    try {
      await api(`/api/auth/${isSignUp ? 'signup' : 'signin'}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      toast.success(isSignUp ? 'Account created. Welcome in.' : 'Welcome back.')
      router.push(next ?? '/shop')
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.issues?.length) {
          setErrors(Object.fromEntries(err.issues.map((i) => [i.path, i.message])))
        }
        toast.error(err.message)
      } else {
        toast.error('Could not reach the server. Check your connection.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* ── Story panel (desktop only) ─────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src={heroShots[0] ?? '/gallery/landingpage/1.jpg'}
          alt=""
          fill
          priority
          sizes="55vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(200deg, rgba(8,8,15,0.55) 0%, rgba(8,8,15,0.82) 55%, rgba(8,8,15,0.95) 100%)',
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-10 text-white xl:p-14">
          <Link href="/" className="press inline-flex w-fit text-white">
            <Wordmark />
          </Link>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
              Student portal
            </p>
            <h1 className="display mt-4 text-[clamp(2.6rem,4.4vw,4rem)] text-white">
              Your merch.
              <br />
              Your drop.
            </h1>
            <ul className="mt-8 space-y-3">
              {portalPoints.map((point) => (
                <li key={point} className="flex items-center gap-3 t-subhead text-white/80">
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
                    style={{ background: 'var(--tint-solid)', color: 'var(--tint-contrast)' }}
                  >
                    <Icon.Check size={13} strokeWidth={2.75} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <p className="t-caption-1 text-white/40">
            © {new Date().getFullYear()} {site.name} — {site.institute}
          </p>
        </div>
      </aside>

      {/* ── Form panel ─────────────────────────────────────────────────── */}
      <div className="flex flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" className="press lg:hidden">
            <Wordmark />
          </Link>
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10"
        >
          <Glass tone="strong" className="p-6 sm:p-8">
            <p className="eyebrow">{isSignUp ? 'Join the drop' : 'Student portal'}</p>
            <h2 className="display mt-2.5 text-[30px]">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="mt-2 t-subhead text-[var(--label-2)]">
              {isSignUp
                ? 'Use your college email. Takes about a minute.'
                : 'Sign in with your college email to continue.'}
            </p>

            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              {isSignUp && (
                <Input
                  name="name"
                  label="Full name"
                  placeholder="Your name"
                  autoComplete="name"
                  required
                  error={errors.name}
                />
              )}

              <Input
                name="email"
                type="email"
                inputMode="email"
                label="College email"
                placeholder={`yourname@${site.institute.toLowerCase().replace(/\s/g, '')}.ac.in`}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                error={errors.email}
              />

              <Input
                name="password"
                type="password"
                label="Password"
                placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                error={errors.password}
                hint={isSignUp ? 'Mix letters and numbers.' : undefined}
              />

              {isSignUp && (
                <div className="grid grid-cols-2 gap-3">
                  <Input name="rollNo" label="Roll no." placeholder="Optional" error={errors.rollNo} />
                  <Input name="section" label="Section" placeholder="Optional" error={errors.section} />
                </div>
              )}

              <Button type="submit" size="lg" block loading={busy} className="mt-2">
                {isSignUp ? 'Create account' : 'Sign in'}
              </Button>
            </form>

            <p className="mt-6 text-center t-footnote text-[var(--label-2)]">
              {isSignUp ? 'Already have an account?' : 'New here?'}{' '}
              <Link
                href={isSignUp ? '/signin' : '/signup'}
                className="font-semibold"
                style={{ color: 'var(--tint)' }}
              >
                {isSignUp ? 'Sign in' : 'Create one'}
              </Link>
            </p>
          </Glass>

          <p className="mt-5 text-center t-caption-1 text-[var(--label-3)]">
            Access is restricted to college email addresses.
          </p>

          <Link
            href="/"
            className="press mt-6 inline-flex items-center justify-center gap-1.5 t-footnote text-[var(--label-2)]"
          >
            <Icon.ChevronLeft size={15} />
            Back to home
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
