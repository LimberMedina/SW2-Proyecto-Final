import { forwardRef, useId } from "react";
import clsx from "clsx";

const Input = forwardRef(
  (
    {
      id,
      label,
      name,
      type = "text",
      placeholder,
      value = "",
      onChange,
      onBlur,
      error,
      helpText,
      leftIcon,
      rightIcon,
      disabled = false,
      required = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    // id prioridad > name > autoId
    const inputId = id || (name ? `input-${name}` : `input-${autoId}`);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-sm">{leftIcon}</span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name} // si no hay name, puede quedar undefined sin problema
            type={type}
            value={value ?? ""} // evita pasar undefined
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={clsx(
              "w-full px-3 py-2 border rounded-lg transition-colors duration-200",
              "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
              leftIcon ? "pl-10" : "",
              rightIcon ? "pr-10" : "",
              error
                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-gray-400 text-sm">{rightIcon}</span>
            </div>
          )}
        </div>

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helpText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helpText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
