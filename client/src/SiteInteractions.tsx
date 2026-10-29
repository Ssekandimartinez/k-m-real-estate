import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import "./interactions.css";

const revealTargets = [
  ".section-title",
  ".about-intro > div",
  ".about-intro > img",
  ".grid > .card",
  ".service-card",
  ".value",
  ".why .grid > div",
  ".mission-grid > div",
  ".service-detail > div",
  ".service-offering-card",
  ".service-planning-grid > *",
  ".service-enquiry-guide > div",
  ".inspiration-photo",
  ".inspiration-videos > figure",
  ".visual-gallery > figure",
  ".contact-item",
  ".form-panel",
  ".cta > .container > div",
].join(",");

export default function SiteInteractions() {
  const { pathname, search } = useLocation();
  const progress = useRef<HTMLDivElement>(null);
  const previousPath = useRef(pathname);
  const [showTop, setShowTop] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    const main = document.getElementById("main");
    const navigated = previousPath.current !== pathname;
    previousPath.current = pathname;
    if (isAdmin || !main || reduced || !window.IntersectionObserver) return;
    const animations = new Set<Animation>();
    const play = (
      element: Element,
      frames: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => {
      if (typeof element.animate !== "function") return;
      const animation = element.animate(frames, options);
      animations.add(animation);
      animation.onfinish = () => animations.delete(animation);
    };
    // The initial hero stays visible; route changes get a short entrance.
    if (navigated)
      play(
        main,
        [
          { opacity: 0.65, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 280, easing: "ease-out" },
      );
    const registered = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          const siblings = entry.target.parentElement
            ? Array.from(entry.target.parentElement.children)
            : [];
          const delay =
            Math.min(Math.max(0, siblings.indexOf(entry.target)) % 3, 2) * 75;
          play(
            entry.target,
            [
              { opacity: 0, transform: "translateY(22px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 620,
              delay,
              easing: "cubic-bezier(.22,1,.36,1)",
              fill: "backwards",
            },
          );
          entry.target.setAttribute("data-revealed", "true");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -24px 0px" },
    );
    const discover = (root: Element) => {
      const targets = root.matches(revealTargets)
        ? [root, ...root.querySelectorAll(revealTargets)]
        : root.querySelectorAll(revealTargets);
      targets.forEach((element) => {
        if (registered.has(element)) return;
        registered.add(element);
        observer.observe(element);
      });
    };
    discover(main);
    // API results and gallery filters can insert content after navigation.
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) discover(node);
        }
      }
    });
    mutations.observe(main, { childList: true, subtree: true });
    const imageLoaded = (event: Event) => {
      const element = event.target;
      if (
        element instanceof HTMLImageElement &&
        element.classList.contains("gallery-main")
      ) {
        play(element, [{ opacity: 0.5 }, { opacity: 1 }], {
          duration: 240,
          easing: "ease-out",
        });
      }
    };
    main.addEventListener("load", imageLoaded, true);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      main.removeEventListener("load", imageLoaded, true);
      animations.forEach((animation) => animation.cancel());
    };
  }, [pathname, search, reduced, isAdmin]);

  useEffect(() => {
    if (isAdmin) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const ratio =
        height > 0 ? Math.min(1, Math.max(0, window.scrollY / height)) : 0;
      if (progress.current)
        progress.current.style.transform = `scaleX(${ratio})`;
      document
        .querySelector(".header")
        ?.classList.toggle("is-scrolled", window.scrollY > 24);
      setShowTop((previous) =>
        previous === window.scrollY > 600 ? previous : window.scrollY > 600,
      );
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.querySelector(".header")?.classList.remove("is-scrolled");
    };
  }, [isAdmin, pathname]);

  if (isAdmin) return null;
  return (
    <>
      <div className="reading-progress" ref={progress} aria-hidden="true" />
      <button
        className={`back-to-top${showTop ? " is-visible" : ""}`}
        type="button"
        aria-label="Back to top"
        aria-hidden={!showTop}
        tabIndex={showTop ? 0 : -1}
        onClick={() => {
          const main = document.getElementById("main");
          if (main) {
            main.tabIndex = -1;
            main.focus({ preventScroll: true });
          }
          window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
        }}
      >
        <ArrowUp size={19} />
      </button>
    </>
  );
}
