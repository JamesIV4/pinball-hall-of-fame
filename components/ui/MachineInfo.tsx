import { Machine } from "../../types/types";

interface MachineInfoProps {
  machine: Machine;
  imageSize?: "sm" | "md" | "lg";
  showUrl?: boolean;
  hideName?: boolean;
}

const imageSizes = {
  sm: "w-12 h-[5.5rem]",
  md: "w-16 h-28",
  lg: "w-24 h-44",
};

export default function MachineInfo({
  machine,
  imageSize = "sm",
  showUrl = false,
  hideName = false,
}: MachineInfoProps) {
  return (
    <div className="flex items-center gap-3">
      {machine.image && (
        <img src={machine.image} alt={machine.name} className={`${imageSizes[imageSize]} object-cover rounded-md`} />
      )}
      {!hideName && (
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate" title={machine.name}>
            {machine.name}
          </div>
          {showUrl && machine.image && (
            <div className="text-xs text-gray-400 truncate" title={machine.image}>
              {machine.image}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
