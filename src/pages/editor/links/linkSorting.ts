import { arrayMove } from "@dnd-kit/sortable";
import type { LinkItem } from "../../../profile";

export function moveLinksById(
  links: LinkItem[],
  activeId: string,
  overId: string,
): LinkItem[] {
  const activeIndex = links.findIndex((link) => link.id === activeId);
  const overIndex = links.findIndex((link) => link.id === overId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return links;
  }

  return arrayMove(links, activeIndex, overIndex);
}
