import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  metaInfo?: string[];
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  metaInfo,
  action
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-4 border-b border-[#EDF1F4]">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#14283F]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-[#687684] mt-0.5">
            {subtitle}
          </p>
        )}
        {metaInfo && metaInfo.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#687684] mt-1 font-mono">
            {metaInfo.map((item, idx) => (
              <React.Fragment key={idx}>
                <span>{item}</span>
                {idx < metaInfo.length - 1 && <span aria-hidden="true" className="text-slate-300">·</span>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};
