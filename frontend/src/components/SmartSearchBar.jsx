// src/components/SmartSearchBar.jsx
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faFilter,
  faTimes,
  faHistory,
  faChartLine,
  faSpinner,
  faBrain,
  faMagic,
} from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";
import catalogService from "../services/catalogService";

export default function SmartSearchBar({ onSearch, onFilterChange }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [aiSearchEnabled, setAiSearchEnabled] = useState(false);
  const [aiSearchMessage, setAiSearchMessage] = useState("");
  const searchRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Cargar categorías al montar
  useEffect(() => {
    loadCategories();
    loadRecentSearches();
    loadTrendingSearches();
  }, []);

  // Click fuera para cerrar sugerencias
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get("/catalogodigital/public/categorias/");
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadRecentSearches = () => {
    try {
      const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      setRecentSearches(recent.slice(0, 5));
    } catch {
      setRecentSearches([]);
    }
  };

  const loadTrendingSearches = async () => {
    try {
      // Obtener búsquedas populares desde el backend o usar predefinidas
      const response = await api.get(
        "/catalogodigital/public/videos/?page_size=10&ordering=-visualizaciones"
      );
      const videos = response.data.results || [];
      const trending = videos
        .map((v) => v.titulo)
        .filter((t) => t && t.length > 0)
        .slice(0, 5);
      setTrendingSearches(trending);
    } catch {
      // Búsquedas predefinidas si falla
      setTrendingSearches([
        "Matemáticas",
        "Física",
        "Programación",
        "Historia",
        "Ciencias",
      ]);
    }
  };

  const saveRecentSearch = (term) => {
    if (!term.trim()) return;
    try {
      const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      const updated = [term, ...recent.filter((s) => s !== term)].slice(0, 10);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      setRecentSearches(updated.slice(0, 5));
    } catch (error) {
      console.error("Error saving search:", error);
    }
  };

  const fetchSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Buscar videos que coincidan
      const response = await api.get(
        `/catalogodigital/public/videos/?search=${encodeURIComponent(
          query
        )}&page_size=8`
      );
      const videos = response.data.results || [];

      // Crear sugerencias únicas basadas en títulos y descripciones
      const titleSuggestions = videos.map((v) => v.titulo);
      const uniqueSuggestions = [...new Set(titleSuggestions)];

      setSuggestions(uniqueSuggestions.slice(0, 6));
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);

    // Debounce para autocompletado
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      setSuggestions([]);
    }
  };

  const handleSearch = async (term = searchTerm) => {
    if (!term.trim() && !selectedCategory) return;

    const searchQuery = term.trim();
    if (searchQuery) {
      saveRecentSearch(searchQuery);
    }

    setShowSuggestions(false);
    setAiSearchMessage("");

    // Si el modo IA está activado, usar búsqueda semántica
    if (aiSearchEnabled && searchQuery) {
      setLoading(true);
      try {
        const result = await catalogService.semanticSearch(searchQuery);
        setAiSearchMessage(result.message || "");

        // Propagar resultados al componente padre
        if (onSearch) {
          onSearch(searchQuery, selectedCategory, result.results);
        }
      } catch (error) {
        console.error("Error en búsqueda semántica:", error);
        setAiSearchMessage(
          "Error al realizar búsqueda con IA. Usando búsqueda tradicional."
        );

        // Fallback a búsqueda tradicional
        if (onSearch) {
          onSearch(searchQuery, selectedCategory);
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Búsqueda tradicional
      if (onSearch) {
        onSearch(searchQuery, selectedCategory);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    if (onFilterChange) {
      onFilterChange(categoryId);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSuggestions([]);
    setSelectedCategory("");
    if (onSearch) {
      onSearch("", "");
    }
  };

  const clearRecentSearches = () => {
    localStorage.removeItem("recentSearches");
    setRecentSearches([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto" ref={searchRef}>
      {/* Barra de búsqueda principal */}
      <div className="relative">
        <div className="flex items-center gap-3">
          {/* Input de búsqueda */}
          <div className="flex-1 relative">
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Buscar videos, categorías, temas..."
                className="w-full pl-12 pr-10 py-3 border-2 border-gray-300 rounded-full focus:border-blue-500 focus:outline-none transition-all duration-200 text-gray-700"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}
              {loading && (
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin"
                />
              )}
            </div>
          </div>

          {/* Botón de búsqueda IA */}
          <button
            onClick={() => setAiSearchEnabled(!aiSearchEnabled)}
            className={`px-4 py-3 rounded-full border-2 transition-all duration-200 flex items-center gap-2 ${
              aiSearchEnabled
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-purple-500 shadow-lg"
                : "bg-white text-gray-700 border-gray-300 hover:border-purple-500"
            }`}
            title={
              aiSearchEnabled
                ? "IA activada - Búsqueda semántica"
                : "Activar búsqueda con IA"
            }
          >
            <FontAwesomeIcon
              icon={faBrain}
              className={aiSearchEnabled ? "animate-pulse" : ""}
            />
            <span className="hidden sm:inline">IA</span>
          </button>

          {/* Botón de filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-full border-2 transition-all duration-200 ${
              showFilters || selectedCategory
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
            }`}
            title="Filtros"
          >
            <FontAwesomeIcon icon={faFilter} className="mr-2" />
            Filtros
            {selectedCategory && (
              <span className="ml-2 bg-white text-blue-500 rounded-full w-5 h-5 inline-flex items-center justify-center text-xs font-bold">
                1
              </span>
            )}
          </button>
        </div>

        {/* Panel de sugerencias */}
        {showSuggestions && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Sugerencias de búsqueda */}
            {suggestions.length > 0 && (
              <div className="border-b border-gray-100">
                <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                  Sugerencias
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 transition-colors duration-150"
                  >
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="text-gray-400 text-sm"
                    />
                    <span className="text-gray-700 flex-1 truncate">
                      {suggestion}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Búsquedas recientes */}
            {!searchTerm && recentSearches.length > 0 && (
              <div className="border-b border-gray-100">
                <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Búsquedas recientes
                  </span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    Limpiar
                  </button>
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 transition-colors duration-150"
                  >
                    <FontAwesomeIcon
                      icon={faHistory}
                      className="text-gray-400 text-sm"
                    />
                    <span className="text-gray-700 flex-1 truncate">
                      {search}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Búsquedas populares */}
            {!searchTerm && trendingSearches.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                  Búsquedas populares
                </div>
                {trendingSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 transition-colors duration-150"
                  >
                    <FontAwesomeIcon
                      icon={faChartLine}
                      className="text-orange-500 text-sm"
                    />
                    <span className="text-gray-700 flex-1 truncate">
                      {search}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Sin resultados */}
            {searchTerm &&
              !loading &&
              suggestions.length === 0 &&
              recentSearches.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500">
                  No se encontraron sugerencias
                </div>
              )}
          </div>
        )}
      </div>

      {/* Mensaje de estado de búsqueda IA */}
      {aiSearchEnabled && (
        <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 flex items-start gap-3">
          <FontAwesomeIcon icon={faMagic} className="text-purple-500 mt-1" />
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-900">
              Búsqueda semántica con IA activada
            </p>
            <p className="text-xs text-purple-700 mt-1">
              Puedes usar lenguaje natural. Ejemplo: "videos sobre cálculo
              integral" o "tutoriales de programación para principiantes"
            </p>
            {aiSearchMessage && (
              <p className="text-xs text-purple-600 mt-2 font-medium">
                {aiSearchMessage}
              </p>
            )}
          </div>
          <button
            onClick={() => setAiSearchEnabled(false)}
            className="text-purple-400 hover:text-purple-600 text-xs"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      {/* Panel de filtros */}
      {showFilters && (
        <div className="mt-4 p-4 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              Filtrar por categoría
            </h3>
            {selectedCategory && (
              <button
                onClick={() => {
                  setSelectedCategory("");
                  if (onFilterChange) onFilterChange("");
                }}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange("")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === ""
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todas
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id.toString())}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.id.toString()
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
