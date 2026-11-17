import { Clock3 } from 'lucide-react'

import { Panel, SectionHeading } from '../../shared/ui'
import type { OpeningDay } from '../club/domain/model'
import { CopyScheduleDialog } from './copy-schedule-dialog'
import { OpeningDayEditor } from './opening-day-editor'

export function WeeklySchedulePanel({
  weekly,
  onChange,
}: {
  weekly: OpeningDay[]
  onChange: (weekly: OpeningDay[]) => void
}) {
  function copy(source: number, targets: number[]) {
    const intervals = weekly.find((day) => day.day === source)!.intervals
    onChange(
      weekly.map((day) =>
        targets.includes(day.day) ? { ...day, intervals: structuredClone(intervals) } : day,
      ),
    )
  }
  return (
    <Panel className="pb-5">
      <SectionHeading
        title={
          <>
            <Clock3 size={20} />
            Horarios de apertura
          </>
        }
      />
      <div className="max-desktop:[&>.button]:w-full desktop:px-6 flex flex-wrap items-center justify-between gap-3 px-4 pb-4">
        <CopyScheduleDialog weekly={weekly} onApply={copy} />
      </div>
      <div className="desktop:px-6 px-4">
        {[1, 2, 3, 4, 5, 6, 0].map((day) => (
          <OpeningDayEditor
            key={day}
            value={weekly.find((value) => value.day === day)!}
            onChange={(value) => onChange(weekly.map((item) => (item.day === day ? value : item)))}
          />
        ))}
      </div>
    </Panel>
  )
}
