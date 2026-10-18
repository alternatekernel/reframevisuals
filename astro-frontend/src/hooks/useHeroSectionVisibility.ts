import { useEffect, useState } from 'react';

const HERO_SELECTOR = '[data-section="hero"]';

export const useHeroSectionVisibility = (): boolean => {
  const [isHeroVisible, setIsHeroVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const heroElements = new Set<Element>();
    let intersectionObserver: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    const refreshObservers = () => {
      intersectionObserver?.disconnect();
      heroElements.clear();

      const elements = Array.from(document.querySelectorAll(HERO_SELECTOR));
      if (elements.length === 0) {
        setIsHeroVisible(false);
        return;
      }

      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const visibleEntries = entries.filter((entry) => entry.isIntersecting && entry.intersectionRatio > 0);
          if (visibleEntries.length > 0) {
            setIsHeroVisible(true);
            return;
          }

          const anyStillVisible = Array.from(heroElements).some((element) => {
            const rect = element.getBoundingClientRect();
            return rect.bottom > 0 && rect.top < window.innerHeight;
          });
          setIsHeroVisible(anyStillVisible);
        },
        { threshold: [0, 0.05, 0.1] }
      );

      elements.forEach((element) => {
        heroElements.add(element);
        intersectionObserver?.observe(element);
      });

      const anyVisibleNow = elements.some((element) => {
        const rect = element.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight;
      });
      setIsHeroVisible(anyVisibleNow);
    };

    refreshObservers();

    mutationObserver = new MutationObserver(() => {
      refreshObservers();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      intersectionObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, []);

  return isHeroVisible;
};
