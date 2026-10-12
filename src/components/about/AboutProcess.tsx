import RevealFrame from '@/components/animations/RevealFrame';
import ImageFootnote from '@/components/ui/ImageFootnote';
import { PROCESS_IMAGES } from '@/lib/content/requested-images';
import type { RequestedImage } from '@/lib/content/requested-images';
import { imageSrcSet, imageUrl } from '@/lib/sanity/image';
import styles from './AboutProcess.module.css';

function Plate({ image, range, sizes }: { image: RequestedImage; range: number; sizes: string }) {
  const over = range * 2 + 4;
  return (
    <RevealFrame nav="dark" className={styles.frame}>
      <div
        data-pan={range}
        className="absolute inset-x-0"
        style={{ top: `-${over / 2}%`, height: `${100 + over}%` }}
      >
        <img
          src={image.image ? imageUrl(image.image, { width: 2000 }) : image.src}
          srcSet={image.image ? imageSrcSet(image.image) : image.srcSet}
          width={image.width}
          height={image.height}
          sizes={sizes}
          alt={image.caption}
          loading="lazy"
          decoding="async"
          className="block h-full w-full object-cover"
        />
      </div>
      <ImageFootnote>{image.caption}</ImageFootnote>
    </RevealFrame>
  );
}

function Copy({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <h3 data-heading className={styles.heading}>
        <span data-heading-line>{title}</span>
      </h3>
      <p data-write className={styles.paragraph}>
        {children}
      </p>
    </>
  );
}

/** Three different scales and speeds on the existing page grid. */
export default function AboutProcess() {
  return (
    <div data-about-process className={styles.process}>
      <article
        data-process-step="build"
        className={`${styles.row} ${styles.build}`}
        aria-label="Build"
      >
        <div className={styles.media}>
          <Plate
            image={PROCESS_IMAGES.build}
            range={5}
            sizes="(min-width: 1024px) 60vw, (min-width: 640px) 68vw, 100vw"
          />
        </div>
        <div data-process-motion="90" className={styles.copy}>
          <Copy title="Build">
            We run the site — the materials, the contractors, the sequence, the standard.
          </Copy>
        </div>
      </article>
      <article
        data-process-step="draw"
        className={`${styles.row} ${styles.draw}`}
        aria-label="Draw"
      >
        <div data-process-motion="55" className={styles.copy}>
          <Copy title="Draw">
            We read the site, the brief and the light, and draw until the plan is resolved.
          </Copy>
        </div>
        <div data-process-motion="-140" className={styles.media}>
          <Plate
            image={PROCESS_IMAGES.draw}
            range={9}
            sizes="(min-width: 1024px) 28vw, (min-width: 640px) 34vw, 68vw"
          />
        </div>
      </article>
      <article
        data-process-step="handover"
        className={`${styles.row} ${styles.handover}`}
        aria-label="Hand over"
      >
        <div data-process-motion="40" className={styles.media}>
          <Plate
            image={PROCESS_IMAGES.handover}
            range={4}
            sizes="(min-width: 1024px) 60vw, 100vw"
          />
        </div>
        <div data-process-motion="-80" className={styles.copy}>
          <Copy title="Hand over">
            We finish the building, snag it ourselves, and give you the keys.
          </Copy>
        </div>
      </article>
    </div>
  );
}
