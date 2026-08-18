"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Project } from "@/data/site";

type ProjectGalleryProps = {
  projects: readonly Project[];
};

export function ProjectGallery({ projects }: ProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const isOpen = activeIndex !== null;

  const closeViewer = useCallback(() => setActiveIndex(null), []);
  const move = useCallback((direction: number) => {
    setActiveIndex((current) => {
      if (current === null) return null;
      return (current + direction + projects.length) % projects.length;
    });
  }, [projects.length]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.classList.add("project-viewer-open");
    requestAnimationFrame(() => closeRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeViewer();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const controls = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (controls.length === 0) return;

      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.body.classList.remove("project-viewer-open");
      openerRef.current?.focus();
    };
  }, [closeViewer, isOpen, move]);

  function openViewer(index: number, opener: HTMLButtonElement) {
    openerRef.current = opener;
    setActiveIndex(index);
  }

  const activeProject = activeIndex === null ? null : projects[activeIndex];

  return <>
    <div className="project-grid">{projects.map((project, index) => <article className={`project-card${project.featured ? " project-card-featured" : ""}`} key={project.id}>
      <button className="project-card-trigger" type="button" aria-haspopup="dialog" aria-label={`Ver fotografía completa: ${project.title}`} onClick={(event) => openViewer(index, event.currentTarget)}/>
      <div className="project-image"><Image src={project.image} alt={project.imageAlt} fill sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1050px) 50vw, 33vw"/></div>
      <div><span>{project.category}</span><h3>{project.title}</h3><p>{project.description}</p><small>{project.location}</small></div>
    </article>)}</div>

    {activeProject && activeIndex !== null ? createPortal(
      <div className="project-viewer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeViewer(); }}>
        <div className="project-viewer" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="project-viewer-title" aria-describedby="project-viewer-description">
          <button className="project-viewer-close" ref={closeRef} type="button" onClick={closeViewer} aria-label="Cerrar visor"><span aria-hidden="true">×</span></button>
          <div className="project-viewer-media"><Image src={activeProject.image} alt={activeProject.imageAlt} fill sizes="(max-width: 760px) calc(100vw - 24px), 70vw" priority/></div>
          <div className="project-viewer-copy">
            <span className="project-viewer-category">{activeProject.category}</span>
            <h2 id="project-viewer-title">{activeProject.title}</h2>
            <p id="project-viewer-description">{activeProject.description}</p>
            <p className="project-viewer-location">{activeProject.location}</p>
            <div className="project-viewer-navigation">
              <button className="project-viewer-nav-button" type="button" onClick={() => move(-1)} aria-label="Ver fotografía anterior"><span aria-hidden="true">←</span><span>Anterior</span></button>
              <p className="project-viewer-counter" aria-live="polite">{activeIndex + 1} de {projects.length}</p>
              <button className="project-viewer-nav-button" type="button" onClick={() => move(1)} aria-label="Ver fotografía siguiente"><span>Siguiente</span><span aria-hidden="true">→</span></button>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    ) : null}
  </>;
}