export default function SectionHeading({ eyebrow, title, description }) {
  return <div className="mb-8 sm:mb-10">
    {eyebrow && <p className="mb-2 text-sm font-semibold text-pink-700">{eyebrow}</p>}
    <h1 className="font-display text-[clamp(1.9rem,5vw,2.75rem)] font-extrabold leading-[1.2] tracking-[-.03em] text-clay-800">{title}</h1>
    {description && <p className="mt-2 max-w-[68ch] text-base leading-relaxed text-muted">{description}</p>}
  </div>;
}
