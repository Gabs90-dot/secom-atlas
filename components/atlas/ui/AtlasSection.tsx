import type { ReactNode } from "react";
import { atlasDesign } from "@/lib/designSystem";

type AtlasSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function AtlasSection({ eyebrow, title, description, action, children, className = "" }: AtlasSectionProps) {
  return (
    <section className={`${atlasDesign.card.base} ${className}`}>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          {eyebrow && <p className={atlasDesign.typography.eyebrow}>{eyebrow}</p>}
          <h2 className={`mt-2 ${atlasDesign.typography.sectionTitle}`}>{title}</h2>
          {description && <p className={`mt-2 ${atlasDesign.typography.body}`}>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
