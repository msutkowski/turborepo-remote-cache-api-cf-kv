import { Bindings } from "@/types";

declare global {
  function getMiniflareBindings(): Bindings;
}

export {};
