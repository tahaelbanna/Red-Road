import { type ScientificTarget } from "../interfaces/index";

export interface TargetPresentation {
  isRegion: boolean;
  isPublished: boolean;
  icon: string;
  accuracyText: string;
  explorerSubtitle: string;
  color: string;
}

export function getTargetPresentation(
  target?: Partial<ScientificTarget>,
): TargetPresentation {
  const isRegion = target?.category === "region";
  const isPublished = target?.position_accuracy === "published";

  let icon = "●";
  let accuracyText = "Representative Location";
  let color = "var(--critical)";

  if (isRegion) {
    icon = "◇";
    accuracyText = "Region / Campaign Area";
    color = "var(--text)";
  } else if (isPublished) {
    icon = "○";
    accuracyText = "Published Coordinate";
    color = "var(--warning)";
  }

  const explorerSubtitle = isRegion
    ? "Geological Area"
    : isPublished
      ? "Published Coordinate"
      : "Representative Location";

  return {
    isRegion,
    isPublished,
    icon,
    accuracyText,
    explorerSubtitle,
    color,
  };
}
