export const STRUCTURE_COLORS = {
  skag: { bg: 'bg-[#0891B2]', text: 'text-white', border: 'border-[#0891B2]' },
  stag: { bg: 'bg-[#7C3AED]', text: 'text-white', border: 'border-[#7C3AED]' },
} as const;

export const STATUS_COLORS = {
  emergency: { bg: 'bg-[#EF4444]', text: 'text-white', border: 'border-[#EF4444]' },
  success: { bg: 'bg-[#10B981]', text: 'text-white', border: 'border-[#10B981]' },
  pending: { bg: 'bg-[#F59E0B]', text: 'text-white', border: 'border-[#F59E0B]' },
  info: { bg: 'bg-[#0066CC]', text: 'text-white', border: 'border-[#0066CC]' },
  new: { bg: 'bg-[#EC4899]', text: 'text-white', border: 'border-[#EC4899]' },
  project: { bg: 'bg-[#10B981]', text: 'text-white', border: 'border-[#10B981]' },
  recurring: { bg: 'bg-[#0066CC]', text: 'text-white', border: 'border-[#0066CC]' },
  draft: { bg: 'bg-[#F59E0B]', text: 'text-white', border: 'border-[#F59E0B]' },
  completed: { bg: 'bg-[#10B981]', text: 'text-white', border: 'border-[#10B981]' },
  active: { bg: 'bg-[#10B981]', text: 'text-white', border: 'border-[#10B981]' },
  in_progress: { bg: 'bg-[#0066CC]', text: 'text-white', border: 'border-[#0066CC]' },
  started: { bg: 'bg-[#F59E0B]', text: 'text-white', border: 'border-[#F59E0B]' },
} as const;

export type StructureType = keyof typeof STRUCTURE_COLORS;
export type StatusType = keyof typeof STATUS_COLORS;

export function getStructureBadgeClasses(structure: string): string {
  const key = structure.toLowerCase() as StructureType;
  const colors = STRUCTURE_COLORS[key];
  if (colors) {
    return `${colors.bg} ${colors.text} ${colors.border}`;
  }
  return 'bg-slate-500 text-white border-slate-500';
}

export function getStatusBadgeClasses(status: string): string {
  const key = status.toLowerCase() as StatusType;
  const colors = STATUS_COLORS[key];
  if (colors) {
    return `${colors.bg} ${colors.text} ${colors.border}`;
  }
  return 'bg-slate-500 text-white border-slate-500';
}

export function getBadgeClasses(structure?: string, status?: string): string {
  if (structure) {
    return getStructureBadgeClasses(structure);
  }
  if (status) {
    return getStatusBadgeClasses(status);
  }
  return 'bg-slate-500 text-white border-slate-500';
}
