import React, { useState, useEffect, useRef } from 'react';

/**
 * Formatea un número como moneda COP con el símbolo $ y separador de miles por punto.
 * Ejemplo: 5000000 -> "$5.000.000"
 */
export function formatearValorMonedaCOP(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '';
  }
  return `$${Math.round(num).toLocaleString('es-CO')}`;
}

/**
 * Extrae el valor numérico entero de una cadena con formato monetario.
 */
export function extraerNumeroCOP(str: string): number {
  const digits = str.replace(/[^0-9]/g, '');
  if (!digits) return 0;
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export interface InputMonedaProps {
  value: number | undefined | null;
  onChange: (nuevoValor: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  autoFocus?: boolean;
  min?: number;
  max?: number;
  valorPorDefectoEnBlur?: number; // Por defecto 0
  allowEmpty?: boolean;
  selectAllOnFocus?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const InputMoneda: React.FC<InputMonedaProps> = ({
  value,
  onChange,
  placeholder = '$0',
  disabled = false,
  className = '',
  id,
  name,
  autoFocus = false,
  min = 0,
  max,
  valorPorDefectoEnBlur = 0,
  allowEmpty = false,
  selectAllOnFocus = true,
  onBlur,
  onFocus,
}) => {
  const [texto, setTexto] = useState<string>(() => formatearValorMonedaCOP(value));
  const isFocusedRef = useRef<boolean>(false);
  const ultimoValidoRef = useRef<number | undefined>(
    value !== undefined && value !== null && !isNaN(value) ? value : undefined
  );

  // Sincronizar cambios externos cuando el campo no tiene foco activo
  useEffect(() => {
    if (!isFocusedRef.current) {
      setTexto(formatearValorMonedaCOP(value));
      if (value !== undefined && value !== null && !isNaN(value)) {
        ultimoValidoRef.current = value;
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/[^0-9]/g, '');

    // Si el usuario borró todo y el campo queda vacío
    if (digits === '') {
      setTexto('');
      return;
    }

    // Quitar ceros a la izquierda
    const cleanDigits = digits.replace(/^0+/, '');

    if (cleanDigits === '') {
      // El usuario ingresó "0"
      setTexto('$0');
      ultimoValidoRef.current = 0;
      onChange(0);
      return;
    }

    const num = parseInt(cleanDigits, 10);
    if (!isNaN(num)) {
      setTexto(`$${num.toLocaleString('es-CO')}`);
      ultimoValidoRef.current = num;
      onChange(num);
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

    if (texto.trim() === '') {
      if (allowEmpty) {
        setTexto('');
      } else {
        const fallback = valorPorDefectoEnBlur !== undefined ? valorPorDefectoEnBlur : (ultimoValidoRef.current ?? 0);
        setTexto(formatearValorMonedaCOP(fallback));
        ultimoValidoRef.current = fallback;
        onChange(fallback);
      }
    } else {
      let num = extraerNumeroCOP(texto);
      if (min !== undefined && num < min) num = min;
      if (max !== undefined && num > max) num = max;

      setTexto(formatearValorMonedaCOP(num));
      ultimoValidoRef.current = num;
      onChange(num);
    }

    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
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

export default InputMoneda;
