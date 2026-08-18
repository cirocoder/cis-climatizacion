import path from "node:path";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const root = process.cwd();
const originals = path.join(root, "private-originals", "projects");
const edited = path.join(root, "private-originals", "projects-edited");
const output = path.join(root, "public", "images", "projects");

const jobs = [
  ["InstalacionDeAireR32.jpg", "instalacion-preparacion-aire-acondicionado.webp"],
  ["instalacion-equipo-split-aeropuerto-redactada.png", "instalacion-equipo-split-aeropuerto.webp", "edited"],
  ["InstalacionDeVariosEquiposDeAireEnAristides.jpg", "instalacion-equipos-climatizacion-cubierta.webp"],
  ["InstalacionElectricaTablero.jpg", "instalacion-cableado-tablero-electrico.webp", "brighten"],
  ["MantenimientoDeCalefactorCentralEnHogar.jpg", "mantenimiento-calefactor-central-gas.webp"],
  ["MantenimientoEquiposPisoTechoEnAuditorioMendoza.jpg", "mantenimiento-equipo-piso-techo.webp"],
  ["MantenimientoPreventivoDeAireAcondicionadoEnIncluirSalud.jpg", "verificacion-temperatura-climatizacion.webp"],
  ["PruebaDeHermeticidadGas.jpg", "prueba-hermeticidad-instalacion-gas.webp"],
  ["reparacion-caldera-redactada.png", "reparacion-caldera-mural.webp", "edited"],
  ["ReparacionDeEquipoPisoTechoEnZoomBazar.jpg", "mantenimiento-equipo-piso-techo-comercio.webp"],
  ["VerificacionDeEquipos.jpg", "verificacion-electrica-unidades-exteriores.webp"],
];

await mkdir(output, { recursive: true });

for (const [sourceName, outputName, treatment] of jobs) {
  const sourceDir = treatment === "edited" ? edited : originals;
  let pipeline = sharp(path.join(sourceDir, sourceName), { failOn: "error" }).rotate();

  if (treatment === "brighten") {
    pipeline = pipeline.modulate({ brightness: 1.13, saturation: 1.02 }).sharpen({ sigma: 0.45 });
  }

  await pipeline
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84, effort: 6, smartSubsample: true })
    .toFile(path.join(output, outputName));
}

console.log(`Generated ${jobs.length} public project images.`);