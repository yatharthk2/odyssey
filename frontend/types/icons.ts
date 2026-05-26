import type { ComponentType, SVGProps } from 'react';

/**
 * react-icons types its icons as `(props) => ReactNode`, which React 19's stricter
 * JSX namespace rejects when used as a component (it wants `ReactElement | null`).
 * We treat every imported icon as a plain `ComponentType<SVGProps<SVGSVGElement>>`;
 * the runtime behavior is identical. Use {@link asIconMap} when defining a lookup
 * table so the cast happens exactly once per file.
 */
export type Icon = ComponentType<
  SVGProps<SVGSVGElement> & { size?: string | number; color?: string; title?: string }
>;

export function asIconMap<K extends string>(
  map: Record<K, unknown>
): Record<K, Icon> {
  return map as Record<K, Icon>;
}

export function asIcon(icon: unknown): Icon {
  return icon as Icon;
}
