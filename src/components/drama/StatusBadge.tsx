import { DRAMA_STATUS_MAP } from "@/types/drama";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const { t } = useLanguage();
  const mapped = DRAMA_STATUS_MAP[status];
  if (!mapped) return null;

  return (
    <span className={`text-xs font-medium ${mapped.color}`}>
      {t(mapped.ko, status)}
    </span>
  );
}
