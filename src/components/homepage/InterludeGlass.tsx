import styles from './Interlude.module.css';

export const GLASS_INSETS = [9, 19.5, 30];

/** Only the optical bevels redraw pixels; every glass face stays transparent. */
export default function InterludeGlass() {
  return (
    <div data-glass-bounds aria-hidden="true" className={styles.glassBounds}>
      {GLASS_INSETS.map((inset, index) => (
        <div key={inset} data-glass-pane={index} className={styles.glassPane}>
          <canvas data-glass-rim className={styles.glassRim} />
        </div>
      ))}
    </div>
  );
}
