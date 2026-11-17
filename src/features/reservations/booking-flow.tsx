import { CalendarDays } from 'lucide-react'
import { motion, MotionConfig, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'

import { dateLabel, hourLabel } from '../../shared/format'
import { spring } from '../../shared/motion'
import { InlineError } from '../../shared/ui'
import { BookingDatePicker } from './booking-date-picker'
import { BookingActions } from './booking/booking-actions'
import { BookingConfirmation } from './booking/booking-confirmation'
import { BookingCourtStep } from './booking/booking-court-step'
import { BookingHourStep } from './booking/booking-hour-step'
import { BookingProgress, bookingSteps } from './booking/booking-progress'
import { BookingReview } from './booking/booking-review'
import { useBookingFlow, type BookingFlowProps } from './use-booking-flow'

export function BookingFlow(props: BookingFlowProps) {
  const flow = useBookingFlow(props)
  const { step, confirmed, command, admin, date, hour, court } = flow
  const heading = useRef<HTMLHeadingElement>(null)
  const mounted = useRef(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (mounted.current) {
      heading.current?.focus({ preventScroll: true })
      heading.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
    }
    mounted.current = true
  }, [step, confirmed])
  if (confirmed)
    return (
      <BookingConfirmation
        reservation={confirmed}
        editing={!!props.reservation}
        admin={admin}
        playerName={flow.player?.name}
        headingRef={heading}
        onClose={props.onClose}
        onRestart={flow.restart}
      />
    )

  return (
    <section
      className="min-w-0"
      aria-label={admin ? 'Gestionar reserva' : 'Reservar una pista'}
      aria-busy={command.busy}
    >
      <BookingProgress step={step} busy={command.busy} onChange={flow.setStep} />
      <MotionConfig reducedMotion="user">
        <motion.fieldset
          className="desktop:py-4 m-0 min-w-0 border-0 px-0 py-3"
          key={step}
          disabled={command.busy}
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.slow}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="sr-only">Paso {step + 1} de 4</p>
              <h2
                ref={heading}
                tabIndex={-1}
                className="scroll-mt-[calc(var(--app-header-height)+12px)] scroll-mb-[calc(var(--mobile-nav-height)+88px)] text-base outline-none"
              >
                {bookingSteps[step].title}
              </h2>
            </div>
          </div>
          {step > 0 && step < 3 && (
            <p className="text-green-mid mb-3 flex flex-wrap items-center gap-1.5 text-xs">
              <CalendarDays size={16} />
              {dateLabel(date, { weekday: 'long', day: 'numeric', month: 'long' })}
              {hour !== null && step > 1 && (
                <>
                  {' '}
                  · {hourLabel(hour)} – {hourLabel(hour + 1)}
                </>
              )}
            </p>
          )}
          {step === 0 && (
            <BookingDatePicker
              date={date}
              onChange={flow.changeDate}
              excludeId={props.reservation?.id}
            />
          )}
          {step === 1 && (
            <BookingHourStep
              date={date}
              hour={hour}
              hours={flow.hours}
              now={flow.now}
              onChange={flow.changeHour}
            />
          )}
          {step === 2 && (
            <BookingCourtStep court={court} freeCourts={flow.freeCourts} onChange={flow.setCourt} />
          )}
          {step === 3 && (
            <BookingReview
              date={date}
              hour={hour}
              court={court}
              admin={admin}
              memberId={flow.memberId}
              eligible={flow.eligible}
              playerName={flow.player?.name}
              validSlot={flow.validSlot}
              validMember={flow.validMember}
              onStepChange={flow.setStep}
              onMemberChange={flow.setMemberId}
            />
          )}
        </motion.fieldset>
      </MotionConfig>
      <InlineError>{command.error}</InlineError>
      <BookingActions
        step={step}
        date={date}
        busy={command.busy}
        editing={!!props.reservation}
        hasHours={flow.hasHours}
        validSlot={flow.validSlot}
        validMember={flow.validMember}
        onStepChange={flow.setStep}
        onConfirm={() => void flow.confirm()}
      />
    </section>
  )
}
