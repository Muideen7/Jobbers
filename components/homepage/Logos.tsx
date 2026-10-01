type IconProps = {
  className?: string;
};

export function JobbersIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
      </g>
    </svg>
  );
}

const companyLogos: Record<string, string> = {
  google:
    "M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17zM12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24zM5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15zM12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z",
  meta: "M12 15.26c-1.78 2.65-3.32 4.24-5.32 4.24-2.73 0-4.68-2.6-4.68-6.7 0-4.52 2.37-7.3 5.37-7.3 2.1 0 3.51 1.48 4.63 3.67 1.12-2.19 2.53-3.67 4.63-3.67 3 0 5.37 2.78 5.37 7.3 0 4.1-1.95 6.7-4.68 6.7-2 0-3.54-1.59-5.32-4.24zm0-2.85c1.47-2.6 2.76-4.41 4.34-4.41 1.77 0 3.03 1.87 3.03 5.3 0 3.1-1.12 4.7-2.68 4.7-1.48 0-2.78-1.53-4.69-5.59zm-4.34-4.41c1.58 0 2.87 1.81 4.34 4.41-1.91 4.06-3.21 5.59-4.69 5.59-1.56 0-2.68-1.6-2.68-4.7 0-3.43 1.26-5.3 3.03-5.3z",
  gitlab:
    "M12 21.5l3.8-11.7H8.2L12 21.5zM12 21.5L8.2 9.8H1.3l10.7 11.7zM1.3 9.8l-1 3.2c-.2.7 0 1.5.6 1.9L12 21.5 1.3 9.8zM1.3 9.8h6.9L5.3 1.2c-.3-.9-1.5-.9-1.8 0L1.3 9.8zM12 21.5l3.8-11.7h6.9L12 21.5zM22.7 9.8l1 3.2c.2.7 0 1.5-.6 1.9L12 21.5l10.7-11.7zM22.7 9.8h-6.9l2.9-8.6c.3-.9 1.5-.9 1.8 0l2.2 8.6z",
  microsoft:
    "M1 1h10v10H1V1zm12 0h10v10H13V1zM1 13h10v10H1V13zm12 0h10v10H13V13z",
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  github:
    "M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2.1c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z",
  amazon:
    "M6.2 14.3c.5.6 1.2 1 2.1 1 1 0 1.6-.3 2.1-.8.4-.4.6-1 .8-2l.4-2.1h-4.2v-1h5.2l-.8 4.6c-.2 1.1-.4 1.7-.9 2.3-.6.7-1.5 1-2.6 1-1.2 0-2.2-.4-2.9-1.2-.6-.6-.9-1.3-.9-2 0-.4.1-.7.1-.9z",
};

/**
 * Documented exception to the no-hardcoded-hex rule: these are third-party
 * trademark colours (Meta blue, the Microsoft four-square mark), not Jobbers
 * design surfaces. Recolouring them would misrepresent the brands, so they
 * stay literal. Everything that is ours uses a token.
 */
const companyFills: Record<string, string> = {
  google: "",
  meta: "#0081FB",
  gitlab: "",
  microsoft: "",
  x: "currentColor",
  github: "currentColor",
  amazon: "currentColor",
};

export function CompanyLogo({
  type,
  className = "w-5 h-5",
}: IconProps & { type: string }) {
  const path = companyLogos[type.toLowerCase()];
  const fill = companyFills[type.toLowerCase()];

  if (!path) {
    return null;
  }

  const isMicrosoft = type.toLowerCase() === "microsoft";

  if (isMicrosoft) {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <rect x="1" y="1" width="10" height="10" fill="#F25022" />
        <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
        <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
        <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} fill={fill || "currentColor"} />
    </svg>
  );
}
