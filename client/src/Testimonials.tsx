import ResponsiveImage from "./ResponsiveImage";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { api, type Entry } from "./api";
import "./testimonials.css";

export default function Testimonials() {
  const { data } = useQuery({
    queryKey: ["testimonials"],
    queryFn: () => api<{ items: Entry[] }>("/content/testimonial?limit=6"),
  });
  const [selected, setSelected] = useState(0);
  const reducedMotion = useReducedMotion();
  const entries = data?.items ?? [];
  const index = selected % (entries.length || 1);
  const active = entries[index];
  if (!active) return null;

  return (
    <motion.section
      className="section testimonials-section"
      aria-labelledby="testimonials-heading"
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55 }}
    >
      <div className="container">
        <div className="testimonials-heading">
          <div>
            <p className="eyebrow">PROPERTY PERSPECTIVES</p>
            <h2 id="testimonials-heading">
              Every move begins with a conversation.
            </h2>
          </div>
          <p>
            A closer look at the care, clarity and communication that matter
            throughout a property journey.
          </p>
        </div>

        <div className="testimonials-stage">
          <div
            className="testimonials-story"
            aria-live="polite"
            aria-atomic="true"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                className="testimonials-slide"
                initial={reducedMotion ? false : { opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, x: -18 }}
                transition={{ duration: reducedMotion ? 0 : 0.22 }}
              >
                <div className="testimonials-photo">
                  {active.images[0] ? (
                    <ResponsiveImage
                      src={active.images[0].url}
                      alt={active.images[0].alt}
                      loading="lazy"
                      width="480"
                      height="560"
                    />
                  ) : (
                    <span aria-hidden="true">{active.title.charAt(0)}</span>
                  )}
                </div>
                <blockquote className="testimonials-quote">
                  <Quote size={44} strokeWidth={1} aria-hidden="true" />
                  <p>“{active.summary}”</p>
                  <footer>
                    <span aria-hidden="true" />
                    <cite>{active.title}</cite>
                  </footer>
                </blockquote>
              </motion.div>
            </AnimatePresence>
          </div>
          {entries.length > 1 && (
            <div className="testimonials-navigation">
              <span className="testimonials-counter" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
                <span> / {String(entries.length).padStart(2, "0")}</span>
              </span>
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setSelected((index - 1 + entries.length) % entries.length)
                  }
                  aria-label="Previous testimonial"
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelected((index + 1) % entries.length)}
                  aria-label="Next testimonial"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {entries.length > 1 && (
          <div
            className="testimonials-people"
            role="group"
            aria-label="Choose a testimonial"
          >
            {entries.map((entry, position) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={position === index}
                aria-label={`Read testimonial from ${entry.title}`}
                onClick={() => setSelected(position)}
              >
                {entry.images[0] && (
                  <ResponsiveImage
                    src={entry.images[0].url}
                    alt=""
                    sizes="48px"
                    loading="lazy"
                    width="48"
                    height="48"
                  />
                )}
                <span>{entry.title}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
        {entries.some((entry) => entry.specs.sample === true) && (
          <p className="testimonials-disclosure">
            Illustrative testimonials: these stories and names are fictional;
            portraits are illustrative.
          </p>
        )}
      </div>
    </motion.section>
  );
}
