import React, { useEffect, useRef, useState } from "react";
import "../styles/About.css";

function About() {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = containerRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) observer.unobserve(element);
    };
  }, []);

  return (
    <section
      className={`about-section ${isVisible ? "fade-in-visible" : "fade-in-hidden"}`}
      ref={containerRef}
    >
      <div className="about-container">
        <h2 className="about-title">About Our Blogging Platform</h2>
        <div className="about-divider" />
        <p className="about-text">
          Welcome to <span className="highlight">MyApp</span> — your go-to platform for sharing ideas,
          stories, and knowledge. We empower bloggers from around the world to create, connect, and inspire.
        </p>
        <p className="about-text">
          Whether you’re a seasoned writer or just starting out, our user-friendly tools and vibrant
          community provide the perfect space to express yourself and grow your audience.
        </p>
        <p className="about-text">
          Join us today and be part of a dynamic network of passionate creators!
        </p>
      </div>
    </section>
  );
}

export default About;
