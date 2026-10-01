import Image from "next/image";
import { Heart } from "lucide-react";

import { testimonials } from "@/components/homepage/data";

export function WallOfLove() {
  return (
    <section id="wall-of-love" className="w-full py-14 md:py-24 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-soft text-xs font-semibold text-rose border border-rose/30 shadow-2xs">
              <Heart className="w-3.5 h-3.5 fill-rose" />
              <span>Wall of love</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight leading-[1.12]">
              Trusted by job seekers
              <br />
              who were tired of applying
            </h2>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed md:text-right max-w-md">
            From first-time applicants to senior engineers — here is what people say once the
            noise stops and the matches start.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map((item) => (
            <figure
              key={item.id}
              className="relative rounded-[28px] overflow-hidden min-h-[440px] sm:min-h-[480px] flex flex-col justify-end p-6 shadow-md group transition-transform duration-300 hover:-translate-y-1.5"
            >
              <div className="absolute inset-0 z-0">
                <Image
                  src={item.image}
                  alt={`${item.name}, ${item.role}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-scrim/85 via-scrim/35 to-transparent" />
              </div>

              <figcaption className="relative z-10 space-y-3 text-inverse-foreground">
                <p className="text-sm sm:text-[15px] font-medium leading-relaxed tracking-tight text-inverse-foreground/95">
                  {item.quote}
                </p>
                <p className="text-xs font-semibold text-inverse-foreground/80 tracking-wide">
                  — {item.name} <span className="text-inverse-foreground/50 font-normal">·</span> {item.role}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
