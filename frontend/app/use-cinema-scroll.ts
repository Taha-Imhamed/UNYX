"use client"

import { useEffect } from "react"

function clamp(v: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v))
}

function smoothstep(e0: number, e1: number, v: number) {
  const x = clamp((v - e0) / (e1 - e0))
  return x * x * (3 - 2 * x)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function segmentInOut(s: number, a: number, b: number, c: number, d: number) {
  const enter = smoothstep(a, b, s)
  const exit = smoothstep(c, d, s)
  return { enter, exit, active: enter * (1 - exit) }
}

export function useCinemaScroll(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const section = root.querySelector<HTMLElement>(".cinema-scroll")
    const stage = root.querySelector<HTMLElement>(".stage")
    if (!section || !stage) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const track = root.querySelector<HTMLElement>(".sights-track")
    const sightsControls = root.querySelector<HTMLElement>(".sights-controls")
    const prevBtn = root.querySelector<HTMLElement>(".sight-prev")
    const nextBtn = root.querySelector<HTMLElement>(".sight-next")
    const originalCards = track ? Array.from(track.querySelectorAll<HTMLElement>(".sight-card")) : []

    let targetMouseX = 0
    let targetMouseY = 0
    let mouseX = 0
    let mouseY = 0
    let targetScroll = 0
    let smoothScroll = 0
    let initialized = false
    let rafPending = false

    let sightCards: HTMLElement[] = []
    const originalSightCount = originalCards.length
    let activeSight = originalSightCount

    // The shared body/html `overflow-x: hidden` rule turns body into its own
    // scrolling container, which breaks `position: sticky` for .stage in
    // some browsers. `clip` avoids creating a scroll container while still
    // clipping horizontal overflow, so restore normal viewport scrolling
    // just for this page.
    const prevBodyOverflowX = document.body.style.overflowX
    const prevHtmlOverflowX = document.documentElement.style.overflowX
    document.body.style.overflowX = "clip"
    document.documentElement.style.overflowX = "clip"

    function getScrollDistance() {
      const rect = section!.getBoundingClientRect()
      return clamp(-rect.top, 0, section!.offsetHeight - window.innerHeight)
    }

    function updateSightSlider() {
      if (!track || sightCards.length === 0) return
      const cardWidth = sightCards[0].offsetWidth
      const gap = parseFloat(getComputedStyle(track).columnGap || "0")
      root!.style.setProperty("--sights-shift", `${-(cardWidth + gap) * activeSight}px`)
      sightCards.forEach((card, i) => {
        card.classList.toggle("is-active", i === activeSight)
      })
    }

    function normalizeSightSlider() {
      if (activeSight >= originalSightCount * 2) {
        jumpSightSlider(activeSight - originalSightCount)
      } else if (activeSight < originalSightCount) {
        jumpSightSlider(activeSight + originalSightCount)
      }
    }

    function jumpSightSlider(i: number) {
      if (!track) return
      track.classList.add("is-jumping")
      activeSight = i
      updateSightSlider()
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          track.classList.remove("is-jumping")
        })
      })
    }

    function moveSightSlider(dir: number) {
      activeSight += dir
      updateSightSlider()
    }

    function selectSightCard(card: HTMLElement) {
      const idx = Number(card.dataset.sightIndex)
      if (Number.isFinite(idx)) {
        activeSight = idx
        updateSightSlider()
      }
    }

    function setupSightSlider() {
      if (!track || originalSightCount === 0) return
      track.replaceChildren()
      const allCards: HTMLElement[] = []
      for (let setIndex = 0; setIndex < 3; setIndex++) {
        originalCards.forEach((card, cardIndex) => {
          const clone = card.cloneNode(true) as HTMLElement
          clone.dataset.sightIndex = String(setIndex * originalSightCount + cardIndex)
          track.appendChild(clone)
          allCards.push(clone)
        })
      }
      sightCards = allCards
      activeSight = originalSightCount

      sightCards.forEach((card) => {
        card.addEventListener("click", () => selectSightCard(card))
        card.addEventListener("keydown", (e) => {
          const ke = e as KeyboardEvent
          if (ke.key === "Enter" || ke.key === " ") {
            ke.preventDefault()
            selectSightCard(card)
          }
        })
      })

      track.addEventListener("transitionend", normalizeSightSlider)
      updateSightSlider()
    }

    function update() {
      rafPending = false

      targetScroll = getScrollDistance()
      if (!initialized || reduceMotion.matches) {
        smoothScroll = targetScroll
        initialized = true
      } else {
        smoothScroll = lerp(smoothScroll, targetScroll, 0.14)
      }
      if (Math.abs(smoothScroll - targetScroll) < 0.08) smoothScroll = targetScroll

      mouseX = lerp(mouseX, targetMouseX, 0.12)
      mouseY = lerp(mouseY, targetMouseY, 0.12)

      const frame2 = segmentInOut(smoothScroll, 560, 900, 1300, 1620)
      const frame3 = segmentInOut(smoothScroll, 1760, 2140, 2540, 2700)
      const progress = clamp(smoothScroll / 2700)
      const introExit = smoothstep(90, 650, smoothScroll)
      const sightsEnterRaw = smoothstep(2760, 3560, smoothScroll)
      const sightsEnter = Math.pow(sightsEnterRaw, 1.55)
      const sightsControlsEnter = smoothstep(3360, 3660, smoothScroll)
      const blurActive = clamp(frame2.active + frame3.active)
      const frame2Opacity = frame2.active * (1 - frame3.enter)
      const splitDrift = Math.pow(frame2.enter, 1.5)
      const panel2Opacity = frame2.active * (1 - frame2.exit)
      const panel3Opacity = frame3.active * (1 - frame3.exit)
      const backScale = 0.76 + progress * 0.2 + frame2.enter * 0.18 + frame3.enter * 0.16
      const sharedHeroY = progress * -74
      const sharedHeroScale = progress * 0.23
      const sightsScreenTop = Math.min(220, Math.max(112, window.innerHeight * 0.19)) - 50
      const sightsParentTop = window.innerHeight - (window.innerHeight - sightsScreenTop) / backScale

      const mxVal = reduceMotion.matches ? 0 : mouseX
      const myVal = reduceMotion.matches ? 0 : mouseY

      const s = root!.style
      s.setProperty("--mx", mxVal.toFixed(4))
      s.setProperty("--my", myVal.toFixed(4))

      s.setProperty("--back-opacity", String(1 - frame2.active * 0.06))
      s.setProperty("--back-x", `${mouseX * -12}px`)
      s.setProperty("--back-y", `${mouseY * -4}px`)
      s.setProperty("--back-scale", String(backScale))
      s.setProperty("--four-y", `${10 + progress * 10}vh`)
      s.setProperty("--four-scale", String(0.78 + progress * 0.16))
      s.setProperty("--bazaar-y", `${20 - progress * 8}vh`)
      s.setProperty("--blur-px", `${blurActive * 14}px`)
      s.setProperty("--back-brightness", String(1 - blurActive * 0.255))
      s.setProperty("--bazaar-blur-px", `${frame2.active * 14}px`)
      s.setProperty("--bazaar-brightness", String(1 - frame2.active * 0.255 - frame3.active * 0.06))
      s.setProperty("--bazaar-saturation", String(1 + frame3.active * 0.18))
      s.setProperty("--shade-opacity", "1")
      s.setProperty("--shade-z", blurActive > 0.02 ? "2" : "0")
      s.setProperty("--shade-top-alpha", String(blurActive * 0.465))
      s.setProperty("--shade-mid-alpha", String(blurActive * 0.42))
      s.setProperty("--shade-bottom-alpha", String(blurActive * 0.51))

      s.setProperty("--title-y", `${introExit * -210}px`)
      s.setProperty("--title-scale", String(1 - introExit * 0.08))
      s.setProperty("--title-opacity", String(1 - introExit))

      s.setProperty("--bridge-x", `calc(-50% + ${mouseX * 18}px)`)
      s.setProperty("--bridge-y", `${mouseY * 8 + sharedHeroY - frame2.exit * 760}px`)
      s.setProperty("--bridge-bottom", `${5 - frame2.enter * 13}vh`)
      s.setProperty("--bridge-width", `${67.2 + frame2.enter * 37.8}vw`)
      s.setProperty("--bridge-scale", String(1.02 + sharedHeroScale + frame2.exit * 0.46))

      s.setProperty("--split-left-x", `calc(-50% + ${-splitDrift * 46}vw + ${mouseX * 22}px)`)
      s.setProperty("--split-left-y", `${mouseY * 10 + sharedHeroY - splitDrift * 180}px`)
      s.setProperty("--split-left-scale", String(1 + sharedHeroScale + frame2.enter * 0.74))
      s.setProperty("--split-right-x", `calc(-50% + ${splitDrift * 46}vw + ${mouseX * 22}px)`)
      s.setProperty("--split-right-y", `${mouseY * 10 + sharedHeroY - splitDrift * 180}px`)
      s.setProperty("--split-right-scale", String(1 + sharedHeroScale + frame2.enter * 0.74))

      s.setProperty("--frame2-opacity", String(frame2Opacity))
      s.setProperty("--frame2-x", `calc(-50% + ${mouseX * 10}px)`)
      s.setProperty("--frame2-y", `calc(-50% + ${mouseY * 8 - frame2.exit * 150}px)`)
      s.setProperty("--frame2-scale", String(1.06 + frame2.enter * 0.08 + frame2.exit * 0.08))

      s.setProperty("--intro-copy-y", `${introExit * 90}px`)
      s.setProperty("--intro-copy-opacity", String(1 - introExit))
      s.setProperty("--panel2-opacity", String(panel2Opacity))
      s.setProperty("--panel2-y", `calc(-50% + ${-frame2.exit * 86 + (1 - frame2.enter) * 58}px)`)
      s.setProperty("--panel3-opacity", String(panel3Opacity))
      s.setProperty("--panel3-y", `calc(-50% + ${-frame3.exit * 86 + (1 - frame3.enter) * 58}px)`)

      s.setProperty("--sights-opacity", String(sightsEnter))
      s.setProperty("--sights-controls-opacity", String(sightsControlsEnter))
      sightsControls?.classList.toggle("is-ready", sightsControlsEnter > 0.98)
      s.setProperty("--sights-visibility", sightsEnter > 0.01 ? "visible" : "hidden")
      s.setProperty("--sights-y", "0px")
      s.setProperty("--sights-enter-x", `${(1 - sightsEnter) * 420}vw`)
      s.setProperty("--sights-scale", String(1 / backScale))
      s.setProperty("--sights-top", `${sightsParentTop}px`)
      s.setProperty("--sights-screen-top", `${sightsScreenTop}px`)

      if (
        Math.abs(smoothScroll - targetScroll) > 0.08 ||
        Math.abs(mouseX - targetMouseX) > 0.001 ||
        Math.abs(mouseY - targetMouseY) > 0.001
      ) {
        requestTick()
      }
    }

    function requestTick() {
      if (rafPending) return
      rafPending = true
      requestAnimationFrame(update)
    }

    function onScroll() {
      requestTick()
    }
    function onResize() {
      updateSightSlider()
      requestTick()
    }
    function onPointerMove(e: PointerEvent) {
      targetMouseX = e.clientX / window.innerWidth - 0.5
      targetMouseY = e.clientY / window.innerHeight - 0.5
      requestTick()
    }
    function onPrev() {
      moveSightSlider(-1)
    }
    function onNext() {
      moveSightSlider(1)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    prevBtn?.addEventListener("click", onPrev)
    nextBtn?.addEventListener("click", onNext)

    setupSightSlider()
    requestTick()

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("pointermove", onPointerMove)
      prevBtn?.removeEventListener("click", onPrev)
      nextBtn?.removeEventListener("click", onNext)
      track?.removeEventListener("transitionend", normalizeSightSlider)
      document.body.style.overflowX = prevBodyOverflowX
      document.documentElement.style.overflowX = prevHtmlOverflowX
    }
  }, [rootRef])
}
