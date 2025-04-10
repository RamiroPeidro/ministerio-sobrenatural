"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value?: number[] | readonly number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  className?: string;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value, min = 0, max = 100, step = 1, onValueChange, disabled, ...props }, ref) => {
    // Si value no es un array o es undefined, usamos [min, max] como valor predeterminado
    const values = Array.isArray(value) ? value : [min, max];
    
    // Manejar el cambio para un slider específico (índice)
    const handleChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value);
      const newValues = [...values];
      
      // Actualizar el valor en el índice correspondiente
      newValues[index] = newValue;
      
      // Si es el primer slider (min), asegurarse de que no supere al segundo (max)
      if (index === 0 && newValues[0] > (newValues[1] || max)) {
        newValues[0] = newValues[1] || max;
      }
      
      // Si es el segundo slider (max), asegurarse de que no sea menor que el primero (min)
      if (index === 1 && newValues[1] < (newValues[0] || min)) {
        newValues[1] = newValues[0] || min;
      }
      
      onValueChange?.(newValues);
    };
    
    // Calcular porcentajes para visualización
    const minPercent = ((values[0] || min) - min) / (max - min) * 100;
    const maxPercent = ((values[1] || max) - min) / (max - min) * 100;
    
    return (
      <div
        ref={ref}
        className={cn("relative flex w-full touch-none select-none items-center my-4", className)}
      >
        {/* Track base */}
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200">
          {/* Range indicator */}
          <div 
            className="absolute h-full bg-primary" 
            style={{ 
              left: `${minPercent}%`, 
              width: `${maxPercent - minPercent}%` 
            }}
          />
        </div>
        
        {/* Sliders */}
        <div className="absolute w-full">
          {/* Min slider */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={values[0] || min}
            onChange={handleChange(0)}
            disabled={disabled}
            className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none"
            style={{
              // Para hacerlo transparente pero mantener la funcionalidad
              opacity: 0,
              zIndex: 3
            }}
          />
          
          {/* Thumb para min */}
          <div 
            className="absolute h-5 w-5 rounded-full border-2 border-primary bg-background shadow-sm"
            style={{ 
              left: `calc(${minPercent}% - 10px)`,
              top: "-6px",
              zIndex: 2,
              pointerEvents: "none"
            }} 
          />
          
          {/* Max slider si hay un segundo valor */}
          {values.length > 1 && (
            <>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={values[1] || max}
                onChange={handleChange(1)}
                disabled={disabled}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none"
                style={{
                  opacity: 0,
                  zIndex: 4
                }}
              />
              
              {/* Thumb para max */}
              <div 
                className="absolute h-5 w-5 rounded-full border-2 border-primary bg-background shadow-sm"
                style={{ 
                  left: `calc(${maxPercent}% - 10px)`,
                  top: "-6px",
                  zIndex: 2,
                  pointerEvents: "none"
                }} 
              />
            </>
          )}
        </div>
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
