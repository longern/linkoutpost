import type { ProfileLayout } from "../../../profile";
import { ProfileCardLayoutEditor } from "./ProfileCardLayoutEditor";
import { ProfileInfoLayoutEditor } from "./ProfileInfoLayoutEditor";
import type {
  ProfileLayoutEditorDefinition,
  ProfileLayoutEditorProps,
} from "./ProfileLayoutEditor";
import type { ComponentType } from "react";

const profileLayoutEditorDefinitions: readonly ProfileLayoutEditorDefinition[] = [
  { Editor: ProfileCardLayoutEditor, id: "card" },
  { Editor: ProfileInfoLayoutEditor, id: "info" },
];

const profileLayoutEditorById = new Map(
  profileLayoutEditorDefinitions.map((definition) => [
    definition.id,
    definition.Editor,
  ]),
);

export function getProfileLayoutEditor(
  layout: ProfileLayout,
): ComponentType<ProfileLayoutEditorProps> | null {
  return profileLayoutEditorById.get(layout) ?? null;
}
