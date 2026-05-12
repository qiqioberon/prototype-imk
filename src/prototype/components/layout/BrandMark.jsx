import { cx } from "../../lib/format.js";

export function BrandMark({ small = false, light = false }) {
  const size = small ? "h-12 w-12" : "h-24 w-24";
  return (
    <div className={cx("relative shrink-0 rounded-[28px]", size, light ? "bg-white/15" : "bg-white shadow-sm")}>
      <div
        className={cx(
          "absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-[22px]",
          light ? "bg-white/15" : "bg-[#EAF7F8]"
        )}
      />
      <div className={cx("absolute left-[20%] top-[18%] font-black tracking-tight text-[#082B5C]", small ? "text-lg" : "text-[2.1rem]")}>F</div>
      <div className={cx("absolute right-[18%] top-[18%] font-black tracking-tight text-[#1C9AA0]", small ? "text-lg" : "text-[2.1rem]")}>T</div>
      <div className="absolute bottom-[20%] left-1/2 flex -translate-x-1/2 items-end gap-[3px]">
        {[16, 24, 34, 24, 16].map((h, idx) => (
          <span key={idx} className={cx("rounded-full bg-[#1C9AA0]", small ? "w-[3px]" : "w-[4px]")} style={{ height: small ? h * 0.45 : h }} />
        ))}
      </div>
    </div>
  );
}
