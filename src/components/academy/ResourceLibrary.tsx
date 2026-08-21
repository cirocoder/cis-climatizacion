import { Icon } from "@/components/icons";
import { KIT_CIS_5P_RESOURCE_DEFINITIONS } from "@/data/resources";

export type PublicResource = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  mimeType: string | null;
  fileSize: number | null;
  downloadName: string | null;
  position: number;
};

const groups = [
  { title: "Plantillas y documentación", matches: (resource: PublicResource) => resource.position >= 2 && resource.position <= 6 },
  { title: "Videos", matches: (resource: PublicResource) => resource.type === "VIDEO" },
] as const;

function resourceIcon(type: string) {
  return type === "VIDEO" ? "screen" : type === "PDF" ? "certificate" : "check";
}

function resourceAccessUrl(resourceId: string, disposition: "inline" | "attachment") {
  return `/api/academy/resources/${encodeURIComponent(resourceId)}/access?disposition=${disposition}`;
}

function resourceFormat(resource: PublicResource) {
  if (resource.mimeType === "application/pdf") return "PDF";
  if (resource.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "DOCX";
  if (resource.mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return "XLSX";
  if (resource.mimeType === "video/mp4") return "MP4";
  if (resource.mimeType === "video/webm") return "WebM";
  if (resource.type === "PDF" || resource.type === "OTHER") return "PDF";
  if (resource.type === "MEASUREMENT_SHEET") return "XLSX";
  if (resource.type === "VIDEO") return "MP4 / WebM";
  return "PDF / DOCX";
}

function resourceSize(fileSize: number | null) {
  if (fileSize === null) return null;
  if (fileSize >= 1024 * 1024) return `${(fileSize / (1024 * 1024)).toFixed(fileSize >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
  if (fileSize >= 1024) return `${Math.ceil(fileSize / 1024)} KB`;
  return `${fileSize} B`;
}

function videoPermanentPath(resource: PublicResource) {
  const definition = KIT_CIS_5P_RESOURCE_DEFINITIONS.find(item => item.type === "VIDEO" && item.title === resource.title);
  return definition && "permanentPath" in definition ? definition.permanentPath : null;
}

function ResourceMeta({ resource }: { resource: PublicResource }) {
  const size = resourceSize(resource.fileSize);
  return <div className="private-resource-meta"><span>{resourceFormat(resource)}</span>{size ? <span>{size}</span> : null}</div>;
}

export function ResourceActions({ resource, compact = false }: { resource: PublicResource; compact?: boolean }) {
  if (resource.status !== "AVAILABLE") return <span className="resource-unavailable" aria-label={`${resource.title}: próximamente`}>Próximamente</span>;
  const videoPath = resource.type === "VIDEO" ? videoPermanentPath(resource) : null;
  if (videoPath) return <div className={`private-resource-actions${compact ? " is-compact" : ""}`}><a className="academy-button academy-button-primary" href={videoPath}>Ver video</a></div>;
  const isPdf = resource.mimeType === "application/pdf";
  return <div className={`private-resource-actions${compact ? " is-compact" : ""}`}>
    {isPdf ? <a className="academy-button academy-button-primary" href={resourceAccessUrl(resource.id, "inline")} target="_blank" rel="noopener noreferrer">Abrir</a> : null}
    <a className={isPdf ? "academy-button academy-button-secondary" : "academy-button academy-button-primary"} href={resourceAccessUrl(resource.id, "attachment")}>Descargar</a>
  </div>;
}

export function ResourceLibrary({ resources, showFeatured = true }: { resources: PublicResource[]; showFeatured?: boolean }) {
  const manual = resources.find(resource => resource.type === "PDF");
  return <>
    {showFeatured && manual ? <section className="private-start" aria-labelledby="empeza-por-aca">
      <div className="private-section-label"><span>01</span><div><p className="academy-eyebrow">Manual</p><h2 id="empeza-por-aca">Kit CIS 5P — Ebook</h2></div></div>
      <div className="manual-feature">
        <div className="manual-cover" aria-hidden="true"><small>CIS Academia</small><strong>Kit CIS <b>5P</b></strong><span>Manual técnico</span></div>
        <div className="manual-feature-copy"><span className={`resource-status ${manual.status === "AVAILABLE" ? "is-available" : "is-upcoming"}`}>{manual.status === "AVAILABLE" ? "Disponible" : "Próximamente"}</span><h3>Manual visual del Método CIS 5P</h3>{manual.description ? <p>{manual.description}</p> : null}<ResourceMeta resource={manual}/><ResourceActions resource={manual}/></div>
      </div>
    </section> : null}

    <section className="private-kit-resources" id="tu-kit" aria-labelledby="titulo-tu-kit">
      <div className="private-section-heading"><p className="academy-eyebrow">Tu Kit</p><h2 id="titulo-tu-kit">Recursos y herramientas</h2></div>
      <div className="resource-groups">
        {groups.map(group => {
          const items = resources.filter(group.matches);
          const headingId = `grupo-${group.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-")}`;
          return <section className="resource-group" key={group.title} aria-labelledby={headingId}>
            <h3 id={headingId}>{group.title}</h3>
            <div className="resource-group-list">{items.map(resource => <article className={`private-resource-card${resource.type === "VIDEO" ? " is-video" : ""}`} key={resource.id}>
              <div className="private-resource-icon"><Icon name={resourceIcon(resource.type)}/></div>
              <div className="private-resource-copy"><div><h4>{resource.title}</h4><span className={`resource-status ${resource.status === "AVAILABLE" ? "is-available" : "is-upcoming"}`}>{resource.status === "AVAILABLE" ? "Disponible" : "Próximamente"}</span></div>{resource.description ? <p>{resource.description}</p> : null}<ResourceMeta resource={resource}/><ResourceActions resource={resource} compact/></div>
            </article>)}</div>
          </section>;
        })}
      </div>
    </section>
  </>;
}
