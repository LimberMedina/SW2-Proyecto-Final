import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";

const Alert = ({
  type = "info",
  message,
  title,
  onClose,
  autoClose = false,
  autoCloseTime = 5000,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) {
          setTimeout(() => onClose(), 300); // Delay para la animación
        }
      }, autoCloseTime);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTime, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(() => onClose(), 300); // Delay para la animación
    }
  };

  const alertConfig = {
    success: {
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      iconColor: "text-green-400",
      icon: faCheckCircle,
    },
    error: {
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
      iconColor: "text-red-400",
      icon: faExclamationTriangle,
    },
    warning: {
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-800",
      iconColor: "text-yellow-400",
      icon: faExclamationTriangle,
    },
    info: {
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      iconColor: "text-blue-400",
      icon: faInfoCircle,
    },
  };

  const config = alertConfig[type];

  if (!isVisible) return null;

  return (
    <div
      className={clsx(
        "rounded-lg border p-4 transition-all duration-300 ease-in-out",
        config.bgColor,
        config.borderColor,
        isVisible
          ? "opacity-100 transform scale-100"
          : "opacity-0 transform scale-95",
        className
      )}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FontAwesomeIcon
            icon={config.icon}
            className={clsx("h-5 w-5", config.iconColor)}
          />
        </div>

        <div className="ml-3 flex-1">
          {title && (
            <h3 className={clsx("text-sm font-medium", config.textColor)}>
              {title}
            </h3>
          )}

          <div
            className={clsx("text-sm", config.textColor, title ? "mt-1" : "")}
          >
            {message}
          </div>
        </div>

        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={handleClose}
                className={clsx(
                  "inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors",
                  config.textColor,
                  "hover:bg-gray-100 focus:ring-gray-600"
                )}
              >
                <span className="sr-only">Cerrar</span>
                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
