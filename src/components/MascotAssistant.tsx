import React from 'react';
import { AssistantMascot, AssistantMascotProps, MascotState } from './AssistantMascot';

export type { MascotState };
export type MascotAssistantProps = AssistantMascotProps;

export const MascotAssistant: React.FC<MascotAssistantProps> = (props) => {
  return <AssistantMascot {...props} />;
};

export default MascotAssistant;
