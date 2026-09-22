import React, { useState, useEffect, useRef } from 'react';

/**
 * Limpia ceros a la izquierda innecesarios sin romper números válidos como "0", "0.", "0.5".
 * Ejemplos: "010" -> "10", "05" -> "5", "00" -> "0", "00.5" -> "0.5".
 */
export function limpiarCerosALaIzquierda(str: string): string {
  if (!str) return '';
  // Si empieza con uno o más ceros seguidos de un dígito del 1 al 9: "01" -> "1", "010" -> "10"
  if (/^0+[1-9]/.test(str)) {
    return str.replace(/^0+/, '');
  }
  // Si empieza con múltiples ceros antes de punto o fin: "00" -> "0", "00.5" -> "0.5"
  if (/^0+0(\.|$)/.test(str)) {
    return str.replace(/^0+/, '0');
  }
  return str;
}

export interface InputPorcentajeProps {
  value: number | undefined | null;
  onChange: (nuevoValor: number) => void;
  onChangeNullable?: (nuevoValor: number | undefined) => void;
  min?: number;
  max?: number;
  step?: string | number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  autoFocus?: boolean;
  selectAllOnFocus?: boolean;
  valorPorDefectoEnBlur?: number; // Por defecto 0
  allowEmpty?: boolean; // Si true, al salir puede quedar vacío y emitir undefined
  permitirDecimales?: boolean; // Por defecto true
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const InputPorcentaje: React.FC<InputPorcentajeProps> = ({
  value,
  onChange,
  onChangeNullable,
  min = 0,
  max = 100,
  step = '0.01',
  placeholder = '0',
  disabled = false,
  className = '',
  id,
  name,
  autoFocus = false,
  selectAllOnFocus = true,
  valorPorDefectoEnBlur = 0,
  allowEmpty = false,
  permitirDecimales = true,
  onBlur,
  onFocus,
}) => {
  const formatearValorInicial = (val: number | undefined | null): string => {
    if (val === undefined || val === null || isNaN(val)) {
      return '';
    }
    return String(val);
  };

  const [texto, setTexto] = useState<string>(() => formatearValorInicial(value));
  const isFocusedRef = useRef<boolean>(false);
  const ultimoValidoRef = useRef<number | undefined>(
    value !== undefined && value !== null && !isNaN(value) ? value : undefined
  );

  // Sincronizar cambios externos cuando el campo NO tiene foco activo
  useEffect(() => {
    if (!isFocusedRef.current) {
      setTexto(formatearValorInicial(value));
      if (value !== undefined && value !== null && !isNaN(value)) {
        ultimoValidoRef.current = value;
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Normalizar coma por punto para facilitar escritura en teclados en español
    raw = raw.replace(/,/g, '.');

    // Si comienza con punto ".", anteponer "0."
    if (raw === '.') {
      raw = '0.';
    }

    // Filtrar caracteres: permitir solo dígitos y máximo un punto si se admiten decimales
    if (permitirDecimales) {
      if (!/^[0-9]*\.?[0-9]*$/.test(raw)) {
        return;
      }
    } else {
      if (!/^[0-9]*$/.test(raw)) {
        return;
      }
    }

    // Limpiar ceros a la izquierda (ej: "010" -> "10", "05" -> "5", pero preservando "0", "0.", "0.5")
    raw = limpiarCerosALaIzquierda(raw);

    setTexto(raw);

    // Si el usuario borró todo y el campo queda vacío:
    if (raw === '') {
      if (allowEmpty && onChangeNullable) {
        onChangeNullable(undefined);
      }
      // No forzamos un 0 en el texto mientras el usuario escribe activamente
      return;
    }

    // Si termina en punto (ej: "12."), aún está escribiendo los decimales
    if (raw.endsWith('.')) {
      const parsed = parseFloat(raw.slice(0, -1));
      if (!isNaN(parsed)) {
        ultimoValidoRef.current = parsed;
        onChange(parsed);
      }
      return;
    }

    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      ultimoValidoRef.current = parsed;
      onChange(parsed);
    }
  };

  const handleFocusInternal = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = true;
    if (selectAllOnFocus) {
      e.target.select();
    }
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlurInternal = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = false;

    // Si el campo quedó vacío al desenfocar
    if (texto.trim() === '') {
      if (allowEmpty) {
        setTexto('');
        if (onChangeNullable) {
          onChangeNullable(undefined);
        }
      } else {
        const fallback = valorPorDefectoEnBlur !== undefined ? valorPorDefectoEnBlur : (ultimoValidoRef.current ?? 0);
        setTexto(String(fallback));
        ultimoValidoRef.current = fallback;
        onChange(fallback);
      }
    } else {
      // Si hay contenido, normalizar número y limitar a min/max
      let parsed = parseFloat(texto);
      if (isNaN(parsed)) {
        parsed = valorPorDefectoEnBlur ?? 0;
      }

      if (min !== undefined && parsed < min) parsed = min;
      if (max !== undefined && parsed > max) parsed = max;

      const textoFinal = String(parsed);
      setTexto(textoFinal);
      ultimoValidoRef.current = parsed;
      onChange(parsed);
    }

    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      id={id}
      name={name}
      disabled={disabled}
      autoFocus={autoFocus}
      placeholder={placeholder}
      value={texto}
      onChange={handleChange}
      onFocus={handleFocusInternal}
      onBlur={handleBlurInternal}
      className={className}
    />
  );
};

export default InputPorcentaje;
