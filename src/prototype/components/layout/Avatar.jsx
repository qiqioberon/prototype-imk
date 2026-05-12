import { UserCircle2 } from "lucide-react";

export function Avatar() {
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EAF7F8] ring-1 ring-[#CDE4EA]">
      <UserCircle2 className="h-7 w-7 text-[#082B5C]" />
    </div>
  );
}
