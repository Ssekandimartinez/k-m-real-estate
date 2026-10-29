import { useEffect, useRef, useState, type ReactNode } from "react";

export default function DeferredSection({ children }: { children: ReactNode }) {
  const element = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!window.IntersectionObserver) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px" },
    );
    if (element.current) observer.observe(element.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={element} style={visible ? undefined : { minHeight: 480 }}>
      {visible ? children : null}
    </div>
  );
}
