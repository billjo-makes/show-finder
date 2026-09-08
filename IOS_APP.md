# Getting Show Finder onto an iPhone

This document records the options considered for turning Show Finder into an iPhone app, and the decision made. It's a companion to `DEPLOYMENT.md` (which covers hosting the app on the open web) — this doc is specifically about the native-app layer on top of that.

## Options considered

| Option | Cost | Requires a Mac? | What you get | Main downside |
|---|---|---|---|---|
| **PWA** ("Add to Home Screen") | Free | No | Once the API is hosted, Safari can install the site as a home-screen app: own icon, full-screen, no browser chrome. Zero Apple account needed. | Not a "real" app — no App Store presence, limited native device APIs, iOS is stricter than Android about background/offline behavior for web apps. |
| **Native via Capacitor + free Apple ID** | Free | Only for the build step, and that can run on free-tier cloud CI (no Mac to own) | Wraps the existing React client in a real installable `.app`, bundling the UI locally and calling the hosted API over the network. | Apple's free-tier signing makes installs expire every **7 days** — the app has to be re-sideloaded periodically from a PC. |
| **Native via Capacitor + paid Apple Developer Program** | $99/year | Same as above | Same native app, but distributed via **TestFlight** — builds last 90 days, no weekly resign hassle, and it leaves the door open to a real App Store release later. | Ongoing annual cost. |

## Decision made

**Native via Capacitor, signed with a free Apple ID.**

- Chosen over the PWA option because the goal is a genuinely installable app, not a bookmarked website.
- Chosen over the paid Apple Developer Program to avoid the $99/yr recurring cost, explicitly accepting the 7-day resign cycle as the tradeoff — the app will need to be reconnected to a PC (via Sideloadly) and reinstalled roughly weekly.
- The user is on Windows, so the plan avoids assuming Mac ownership: the one Mac-only step (compiling/signing the iOS build) runs on a free-tier macOS cloud runner (GitHub Actions or Codemagic) rather than local hardware, and the sideload step itself uses Sideloadly, which runs on Windows.

## Why this doc exists

So the tradeoff — free, but with a recurring 7-day resign chore — is written down somewhere durable rather than left in a chat transcript. If this gets annoying later, the fix is a known, cheap pivot: pay for the Apple Developer Program and re-sign the *same* Capacitor project for TestFlight or the App Store. No architectural rework is needed to make that switch; see "Future option" in the implementation plan.

## Architecture note

Unlike the full open-web deployment in `DEPLOYMENT.md` (which hosts *both* client and server publicly), the iPhone app only needs the **server/API** hosted on the internet. Capacitor bundles the built client (`client/dist`) directly inside the native app, so there's no separate client hosting (Vercel/Netlify) step for this goal — TMDB/OMDb keys stay server-side exactly as they do today.

## Project layout

Capacitor is added **inside the existing `client/` workspace** (`client/capacitor.config.ts`, `client/ios/`) rather than a separate `show-finder-ios` project. It wraps the same `client/dist` build the web app already produces, so there's one client codebase, not two kept in sync — the web app's build/deploy path is completely unaffected by this addition.
