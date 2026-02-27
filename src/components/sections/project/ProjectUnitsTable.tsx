import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import FadeUp from '@/components/animations/FadeUp';
import { cn } from '@/lib/utils/cn';

export type UnitStatus = 'available' | 'sold' | 'reserved';

export interface ProjectUnit {
  type: string;
  area: string;
  floor: string;
  price: string;
  status: UnitStatus;
}

interface ProjectUnitsTableProps {
  units: ProjectUnit[];
}

const unitStatusColor: Record<UnitStatus, string> = {
  available: 'text-threshold',
  sold: 'text-stone',
  reserved: 'text-paper',
};

const unitStatusLabel: Record<UnitStatus, string> = {
  available: 'AVAILABLE',
  sold: 'SOLD',
  reserved: 'RESERVED',
};

export default function ProjectUnitsTable({ units }: ProjectUnitsTableProps) {
  if (!units || units.length === 0) return null;

  return (
    <Section>
      <GridWrapper>
        <FadeUp>
          <p className="text-label mb-8 text-stone">UNIT AVAILABILITY</p>
        </FadeUp>
        <FadeUp delay={100}>
          {/* Horizontal scroll on mobile, sticky first column */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-label sticky left-0 bg-void py-4 pr-8 text-left text-stone">
                    TYPE
                  </th>
                  <th className="text-label py-4 pr-8 text-left text-stone">AREA</th>
                  <th className="text-label py-4 pr-8 text-left text-stone">FLOOR</th>
                  <th className="text-label py-4 pr-8 text-left text-stone">PRICE</th>
                  <th className="text-label py-4 text-left text-stone">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="sticky left-0 bg-void py-4 pr-8">
                      <span className="text-body text-paper">{unit.type}</span>
                    </td>
                    <td className="py-4 pr-8">
                      <span className="text-body text-stone">{unit.area}</span>
                    </td>
                    <td className="py-4 pr-8">
                      <span className="text-body text-stone">{unit.floor}</span>
                    </td>
                    <td className="py-4 pr-8">
                      <span className="text-body text-stone">{unit.price}</span>
                    </td>
                    <td className="py-4">
                      <span className={cn('text-label', unitStatusColor[unit.status])}>
                        {unitStatusLabel[unit.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeUp>
      </GridWrapper>
    </Section>
  );
}
