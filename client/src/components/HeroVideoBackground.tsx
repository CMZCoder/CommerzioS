/**
 * HeroVideoBackground Component
 * 
 * Displays rotating background videos with smooth crossfade transitions.
 * Features lazy loading, preloading of next video, and fallback gradient.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Import videos - Vite handles these as assets
import video1 from './heroVideos/Goal_generate_45_202512070509.mp4';
import video2 from './heroVideos/Goal_generate_45_202512070504.mp4';
import video3 from './heroVideos/Goal_generate_45_202512070457.mp4';
import video4 from './heroVideos/Goal_generate_45_202512070511 (1).mp4';
import video5 from './heroVideos/Goal_generate_45_202512070500.mp4';

const HERO_VIDEOS = [video1, video2, video3, video4, video5];
const FADE_DURATION = 1000;

export function HeroVideoBackground() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const activeVideoRef = useRef<HTMLVideoElement>(null);
    const nextVideoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const preloadNext = useCallback(() => {
        if (nextVideoRef.current) {
            const nextIndex = (currentIndex + 1) % HERO_VIDEOS.length;
            nextVideoRef.current.src = HERO_VIDEOS[nextIndex];
            nextVideoRef.current.load();
        }
    }, [currentIndex]);

    const handleVideoEnded = useCallback(() => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % HERO_VIDEOS.length);
            setIsTransitioning(false);
        }, FADE_DURATION);
    }, [isTransitioning]);

    useEffect(() => {
        if (activeVideoRef.current) {
            activeVideoRef.current.src = HERO_VIDEOS[currentIndex];
            activeVideoRef.current.load();
            activeVideoRef.current.play().catch(() => { });
        }
        preloadNext();
    }, [currentIndex, preloadNext]);

    useEffect(() => {
        if (activeVideoRef.current) {
            activeVideoRef.current.play().then(() => setIsLoaded(true)).catch(() => { });
        }
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        activeVideoRef.current?.play().catch(() => { });
                    } else {
                        activeVideoRef.current?.pause();
                    }
                });
            },
            { threshold: 0.1 }
        );
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden">
            {/* Fallback gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20 transition-opacity duration-1000 ${isLoaded ? 'opacity-0' : 'opacity-100'}`} />

            {/* Active video */}
            <video
                ref={activeVideoRef}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                src={HERO_VIDEOS[0]}
                muted
                playsInline
                preload="auto"
                onEnded={handleVideoEnded}
                onCanPlay={() => setIsLoaded(true)}
            />

            {/* Next video for crossfade */}
            <video
                ref={nextVideoRef}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
                muted
                playsInline
                preload="none"
            />

            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/80" />

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f08_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f08_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>
    );
}

export default HeroVideoBackground;
