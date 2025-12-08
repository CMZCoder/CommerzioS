/**
 * HeroVideoBackground Component
 * 
 * True crossfade video background - next video plays underneath current,
 * then we fade the current video out revealing the playing next video.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Import videos - Vite handles these as assets
import video1 from './heroVideos/Goal_generate_45_202512070509.mp4';
import video2 from './heroVideos/Goal_generate_45_202512070504.mp4';
import video3 from './heroVideos/Goal_generate_45_202512070457.mp4';
import video4 from './heroVideos/Goal_generate_45_202512070511 (1).mp4';
import video5 from './heroVideos/Goal_generate_45_202512070500.mp4';

const HERO_VIDEOS = [video1, video2, video3, video4, video5];
const CROSSFADE_DURATION = 1500;
const PRELOAD_BEFORE_END = 3000;

export function HeroVideoBackground() {
    const [activeVideo, setActiveVideo] = useState(0);
    const [isCrossfading, setIsCrossfading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [nextVideoReady, setNextVideoReady] = useState(false);

    const videoARef = useRef<HTMLVideoElement>(null);
    const videoBRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeElement, setActiveElement] = useState<'A' | 'B'>('A');

    const getActiveRef = () => activeElement === 'A' ? videoARef : videoBRef;
    const getNextRef = () => activeElement === 'A' ? videoBRef : videoARef;

    const preloadNextVideo = useCallback(() => {
        const nextRef = getNextRef();
        const nextIndex = (activeVideo + 1) % HERO_VIDEOS.length;
        if (nextRef.current) {
            nextRef.current.src = HERO_VIDEOS[nextIndex];
            nextRef.current.load();
        }
    }, [activeVideo, activeElement]);

    const handleTimeUpdate = useCallback(() => {
        const activeRef = getActiveRef();
        if (!activeRef.current) return;
        const timeRemaining = (activeRef.current.duration - activeRef.current.currentTime) * 1000;
        if (timeRemaining <= PRELOAD_BEFORE_END && !nextVideoReady) {
            preloadNextVideo();
        }
    }, [preloadNextVideo, nextVideoReady, activeElement]);

    const handleNextVideoReady = useCallback(() => {
        setNextVideoReady(true);
    }, []);

    const handleVideoEnded = useCallback(() => {
        if (isCrossfading) return;
        const nextRef = getNextRef();
        if (!nextRef.current) return;
        nextRef.current.currentTime = 0;
        nextRef.current.play().catch(() => { });
        setIsCrossfading(true);
        setTimeout(() => {
            setActiveVideo((prev) => (prev + 1) % HERO_VIDEOS.length);
            setActiveElement((prev) => prev === 'A' ? 'B' : 'A');
            setIsCrossfading(false);
            setNextVideoReady(false);
        }, CROSSFADE_DURATION);
    }, [isCrossfading, activeElement]);

    useEffect(() => {
        const videoA = videoARef.current;
        if (videoA) {
            videoA.src = HERO_VIDEOS[0];
            videoA.load();
            videoA.play().then(() => setIsLoaded(true)).catch(() => { });
        }
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const activeRef = getActiveRef();
                    if (entry.isIntersecting) {
                        activeRef.current?.play().catch(() => { });
                    } else {
                        activeRef.current?.pause();
                    }
                });
            },
            { threshold: 0.1 }
        );
        observer.observe(container);
        return () => observer.disconnect();
    }, [activeElement]);

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden">
            {/* Fallback gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20 transition-opacity duration-1000 ${isLoaded ? 'opacity-0' : 'opacity-100'}`} />

            {/* Video B - underneath */}
            <video
                ref={videoBRef}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ zIndex: 1 }}
                muted
                playsInline
                preload="auto"
                onCanPlayThrough={activeElement === 'A' ? handleNextVideoReady : undefined}
                onEnded={activeElement === 'B' ? handleVideoEnded : undefined}
                onTimeUpdate={activeElement === 'B' ? handleTimeUpdate : undefined}
            />

            {/* Video A - on top, fades out during crossfade */}
            <video
                ref={videoARef}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                    zIndex: 2,
                    opacity: activeElement === 'A' ? (isCrossfading ? 0 : 1) : 0,
                    transition: `opacity ${CROSSFADE_DURATION}ms ease-in-out`
                }}
                muted
                playsInline
                preload="auto"
                onCanPlayThrough={activeElement === 'B' ? handleNextVideoReady : undefined}
                onEnded={activeElement === 'A' ? handleVideoEnded : undefined}
                onTimeUpdate={activeElement === 'A' ? handleTimeUpdate : undefined}
            />

            {/* Dark overlay - balanced without strong white bottom */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" style={{ zIndex: 3 }} />

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f08_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f08_1px,transparent_1px)] bg-[size:24px_24px]" style={{ zIndex: 4 }} />
        </div>
    );
}

export default HeroVideoBackground;
