import type { ComponentType } from "react";
import type { LinkProfile, ProfileLayout, ProfileTheme } from "../../../profile";

export type ProfileLayoutEditorProps = {
  onCommitTheme(patch: Partial<ProfileTheme>): void;
  onSave(): void;
  onUpdateTheme(patch: Partial<ProfileTheme>): void;
  profile: LinkProfile;
};

export type ProfileLayoutEditorDefinition = {
  Editor: ComponentType<ProfileLayoutEditorProps>;
  id: ProfileLayout;
};
