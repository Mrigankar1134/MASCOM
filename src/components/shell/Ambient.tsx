/**
 * The slow colour wash behind the glass. It belongs on the marketing and
 * sign-in surfaces; app screens like the shop and the console keep the flat
 * system background, the way Settings does.
 */
export function Ambient() {
  return (
    <>
      <div className="aurora" aria-hidden>
        <span />
      </div>
      <div className="grain" aria-hidden />
    </>
  )
}
