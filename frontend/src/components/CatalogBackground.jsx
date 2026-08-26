import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo,
  faCamera,
  faFilm,
  faClapperboard,
  faTv,
  faCompactDisc,
} from "@fortawesome/free-solid-svg-icons";

/**
 * CatalogBackground - Componente de fondo decorativo para el catálogo
 * Incluye marcas de agua del logo Canal 11 TVU e iconos de medios audiovisuales
 * Este componente puede ser reemplazado fácilmente sin alterar el código del catálogo
 */
export default function CatalogBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {/* Fondo con gradiente sutil de Canal 11 */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 via-gray-100 to-blue-50/30"></div>

      {/* Marcas de agua del texto "CANAL 11 TVU" - Distribuidas estratégicamente */}
      <div className="absolute inset-0">
        {/* Top Left - Logo con texto */}
        <div className="absolute top-16 left-12 opacity-[0.08] -rotate-12">
          <div className="flex items-center gap-3">
            <img
              src="/img/logoTVU.jpg"
              alt=""
              className="w-20 h-20 object-contain"
            />
            <div className="text-5xl font-black text-red-600">
              CANAL 11
              <div className="text-3xl text-blue-600">TVU</div>
            </div>
          </div>
        </div>

        {/* Top Right - Texto con logo */}
        <div className="absolute top-20 right-12 opacity-[0.08] rotate-12">
          <div className="flex items-center gap-3">
            <div className="text-5xl font-black text-blue-600">
              CANAL 11
              <div className="text-3xl text-red-600">TVU</div>
            </div>
            <img
              src="/img/logoTVU.jpg"
              alt=""
              className="w-20 h-20 object-contain"
            />
          </div>
        </div>

        {/* Middle Left - Solo logo */}
        <div className="absolute top-[45%] left-16 -translate-y-1/2 opacity-[0.08] -rotate-6">
          <img
            src="/img/logoTVU.jpg"
            alt=""
            className="w-28 h-28 object-contain"
          />
        </div>

        {/* Middle Right - Solo logo */}
        <div className="absolute top-[45%] right-16 -translate-y-1/2 opacity-[0.08] rotate-6">
          <img
            src="/img/logoTVU.jpg"
            alt=""
            className="w-28 h-28 object-contain"
          />
        </div>

        {/* Bottom Left - TV11 Santa Cruz */}
        <div className="absolute bottom-20 left-16 opacity-[0.08] rotate-12">
          <div className="text-6xl font-black text-red-600">
            TV11
            <div className="text-2xl text-blue-600 text-center">SANTA CRUZ</div>
          </div>
        </div>

        {/* Bottom Right - Canal Once */}
        <div className="absolute bottom-24 right-16 opacity-[0.08] -rotate-12">
          <div className="text-6xl font-black text-blue-600">
            CANAL
            <div className="text-4xl text-red-600">ONCE</div>
          </div>
        </div>
      </div>

      {/* Iconos decorativos de medios audiovisuales - Bien espaciados */}
      <div className="absolute inset-0">
        {/* Cámara - Top Left área */}
        <div className="absolute top-[15%] left-[20%] opacity-[0.05]">
          <FontAwesomeIcon
            icon={faCamera}
            className="text-[9rem] text-red-600"
          />
        </div>

        {/* Video - Top Right área */}
        <div className="absolute top-[18%] right-[18%] opacity-[0.05]">
          <FontAwesomeIcon
            icon={faVideo}
            className="text-[8rem] text-blue-600"
          />
        </div>

        {/* Film - Middle Left área */}
        <div className="absolute top-[50%] left-[25%] opacity-[0.05]">
          <FontAwesomeIcon icon={faFilm} className="text-[7rem] text-red-600" />
        </div>

        {/* Clapperboard - Middle Right área */}
        <div className="absolute top-[55%] right-[22%] opacity-[0.05]">
          <FontAwesomeIcon
            icon={faClapperboard}
            className="text-[9rem] text-blue-600"
          />
        </div>

        {/* TV - Bottom Left área */}
        <div className="absolute bottom-[15%] left-[18%] opacity-[0.05]">
          <FontAwesomeIcon icon={faTv} className="text-[8rem] text-red-600" />
        </div>

        {/* Compact Disc - Bottom Right área */}
        <div className="absolute bottom-[18%] right-[20%] opacity-[0.05]">
          <FontAwesomeIcon
            icon={faCompactDisc}
            className="text-[7rem] text-blue-600"
          />
        </div>

        {/* Camera adicional - Far Left */}
        <div className="absolute top-[70%] left-[10%] opacity-[0.04]">
          <FontAwesomeIcon
            icon={faCamera}
            className="text-[6rem] text-blue-600"
          />
        </div>

        {/* Film adicional - Far Right */}
        <div className="absolute top-[25%] right-[8%] opacity-[0.04]">
          <FontAwesomeIcon icon={faFilm} className="text-[7rem] text-red-600" />
        </div>

        {/* Video - Top Center área */}
        <div className="absolute top-[12%] left-1/2 -translate-x-1/2 opacity-[0.04]">
          <FontAwesomeIcon
            icon={faVideo}
            className="text-[7rem] text-red-600"
          />
        </div>

        {/* TV - Bottom Center área */}
        <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 opacity-[0.04]">
          <FontAwesomeIcon icon={faTv} className="text-[6rem] text-blue-600" />
        </div>
      </div>

      {/* Patrón de líneas diagonales sutiles */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #DC2626 0px, #DC2626 2px, transparent 2px, transparent 10px, #2563EB 10px, #2563EB 12px, transparent 12px, transparent 20px)",
          }}
        ></div>
      </div>
    </div>
  );
}
