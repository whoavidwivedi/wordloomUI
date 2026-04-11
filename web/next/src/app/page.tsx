"use client"

import { RiGithubFill } from "@remixicon/react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

function LandingView() {
  return (
    <>
      {/* Header */}
      <header className="flex shrink-0 flex-col border-b border-[#1a1a1a] p-6 lg:p-8">
        <div className="flex items-start justify-between">
          <h1 className="flex items-baseline gap-2 font-serif leading-none font-bold tracking-tighter uppercase lg:gap-3">
            <span className="text-5xl lg:text-7xl">Wordloom</span>
            <span className="pt-0.5 text-2xl lg:text-3xl">Studio</span>
          </h1>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <p className="font-sans text-sm font-semibold uppercase">Online</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="font-mono text-xs tracking-[0.2em] uppercase opacity-60">
            Powered by Wordloom CLI
          </p>
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="font-mono text-xs tracking-widest uppercase opacity-40">
              by Avi Diwedi
            </span>
            <a
              href="https://github.com/whoavidwivedi/wordloom-studio"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-40 transition-opacity hover:opacity-100"
            >
              <RiGithubFill className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
        {/* Left Column */}
        <div className="relative flex flex-col overflow-hidden border-r border-[#1a1a1a] bg-[#fbfaf5] p-6 lg:p-8">
          <div className="flex w-full flex-1 flex-col items-center justify-center gap-6 text-center">
            <div className="h-px w-24 bg-[#1a1a1a] opacity-20" />
            <h2 className="max-w-[16ch] font-serif text-3xl leading-tight font-bold tracking-tight uppercase lg:text-5xl">
              Find Names That Sound Real
            </h2>
            <p className="max-w-[32ch] font-sans text-sm leading-relaxed opacity-60">
              Short, pronounceable names for brands, products, and projects
            </p>
            <div className="h-px w-24 bg-[#1a1a1a] opacity-20" />
          </div>

          <div className="absolute bottom-6 left-6 font-mono text-[10px] tracking-widest uppercase opacity-40 lg:bottom-8 lg:left-8">
            100k+ English words analyzed
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col">
          <div className="flex flex-1 flex-col items-start justify-center border-b border-[#1a1a1a] bg-[#f8f7f2] p-6 lg:p-8">
            <h3 className="mb-3 font-serif text-xl text-black uppercase">How It Works</h3>
            <p className="m-0 font-sans text-sm opacity-60">
              Every name follows real English letter patterns learned from 100k+ words. If a result
              is a real word, you see the meaning right next to it — so you can decide whether that
              helps or hurts your brand.
            </p>
          </div>

          <div className="grid min-h-[140px] flex-grow grid-cols-2">
            <a
              href="https://github.com/nrjdalal/wordloom"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex cursor-pointer flex-col items-start justify-center overflow-hidden border-r border-[#1a1a1a] bg-[#ecebe5] p-6 hover:bg-[#1a1a1a] hover:text-[#ecebe5] lg:p-8"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-widest uppercase opacity-60 group-hover:opacity-100">
                  GitHub
                </span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100" />
              </div>
              <h2 className="font-serif text-2xl font-bold tracking-tight uppercase lg:text-3xl">
                CLI & Docs
              </h2>
            </a>
            <Link
              href="/studio"
              className="group relative flex cursor-pointer flex-col items-start justify-center overflow-hidden bg-[#ecebe5] p-6 hover:bg-[#1a1a1a] hover:text-[#ecebe5] lg:p-8"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-widest uppercase opacity-60 group-hover:opacity-100">
                  Try It
                </span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100" />
              </div>
              <h2 className="font-serif text-3xl font-bold tracking-tighter uppercase">Studio</h2>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-transparent p-4 text-[#1a1a1a] selection:bg-[#1a1a1a] selection:text-[#ecebe5]">
      <main className="relative z-20 flex min-h-[95vh] w-full max-w-6xl flex-col overflow-hidden border border-[#1a1a1a] bg-white shadow-2xl md:h-[85vh]">
        <LandingView />
      </main>
    </div>
  )
}
